/**
 * fb-analyzer.ts
 * Facebook プロフィール URL から人材特性を推定するシミュレーター。
 *
 * ⚠️  NOTE: これはシミュレーション実装です。
 * 本番では Facebook Graph API + Vision AI (GPT-4o) でプロフ画像・投稿を解析します。
 * 現在は URL のハッシュ値から決定論的なスコアを生成し、
 * 実際の AI 解析と同等のデータ構造を返します。
 */

// ─── 出力型 ────────────────────────────────────────────────
export interface FBAnalysisResult {
  /** 体力・活力スコア (0.0〜1.0) */
  vitality_score: number;
  /** 明るさ・社交性スコア (0.0〜1.0) */
  personality_score: number;
  /** 誠実性・信頼性スコア (0.0〜1.0) */
  reliability_score: number;
  /** 総合FBスコア (0.0〜1.0) — 上記3つの加重平均 */
  overall_fb_score: number;
  /** 推定タグ一覧 */
  tags: FBTag[];
  /** 判定サマリー (英語) */
  summary: string;
  /** シミュレーションフラグ (本番実装では false になる) */
  simulated: true;
  /** 解析対象URL */
  analyzed_url: string;
}

export interface FBTag {
  label: string;
  emoji: string;
  type: "positive" | "neutral" | "needs_attention";
}

// ─── FB スコア → matcher.ts の fb_vitality_score への変換係数 ──
// vitality (0.5) + personality (0.3) + reliability (0.2) の加重
const WEIGHT = { vitality: 0.5, personality: 0.3, reliability: 0.2 };

// ─── 決定論的ハッシュ関数 ────────────────────────────────
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // 32bit integer
  }
  return Math.abs(hash);
}

/** 0.0〜1.0 の範囲に正規化（最小値を min に固定） */
function normalizeScore(hash: number, salt: number, min = 0.45): number {
  const raw = ((hash ^ salt) % 1000) / 1000;
  return min + raw * (1 - min);
}

// ─── タグプール ───────────────────────────────────────────
const POSITIVE_TAGS: FBTag[] = [
  { label: "High Energy",      emoji: "⚡", type: "positive" },
  { label: "Team Player",      emoji: "🤝", type: "positive" },
  { label: "Outgoing",         emoji: "😊", type: "positive" },
  { label: "Active Lifestyle", emoji: "🏃", type: "positive" },
  { label: "Family-Oriented",  emoji: "👨‍👩‍👧", type: "positive" },
  { label: "Hardworking",      emoji: "💪", type: "positive" },
  { label: "Positive Mindset", emoji: "✨", type: "positive" },
  { label: "Reliable",         emoji: "🎯", type: "positive" },
  { label: "Adaptable",        emoji: "🌏", type: "positive" },
];

const NEUTRAL_TAGS: FBTag[] = [
  { label: "Introvert",        emoji: "📚", type: "neutral" },
  { label: "Private Profile",  emoji: "🔒", type: "neutral" },
  { label: "Low Activity",     emoji: "💤", type: "neutral" },
];

const NEEDS_ATTENTION_TAGS: FBTag[] = [
  { label: "Irregular Posts",  emoji: "⚠️", type: "needs_attention" },
  { label: "Limited Info",     emoji: "🔍", type: "needs_attention" },
];

// ─── メイン: プロフィール解析 ──────────────────────────────

/**
 * Facebook プロフィール URL を解析してスコアを返す（シミュレーション）
 *
 * @param url  Facebook プロフィール URL (例: "https://facebook.com/juan.delacruz")
 */
export function analyzeFBProfile(url: string): FBAnalysisResult {
  const hash = djb2Hash(url);

  const vitality    = normalizeScore(hash, 0x1a2b3c, 0.40);
  const personality = normalizeScore(hash, 0x4d5e6f, 0.40);
  const reliability = normalizeScore(hash, 0x7a8b9c, 0.45);

  const overall = Math.round(
    (vitality * WEIGHT.vitality +
      personality * WEIGHT.personality +
      reliability * WEIGHT.reliability) * 1000
  ) / 1000;

  // タグ選定: ハッシュ値で決定論的に選ぶ
  const tags: FBTag[] = [];

  // positiveタグを2〜3個
  const positiveCount = 2 + (hash % 2);
  for (let i = 0; i < positiveCount; i++) {
    tags.push(POSITIVE_TAGS[(hash + i * 137) % POSITIVE_TAGS.length]);
  }

  // overall >= 0.7 なら全部 positive、< 0.55 なら neutral/attention を混ぜる
  if (overall >= 0.70) {
    tags.push(POSITIVE_TAGS[(hash * 3 + 17) % POSITIVE_TAGS.length]);
  } else if (overall < 0.55) {
    tags.push(NEUTRAL_TAGS[hash % NEUTRAL_TAGS.length]);
  } else {
    tags.push(NEUTRAL_TAGS[(hash * 7) % NEUTRAL_TAGS.length]);
  }

  // 重複排除
  const uniqueTags = Array.from(
    new Map(tags.map((t) => [t.label, t])).values()
  ).slice(0, 4);

  // サマリー生成
  const summary = generateSummary(vitality, personality, reliability, overall);

  return {
    vitality_score: round2(vitality),
    personality_score: round2(personality),
    reliability_score: round2(reliability),
    overall_fb_score: round2(overall),
    tags: uniqueTags,
    summary,
    simulated: true,
    analyzed_url: url,
  };
}

/** スコアからサマリー文章を生成 */
function generateSummary(
  vitality: number,
  personality: number,
  reliability: number,
  overall: number
): string {
  if (overall >= 0.80) {
    return "Excellent profile! This person appears highly active, social, and reliable — strong indicators for field work performance.";
  }
  if (overall >= 0.70) {
    return "Good profile. Shows positive energy and reliable traits. Well-suited for physical and team-oriented positions.";
  }
  if (overall >= 0.60) {
    return "Decent profile with some positive signals. Personality seems stable; physical energy indicators are moderate.";
  }
  if (vitality >= 0.65 && personality < 0.60) {
    return "High physical energy detected but limited social activity. May prefer independent work roles.";
  }
  return "Limited public activity found. Recommend a direct interview to better assess personality and work ethic.";
}

/** 小数2桁に丸める */
function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

// ─── スコアをパーセント表示に変換 ─────────────────────────
export function toPercent(score: number): number {
  return Math.round(score * 100);
}

/** FBAnalysisResult → matcher.ts の fb_vitality_score (0.0〜1.0) */
export function fbResultToMatcherScore(result: FBAnalysisResult): number {
  return result.overall_fb_score;
}
