export const dynamic = "force-dynamic"

/**
 * POST /api/match
 * 指定求人に対してTalentをスコアリングし、物件推薦付きで返す。
 *
 * Body: { job_id: string }
 * Response: { results: MatchResult[], job: MockJob, properties: MockProperty[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rankTalentsForJob } from "@/lib/matcher";
import { MOCK_JOBS, MOCK_TALENTS, MOCK_PROPERTIES } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

const RequestSchema = z.object({
  job_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なJSONです" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "job_id が必要です" }, { status: 400 });
  }

  const { job_id } = parsed.data;

  // ─ DB使用可能な場合 ──────────────────────────────────
  try {
    const [dbJob, dbTalents, dbProperties] = await Promise.all([
        prisma.job.findUnique({ where: { id: job_id } }),
        prisma.talent.findMany(),
        prisma.property.findMany({ where: { available: true } }),
      ]);

      if (!dbJob) {
        return NextResponse.json({ error: "求人が見つかりません" }, { status: 404 });
      }

      const jobInput = {
        id: dbJob.id,
        title: dbJob.title,
        category: dbJob.category as "LOGISTICS" | "CONSTRUCTION" | "CARE" | "FACTORY",
        salary_min: dbJob.salary_min,
        salary_max: dbJob.salary_max,
        location_lat: dbJob.location_lat,
        location_lng: dbJob.location_lng,
        housing_status: dbJob.housing_status,
      };

      const talentInputs = dbTalents.map((t) => ({
        id: t.id,
        name: t.name,
        height_cm: t.height_cm,
        weight_kg: t.weight_kg,
        certificates: t.certificates,
        desired_salary_min: t.desired_salary_min,
        suitability_score: t.suitability_score,
      }));

      const propertyInputs = dbProperties.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        rent: p.rent,
      }));

      const results = rankTalentsForJob(talentInputs, jobInput, propertyInputs, 5);

      return NextResponse.json({
        results,
        job: jobInput,
        properties: dbProperties,
        source: "db",
      });
  } catch (e) {
    console.error("[match] DB query failed, falling back to mock:", e);
  }

  // ─ モックデータフォールバック ─────────────────────────
  const job = MOCK_JOBS.find((j) => j.id === job_id);
  if (!job) {
    return NextResponse.json({ error: "求人が見つかりません" }, { status: 404 });
  }

  const results = rankTalentsForJob(MOCK_TALENTS, job, MOCK_PROPERTIES, 5);

  return NextResponse.json({
    results,
    job,
    properties: MOCK_PROPERTIES,
    source: "mock",
  });
}
