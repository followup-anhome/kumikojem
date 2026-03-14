import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const applications = await prisma.application.findMany({
    where: {
      job_posting: { company_id: session.user.companyId },
    },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          visa_type: true, japanese_level: true, english_level: true,
          skills: true, desired_prefecture: true, desired_salary: true,
          salary_type: true, bio_ja: true, bio_en: true, photo_url: true,
        },
      },
      job_posting: { select: { id: true, title: true, location: true } },
    },
    orderBy: { created_at: "desc" },
  })
  return NextResponse.json(applications)
}
