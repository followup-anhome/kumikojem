/**
 * matcher.ts
 * TalentとJobの相性を 0〜100 点でスコアリングし、
 * 近隣のアンホーム物件IDを含むレコメンドを返す。
 *
 * スコアリング設計:
 * ┌─────────────────────────────────────────────────────────┐
 * │ 基礎点 (45pt)  求人カテゴリ × Talent属性の適合          │
 * │ 給与点 (15pt)  希望給与 ≤ 求人給与なら満点              │
 * │ 資格点 (20pt)  保有資格 × 職種必要資格のマッチ数        │
 * │ 体格点 (10pt)  LOGISTICS/CONSTRUCTION は身長加点        │
 * │ FB解析 (10pt)  FBプロフから体力・性格を推定             │
 * │ 緊急補正       LOGISTICS + critical_need → スコア×1.2   │
 * └─────────────────────────────────────────────────────────┘
 */

import { calcDistanceKm } from "./geo-matcher";

// ─────────────────────────────────────────
// 入力型（Prismaモデルのサブセット）
// ─────────────────────────────────────────
export interface TalentInput {
  id: string;
  name: string;
  height_cm: number | null;
  weight_kg: number | null;
  certificates: string[];         // 例: ["N3", "フォークリフト", "大型二種"]
  desired_salary_min: number | null;
  suitability_score: number;      // 既存スコア (0.0〜1.0)
  years_experience?: number;      // 関連業務経験年数 (optional)
  fb_vitality_score?: number;     // FBプロフ解析スコア (0.0〜1.0, optional)
}

export interface JobInput {
  id: string;
  title: string;
  category: "LOGISTICS" | "CONSTRUCTION" | "CARE" | "FACTORY";
  salary_min: number | null;
  salary_max: number | null;
  location_lat: number;
  location_lng: number;
  housing_status: boolean;
  critical_need?: boolean; // 2024問題などの緊急採用フラグ → スコア×1.2
}

export interface PropertyInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rent: number;
}

export interface MatchResult {
  talent_id: string;
  job_id: string;
  /** 総合スコア 0〜100 */
  score: number;
  breakdown: {
    base: number;        // 基礎点 (0〜45)
    salary: number;      // 給与点 (0〜15)
    certificate: number; // 資格点 (0〜20)
    physique: number;    // 体格点 (0〜10)
    fb_analysis: number; // FB解析点 (0〜10)
  };
  /** 3km以内のアンホーム物件ID一覧（距離昇順） */
  recommended_property_ids: string[];
  notes: string[];
}

// ─────────────────────────────────────────
// 職種別 必要資格マスター
// ─────────────────────────────────────────
const REQUIRED_CERTS: Record<string, string[]> = {
  LOGISTICS: [
    "フォークリフト", "大型免許", "大型二種", "普通免許", "中型免許",
    "危険物取扱", "玉掛け",
  ],
  CONSTRUCTION: [
    "玉掛け", "足場", "クレーン", "溶接", "電気工事士",
    "施工管理技士", "土木施工管理",
  ],
  CARE: [
    "介護福祉士", "介護職員初任者研修", "実務者研修",
    "社会福祉士", "ホームヘルパー", "N3", "N2",
  ],
  FACTORY: [
    "危険物取扱", "フォークリフト", "溶接", "電気工事士",
    "品質管理", "食品衛生", "衛生管理者",
  ],
};

// ─────────────────────────────────────────
// メイン: スコアリング関数
// ─────────────────────────────────────────

/**
 * 1人のTalentと1つのJobのマッチスコアを計算する
 *
 * @param talent  人材データ
 * @param job     求人データ
 * @param properties 全物件リスト（近隣推薦に使用）
 * @param propertyRadiusKm 推薦物件の検索半径（デフォルト3km）
 */
export function calcMatchScore(
  talent: TalentInput,
  job: JobInput,
  properties: PropertyInput[] = [],
  propertyRadiusKm = 3
): MatchResult {
  const notes: string[] = [];

  // ── 1. 基礎点 (0〜45) ────────────────────────────────
  // 適性スコア (0.0〜1.0 → 0〜20pt)
  let base = Math.round(talent.suitability_score * 20);

  // 経験年数ボーナス (0〜25pt): 1年=2.5pt, 上限10年
  const expYears = talent.years_experience ?? 0;
  const expBonus = Math.min(Math.round(expYears * 2.5), 25);
  base += expBonus;

  base = clamp(base, 0, 45);

  if (expYears >= 5) notes.push(`経験${expYears}年: ベテランボーナス (+${expBonus}pt)`);
  else if (expYears >= 2) notes.push(`経験${expYears}年 (+${expBonus}pt)`);
  if (base > 38) notes.push("プロフィール適合度: 高");

  // ── 2. 給与点 (0〜15) ────────────────────────────────
  let salary = 0;
  const jobSalary = calcSalaryMid(job.salary_min, job.salary_max);
  const desiredSalary = talent.desired_salary_min;

  if (jobSalary !== null && desiredSalary !== null) {
    if (jobSalary >= desiredSalary) {
      salary = 15;
      notes.push(`給与条件: 充足 (求人${jobSalary.toLocaleString()}円 ≥ 希望${desiredSalary.toLocaleString()}円)`);
    } else {
      const ratio = jobSalary / desiredSalary;
      salary = Math.round(15 * Math.max(0, ratio - 0.7) / 0.3);
      if (salary === 0) notes.push("給与条件: 希望額を大きく下回る");
    }
  } else {
    salary = 7; // 不明は中間値
  }

  // ── 3. 資格点 (0〜20) ────────────────────────────────
  const requiredCerts = REQUIRED_CERTS[job.category] ?? [];
  const matchedCerts = talent.certificates.filter((c) =>
    requiredCerts.some((r) => c.includes(r) || r.includes(c))
  );
  const certRatio = requiredCerts.length > 0
    ? matchedCerts.length / Math.min(requiredCerts.length, 3)
    : 0;
  const certificate = clamp(Math.round(certRatio * 20), 0, 20);

  if (matchedCerts.length > 0) {
    notes.push(`保有資格マッチ: ${matchedCerts.join(", ")}`);
  }

  // ── 4. 体格点 (0〜10) — LOGISTICS / CONSTRUCTION 特有 ──
  let physique = 0;

  if (job.category === "LOGISTICS") {
    if (talent.height_cm !== null && talent.height_cm >= 170) {
      physique += 10;
      notes.push("身長170cm以上: 運送業適性あり");
    }
    const hasForklift = talent.certificates.some((c) => c.includes("フォークリフト"));
    if (hasForklift) {
      physique += 5;
      notes.push("フォークリフト資格: 即戦力ボーナス");
    }
  } else if (job.category === "CONSTRUCTION") {
    if (
      talent.height_cm !== null &&
      talent.weight_kg !== null &&
      talent.height_cm >= 165 &&
      talent.weight_kg >= 55
    ) {
      physique += 10;
      notes.push("体格: 建設現場適性あり");
    }
    if (talent.weight_kg !== null && talent.weight_kg >= 60) {
      physique += 5;
      notes.push("体重60kg以上: 重労働適性あり");
    }
  } else if (job.category === "CARE") {
    const hasJlpt = talent.certificates.some((c) => /N[1-3]|日本語能力試験/.test(c));
    if (hasJlpt) {
      physique += 15;
      notes.push("日本語資格 (N3以上): 介護コミュニケーション適性");
    }
  }

  physique = clamp(physique, 0, 10);

  // ── 5. FB解析点 (0〜10) ───────────────────────────────
  let fb_analysis = 0;
  if (talent.fb_vitality_score !== undefined && talent.fb_vitality_score !== null) {
    fb_analysis = clamp(Math.round(talent.fb_vitality_score * 10), 0, 10);
    if (fb_analysis >= 8) {
      notes.push(`FB解析: 体力・明るさ高評価 (${Math.round(talent.fb_vitality_score * 100)}点)`);
    } else if (fb_analysis >= 5) {
      notes.push(`FB解析: 標準的なプロフィール (${Math.round(talent.fb_vitality_score * 100)}点)`);
    }
  }

  // ── 6. 総合スコア計算 ──────────────────────────────────
  let score = clamp(base + salary + certificate + physique + fb_analysis, 0, 100);

  // ── 7. 緊急採用ボーナス (2024問題対応) ────────────────
  // LOGISTICS × critical_need フラグがある場合、スコアを1.2倍（上限100）
  if (job.critical_need && job.category === "LOGISTICS") {
    const boosted = Math.min(100, Math.round(score * 1.2));
    if (boosted > score) {
      notes.push(`🚨 2024問題対象: スコア×1.2 (${score}pt → ${boosted}pt)`);
      score = boosted;
    }
  }

  // ── 8. 近隣物件推薦（3km以内） ────────────────────────
  const jobPoint = { lat: job.location_lat, lng: job.location_lng };
  const nearbyProperties = properties
    .map((p) => ({
      ...p,
      distance_km: calcDistanceKm(jobPoint, { lat: p.lat, lng: p.lng }),
    }))
    .filter((p) => p.distance_km <= propertyRadiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  if (nearbyProperties.length > 0) {
    notes.push(`勤務地${propertyRadiusKm}km以内の物件: ${nearbyProperties.length}件推薦`);
  } else if (job.housing_status) {
    notes.push("社宅・寮あり（物件DB未登録）");
  }

  return {
    talent_id: talent.id,
    job_id: job.id,
    score,
    breakdown: { base, salary, certificate, physique, fb_analysis },
    recommended_property_ids: nearbyProperties.map((p) => p.id),
    notes,
  };
}

// ─────────────────────────────────────────
// 複数Talent × 1Job のバッチスコアリング
// ─────────────────────────────────────────

/**
 * 複数の人材を一つの求人に対してスコアリングし、
 * スコア降順でソートして返す
 */
export function rankTalentsForJob(
  talents: TalentInput[],
  job: JobInput,
  properties: PropertyInput[] = [],
  propertyRadiusKm = 3
): MatchResult[] {
  return talents
    .map((t) => calcMatchScore(t, job, properties, propertyRadiusKm))
    .sort((a, b) => b.score - a.score);
}

/**
 * 1人の人材を複数の求人に対してスコアリングし、
 * スコア降順でソートして返す
 */
export function rankJobsForTalent(
  talent: TalentInput,
  jobs: JobInput[],
  properties: PropertyInput[] = [],
  propertyRadiusKm = 3
): MatchResult[] {
  return jobs
    .map((j) => calcMatchScore(talent, j, properties, propertyRadiusKm))
    .sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────

function calcSalaryMid(
  min: number | null,
  max: number | null
): number | null {
  if (min !== null && max !== null) return Math.round((min + max) / 2);
  return min ?? max ?? null;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
