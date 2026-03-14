export const dynamic = "force-dynamic"

/**
 * GET /api/jobs
 * 全求人一覧を返す。Prisma接続できない場合はモックデータにフォールバック。
 */

import { NextResponse } from "next/server";
import { MOCK_JOBS } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ jobs, source: "db" });
  } catch {
    // DB接続失敗 → モックデータにフォールバック
  }

  return NextResponse.json({ jobs: MOCK_JOBS, source: "mock" });
}
