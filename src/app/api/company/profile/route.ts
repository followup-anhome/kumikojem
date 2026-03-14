import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: {
      _count: {
        select: { job_postings: true },
      },
    },
  })
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(company)
}
