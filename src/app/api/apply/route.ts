/**
 * POST /api/apply
 * 求職者が求人に応募する。
 * - Application レコードを DB に作成
 * - 求職者 + 企業担当者 にメール送信
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendApplicationEmails } from "@/lib/email"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const { jobPostingId } = await req.json()
  if (!jobPostingId) {
    return NextResponse.json({ error: "jobPostingId は必須です" }, { status: 400 })
  }

  // 求人 + 企業担当者メール取得
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    include: {
      company: {
        include: {
          users: { select: { email: true }, take: 1 },
        },
      },
    },
  })

  if (!job || job.status !== "OPEN") {
    return NextResponse.json({ error: "求人が見つかりません" }, { status: 404 })
  }

  // 求職者情報
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  })
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
  }

  // 重複チェック
  const existing = await prisma.application.findUnique({
    where: { user_id_job_posting_id: { user_id: user.id, job_posting_id: jobPostingId } },
  })
  if (existing) {
    return NextResponse.json({ error: "すでに応募済みです", application: existing }, { status: 409 })
  }

  // Application 作成
  const application = await prisma.application.create({
    data: {
      user_id: user.id,
      job_posting_id: jobPostingId,
      status: "APPLIED",
    },
  })

  // メール送信 (非同期、失敗してもレスポンスは返す)
  const companyEmail = job.company.users[0]?.email ?? null
  sendApplicationEmails({
    talentName: user.name,
    talentEmail: user.email ?? "",
    companyName: job.company.name,
    companyEmail: companyEmail ?? "",
    jobTitle: job.title,
    jobLocation: job.location,
    appliedAt: application.created_at.toISOString(),
  }).catch((e) => console.error("[apply] email error:", e))

  return NextResponse.json({ application }, { status: 201 })
}
