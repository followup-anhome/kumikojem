/**
 * POST /api/parse-job
 *
 * 求人票テキストを受け取り、構造化データを返す。
 * OpenAI API キーがない場合は guessCategory() によるオフライン解析にフォールバック。
 *
 * Request body:
 *   { "text": "求人票の全文テキスト" }
 *
 * Response 200:
 *   {
 *     "category":      "LOGISTICS" | "CONSTRUCTION" | "CARE" | "FACTORY",
 *     "salary":        180000,          // 月給中央値(円) ※ min+max の平均
 *     "location":      "大阪市西淀川区",
 *     "has_dormitory": true,
 *     "meta": {
 *       "title":        "フォークリフトオペレーター",
 *       "salary_min":   160000,
 *       "salary_max":   200000,
 *       "company_name": "〇〇運輸株式会社",
 *       "description":  "...",
 *       "parsed_by":    "openai" | "offline"
 *     }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJobText, guessCategory, rewriteJobForFilipinoAI } from "@/lib/ai-parser";

// ─── リクエストスキーマ ────────────────────────────────
const RequestSchema = z.object({
  text: z.string().min(10, "求人テキストは10文字以上必要です"),
});

// ─── レスポンス型 ──────────────────────────────────────
type ParseJobResponse = {
  category: "LOGISTICS" | "CONSTRUCTION" | "CARE" | "FACTORY";
  salary: number | null;
  location: string;
  has_dormitory: boolean;
  /** フィリピン人材向け英語リライト（AI or オフラインテンプレート） */
  filipino_description: string;
  meta: {
    title: string;
    salary_min: number | null;
    salary_max: number | null;
    company_name: string | null;
    description: string | null;
    parsed_by: "openai" | "offline";
  };
};

// ─── ハンドラ ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. リクエスト検証
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正なJSONです" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { text } = parsed.data;

  // 2. OpenAI 解析（環境変数がある場合のみ）
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  if (hasApiKey) {
    try {
      const job = await parseJobText(text);
      const salary = calcSalaryMid(job.salary_min, job.salary_max);
      const filipino_description = await rewriteJobForFilipinoAI(job);

      const response: ParseJobResponse = {
        category: job.category,
        salary,
        location: job.location_name,
        has_dormitory: job.housing_status,
        filipino_description,
        meta: {
          title: job.title,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          company_name: job.company_name,
          description: job.description,
          parsed_by: "openai",
        },
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error("[parse-job] OpenAI解析失敗、オフラインにフォールバック:", err);
      // フォールバック: オフライン解析へ
    }
  }

  // 3. オフラインフォールバック（APIキーなし or OpenAIエラー時）
  const category = guessCategory(text);
  const { salary_min, salary_max } = extractSalaryOffline(text);
  const location = extractLocationOffline(text);
  const has_dormitory = /社宅|寮|住居/.test(text);
  const offlineJobData = {
    title: extractTitleOffline(text),
    category,
    salary_min,
    salary_max,
    location_name: location ?? "不明",
    housing_status: has_dormitory,
    company_name: null,
    description: text.slice(0, 150),
  };

  const offlineResponse: ParseJobResponse = {
    category,
    salary: calcSalaryMid(salary_min, salary_max),
    location: location ?? "不明",
    has_dormitory,
    filipino_description: await rewriteJobForFilipinoAI(offlineJobData),
    meta: {
      title: offlineJobData.title,
      salary_min,
      salary_max,
      company_name: null,
      description: text.slice(0, 150),
      parsed_by: "offline",
    },
  };

  return NextResponse.json(offlineResponse);
}

// ─── オフライン抽出ヘルパー ────────────────────────────

function calcSalaryMid(min: number | null, max: number | null): number | null {
  if (min !== null && max !== null) return Math.round((min + max) / 2);
  return min ?? max ?? null;
}

/** 月給の範囲を正規表現で抽出 */
function extractSalaryOffline(text: string): {
  salary_min: number | null;
  salary_max: number | null;
} {
  // 例: "月給 160,000円〜200,000円" / "20万円以上" など
  const rangeMatch = text.match(
    /月給[^\d]*?([\d,]+)万?円[^\d]*?[〜~\-～][^\d]*?([\d,]+)万?円/
  );
  if (rangeMatch) {
    const toNum = (s: string, hasMan: boolean) =>
      parseInt(s.replace(/,/g, ""), 10) * (hasMan ? 10000 : 1);
    const hasMan1 = rangeMatch[0].includes("万");
    return {
      salary_min: toNum(rangeMatch[1], hasMan1),
      salary_max: toNum(rangeMatch[2], hasMan1),
    };
  }

  // 単一値: "20万円以上"
  const singleMatch = text.match(/月給[^\d]*?([\d,]+)(万?)円/);
  if (singleMatch) {
    const val =
      parseInt(singleMatch[1].replace(/,/g, ""), 10) *
      (singleMatch[2] === "万" ? 10000 : 1);
    return { salary_min: val, salary_max: null };
  }

  return { salary_min: null, salary_max: null };
}

/** 都道府県・市区町村を抽出 */
function extractLocationOffline(text: string): string | null {
  const CJK = "[\\u4e00-\\u9fff\\u3040-\\u30ff]";

  // パターン1: 【勤務地】〇〇市〇〇区... 形式（CJK文字のみキャプチャ）
  const labelMatch = text.match(
    new RegExp(`勤務地[^\\n]{0,6}(${CJK}{2,6}(?:都|道|府|県|市)${CJK}{1,8}(?:区|町|村|郡))`)
  );
  if (labelMatch) return labelMatch[1].replace(/（.*/, "").trim();

  // パターン2: 大阪府・東京都 etc. から始まる住所
  const prefMatch = text.match(
    /((?:北海道|東京都|大阪府|京都府)[\u4e00-\u9fff]{2,15}[市区町村][\u4e00-\u9fff]{0,8})/
  );
  if (prefMatch) return prefMatch[1];

  // パターン3: 〇〇県〇〇市
  const kenMatch = text.match(/([\u4e00-\u9fff]{2,4}県[\u4e00-\u9fff]{2,6}[市区町村])/);
  if (kenMatch) return kenMatch[1];

  // パターン4: 〇〇市〇〇区（都道府県なし）
  const cityMatch = text.match(/([\u4e00-\u9fff]{1,5}市[\u4e00-\u9fff]{1,5}[区町村])/);
  return cityMatch ? cityMatch[1] : null;
}

/** 先頭付近から職種名を推定 */
function extractTitleOffline(text: string): string {
  const firstLine = text.split(/[\n。]/)[0].trim();
  return firstLine.slice(0, 40) || "職種名不明";
}
