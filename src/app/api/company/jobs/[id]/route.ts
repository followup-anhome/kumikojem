import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { JobStatus, SalaryType, VisaType } from "@prisma/client"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const job = await prisma.jobPosting.findUnique({ where: { id } })
  if (!job || job.company_id !== session.user.companyId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.jobPosting.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.salary_min !== undefined && { salary_min: body.salary_min ? parseInt(body.salary_min) : null }),
      ...(body.salary_max !== undefined && { salary_max: body.salary_max ? parseInt(body.salary_max) : null }),
      ...(body.salary_type !== undefined && { salary_type: body.salary_type && Object.values(SalaryType).includes(body.salary_type) ? body.salary_type as SalaryType : null }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.required_skills !== undefined && { required_skills: body.required_skills }),
      ...(body.accepted_visas !== undefined && { accepted_visas: body.accepted_visas }),
      ...(body.status !== undefined && Object.values(JobStatus).includes(body.status) && { status: body.status as JobStatus }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const job = await prisma.jobPosting.findUnique({ where: { id } })
  if (!job || job.company_id !== session.user.companyId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.jobPosting.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
