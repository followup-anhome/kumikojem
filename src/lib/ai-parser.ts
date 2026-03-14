/**
 * ai-parser.ts
 * 求人票テキスト（PDF/画像から抽出済み）を OpenAI に渡し、
 * 構造化 JSON として返す関数群
 */

import OpenAI from "openai";
import { z } from "zod";

// ─────────────────────────────────────────
// 出力スキーマ定義 (Zod)
// ─────────────────────────────────────────
export const JobCategorySchema = z.enum([
  "LOGISTICS",
  "CONSTRUCTION",
  "CARE",
  "FACTORY",
]);

export const ParsedJobSchema = z.object({
  title: z.string().describe("職種・役職名"),
  category: JobCategorySchema.describe("職種カテゴリ"),
  salary_min: z.number().nullable().describe("月給下限（円）"),
  salary_max: z.number().nullable().describe("月給上限（円）"),
  location_name: z.string().describe("勤務地の住所・地名"),
  housing_status: z.boolean().describe("社宅・寮の提供有無"),
  company_name: z.string().nullable().describe("企業名"),
  description: z.string().nullable().describe("業務内容の要約"),
});

export type ParsedJob = z.infer<typeof ParsedJobSchema>;

// ─────────────────────────────────────────
// OpenAI クライアント初期化
// ─────────────────────────────────────────
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }
  return new OpenAI({ apiKey });
}

// ─────────────────────────────────────────
// メイン: テキストから求人データを抽出
// ─────────────────────────────────────────
const SYSTEM_PROMPT = `あなたは日本の求人票を解析する専門AIです。
ユーザーから渡される求人テキストを読み取り、以下のJSON形式で情報を抽出してください。

抽出ルール:
- title: 求人票に記載された職種名（例: "フォークリフトオペレーター"）
- category: LOGISTICS（運送・物流）/ CONSTRUCTION（建設・土木）/ CARE（福祉・介護）/ FACTORY（製造・工場）のいずれか
- salary_min / salary_max: 月給を数値（円）で。「〜」「以上」表記も解釈する。不明なら null
- location_name: 勤務地の住所または地名（都道府県市区町村まで）
- housing_status: 「社宅」「寮」「住居支援」等の記載があれば true
- company_name: 企業名（不明なら null）
- description: 業務内容を150字以内で要約

必ず有効な JSON のみを返してください。余計な説明は不要です。`;

/**
 * 求人テキストを解析して構造化データを返す
 * @param rawText 求人票の生テキスト
 * @returns ParsedJob
 */
export async function parseJobText(rawText: string): Promise<ParsedJob> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI からのレスポンスが空です");
  }

  const raw = JSON.parse(content);
  const result = ParsedJobSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `レスポンスのスキーマ検証に失敗: ${result.error.message}`
    );
  }

  return result.data;
}

// ─────────────────────────────────────────
// 拡張: Base64 画像 / PDF テキストから解析
// ─────────────────────────────────────────

/**
 * 求人票画像（Base64）を Vision API で解析する
 * @param base64Image Base64 エンコードされた画像データ
 * @param mimeType 画像の MIME タイプ（例: "image/jpeg"）
 */
export async function parseJobImage(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<ParsedJob> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "この求人票画像から情報を抽出してください。",
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI Vision からのレスポンスが空です");
  }

  const raw = JSON.parse(content);
  const result = ParsedJobSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `Visionレスポンスのスキーマ検証に失敗: ${result.error.message}`
    );
  }

  return result.data;
}

// ─────────────────────────────────────────
// カテゴリ推定ヘルパー（オフライン・高速版）
// 運送・建設業界の2024年問題対応キーワードを含む
// ─────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  LOGISTICS: [
    // 基本
    "配送", "運転", "ドライバー", "物流", "フォークリフト", "倉庫",
    // 運送業界特化
    "大型", "中型", "普通", "牽引", "トレーラー", "長距離", "チャーター",
    "幹線", "ルート配送", "センター", "ピッキング", "入出庫", "仕分け",
    "荷役", "積み込み", "積み下ろし", "パレット", "2024年問題",
    // 資格
    "大型免許", "中型免許", "フォーク免許", "玉掛け技能",
  ],
  CONSTRUCTION: [
    // 基本
    "建設", "土木", "施工", "現場", "鉄筋", "型枠", "溶接",
    // 建設業界特化
    "基礎工事", "躯体", "コンクリート", "配筋", "組立", "解体",
    "足場", "とび", "左官", "タイル", "防水", "電気工事", "配管",
    "鉄骨", "墨出し", "建込み", "掘削", "舗装", "マンション建設",
    // 資格
    "玉掛け", "高所作業車", "クレーン", "安全衛生",
  ],
  CARE: [
    "介護", "福祉", "ヘルパー", "看護", "デイサービス", "訪問",
    "グループホーム", "特養", "老健", "入浴介助", "食事介助",
    "排泄介助", "移乗", "認知症", "施設", "訪問介護", "居宅",
    "サービス提供責任者", "介護福祉士", "初任者研修", "実務者研修",
  ],
  FACTORY: [
    "製造", "工場", "ライン", "組立", "検査", "梱包", "加工",
    "プレス", "旋盤", "NC", "CNC", "溶接", "塗装", "食品加工",
    "半導体", "電子部品", "自動車部品", "流れ作業", "品質管理",
  ],
};

export function guessCategory(
  text: string
): z.infer<typeof JobCategorySchema> {
  const scores: Record<string, number> = {
    LOGISTICS: 0,
    CONSTRUCTION: 0,
    CARE: 0,
    FACTORY: 0,
  };

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) scores[cat]++;
    }
  }

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return (top[1] > 0 ? top[0] : "FACTORY") as z.infer<
    typeof JobCategorySchema
  >;
}

// ─────────────────────────────────────────
// Filipino向けリライト（オフライン版）
// 業界別テンプレートで求人をEN魅力化
// ─────────────────────────────────────────

const CATEGORY_PITCH: Record<string, { headline: string; detail: string; perks: string[] }> = {
  LOGISTICS: {
    headline: "🚛 Logistics & Warehouse Operator — Stable Hours, Great Pay!",
    detail:
      "Join a growing Japanese logistics team! You'll handle warehouse operations, forklift work, and shipment management. Day shifts only — no surprise late nights. Perfect for hardworking Filipinos who want a reliable income in Japan.",
    perks: ["Day shift (no night work)", "Overtime pay included", "Forklift license training available"],
  },
  CONSTRUCTION: {
    headline: "🏗️ Construction Site Worker — Top Salary in the Industry!",
    detail:
      "Be part of building Japan's future! This role involves rebar assembly, formwork, and general construction site work on major projects (apartments, commercial buildings). Experienced workers earn bonus allowances. Beginners welcome with on-site training!",
    perks: ["Experience bonus", "Site safety gear provided", "Career path to site supervisor"],
  },
  CARE: {
    headline: "🤝 Care Worker (Elderly Support) — Meaningful & Rewarding Work!",
    detail:
      "Make a real difference in someone's life every day! You'll support elderly residents with bathing, meals, and daily activities at a well-maintained facility. Filipino care workers are highly valued in Japan for their warmth and dedication.",
    perks: ["Almost no overtime", "Japanese language support", "Certificate sponsorship available"],
  },
  FACTORY: {
    headline: "🏭 Manufacturing Line Worker — Clean Environment, Steady Work!",
    detail:
      "Work in a modern Japanese factory with a great team! Tasks include assembly, quality inspection, and packaging. Clean indoor workplace, fixed hours, and friendly coworkers. Great for those who are detail-oriented and reliable.",
    perks: ["Fixed schedule", "Air-conditioned facility", "Free uniform provided"],
  },
};

/**
 * 解析済み求人データをフィリピン人材向けの英語PR文に変換する（オフライン版）
 *
 * @param job    ParsedJob または同等の構造体
 * @returns      魅力的な英語求人説明文
 */
export function rewriteJobForFilipino(job: {
  title: string;
  category: string;
  salary_min: number | null;
  salary_max: number | null;
  location_name: string;
  housing_status: boolean;
  company_name: string | null;
  description?: string | null;
}): string {
  const pitch = CATEGORY_PITCH[job.category] ?? CATEGORY_PITCH.FACTORY;

  const salaryLine =
    job.salary_min && job.salary_max
      ? `💴 ¥${job.salary_min.toLocaleString()} – ¥${job.salary_max.toLocaleString()} / month`
      : job.salary_min
      ? `💴 ¥${job.salary_min.toLocaleString()}+ / month`
      : "💴 Competitive salary (details at interview)";

  const housingLine = job.housing_status
    ? "🏠 Company housing provided — save on rent from day one!"
    : "🏠 Housing not included (KUMIKOJEM can help find nearby options!)";

  const perksText = pitch.perks.map((p) => `  ✅ ${p}`).join("\n");

  const companyText = job.company_name
    ? `📌 Company: ${job.company_name}`
    : "📌 Reputable Japanese company";

  return [
    pitch.headline,
    "",
    pitch.detail,
    "",
    `📍 Location: ${job.location_name}`,
    companyText,
    salaryLine,
    housingLine,
    "",
    "🎯 Why this job is perfect for you:",
    perksText,
    "",
    "🤝 KUMIKOJEM handles everything: visa support, housing search, and Japanese language assistance. You focus on the job — we handle the paperwork!",
  ].join("\n");
}

/**
 * OpenAI を使ったフィリピン人材向けリライト（高品質版）
 * API キーがない場合は rewriteJobForFilipino() にフォールバックする想定
 */
const REWRITE_SYSTEM_PROMPT = `You are a recruitment copywriter specializing in attracting Filipino workers to jobs in Japan.
Rewrite the given Japanese job information into an exciting, warm English job description targeting Filipino workers.
Use encouraging language, highlight key benefits (salary, housing, working hours), and include relevant emoji.
Keep it under 200 words. Return ONLY the rewritten description.`;

export async function rewriteJobForFilipinoAI(job: {
  title: string;
  category: string;
  salary_min: number | null;
  salary_max: number | null;
  location_name: string;
  housing_status: boolean;
  company_name: string | null;
  description?: string | null;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return rewriteJobForFilipino(job);

  try {
    const client = getOpenAIClient();
    const jobSummary = `
Title: ${job.title}
Category: ${job.category}
Location: ${job.location_name}
Company: ${job.company_name ?? "Unknown"}
Salary: ¥${job.salary_min?.toLocaleString() ?? "?"} – ¥${job.salary_max?.toLocaleString() ?? "?"}
Housing: ${job.housing_status ? "Provided" : "Not provided"}
Description: ${job.description ?? "(none)"}`.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: REWRITE_SYSTEM_PROMPT },
        { role: "user", content: jobSummary },
      ],
      max_tokens: 400,
    });

    return response.choices[0]?.message?.content?.trim() ?? rewriteJobForFilipino(job);
  } catch {
    return rewriteJobForFilipino(job);
  }
}
