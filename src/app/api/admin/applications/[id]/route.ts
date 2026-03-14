import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { sendStatusChangeEmail, type StatusChangeEmailData } from "@/lib/email";

const VALID_STATUSES = Object.values(ApplicationStatus);

const NOTIFIABLE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.REJECTED,
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, interview_at } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        job_posting: {
          include: { company: { select: { name: true } } },
        },
      },
    });

    // メール送信 (通知対象ステータスのみ)
    if (NOTIFIABLE_STATUSES.includes(status as ApplicationStatus) && updated.user.email) {
      const emailData: StatusChangeEmailData = {
        talentName: updated.user.name,
        talentEmail: updated.user.email,
        companyName: updated.job_posting.company.name,
        jobTitle: updated.job_posting.title,
        newStatus: status as StatusChangeEmailData["newStatus"],
        interviewAt: interview_at ?? null,
      };
      sendStatusChangeEmail(emailData).catch((e) => console.error("[admin status] email error:", e));
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
}
