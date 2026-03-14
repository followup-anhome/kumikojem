export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { JobStatus, SalaryType, VisaType } from "@prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await prisma.jobPosting.findMany({
    where: { company_id: session.user.companyId },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { created_at: "desc" },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, description, salary_min, salary_max, salary_type, location, required_skills, accepted_visas } = body

  if (!title?.trim()) return NextResponse.json({ error: "職種名は必須です" }, { status: 400 })
  if (!location?.trim()) return NextResponse.json({ error: "勤務地は必須です" }, { status: 400 })

  const job = await prisma.jobPosting.create({
    data: {
      company_id: session.user.companyId,
      title: title.trim(),
      description: description?.trim() || null,
      salary_min: salary_min ? parseInt(salary_min) : null,
      salary_max: salary_max ? parseInt(salary_max) : null,
      salary_type: salary_type && Object.values(SalaryType).includes(salary_type) ? salary_type as SalaryType : null,
      location: location.trim(),
      required_skills: Array.isArray(required_skills) ? required_skills : [],
      accepted_visas: Array.isArray(accepted_visas) ? accepted_visas.filter((v: string) => Object.values(VisaType).includes(v as VisaType)) : [],
      status: "OPEN",
    },
  })
  return NextResponse.json(job, { status: 201 })
}
