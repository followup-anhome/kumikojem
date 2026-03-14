import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApplicationStatus } from "@prisma/client"
import { sendStatusChangeEmail, type StatusChangeEmailData } from "@/lib/email"

const NOTIFIABLE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.REJECTED,
]

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      job_posting: { include: { company: true } },
      user: { select: { name: true, email: true } },
    },
  })
  if (!app || app.job_posting.company_id !== session.user.companyId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { status, interview_at, notes } = await req.json()
  if (!Object.values(ApplicationStatus).includes(status))
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 })

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: status as ApplicationStatus,
      ...(interview_at !== undefined && { interview_at: interview_at ? new Date(interview_at) : null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  })

  // メール送信 (通知対象ステータスのみ)
  if (NOTIFIABLE_STATUSES.includes(status as ApplicationStatus) && app.user.email) {
    const emailData: StatusChangeEmailData = {
      talentName: app.user.name,
      talentEmail: app.user.email,
      companyName: app.job_posting.company.name,
      jobTitle: app.job_posting.title,
      newStatus: status as StatusChangeEmailData["newStatus"],
      interviewAt: interview_at ?? null,
    }
    sendStatusChangeEmail(emailData).catch((e) => console.error("[status] email error:", e))
  }

  return NextResponse.json(updated)
}
