export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // デモ企業を作成
    const company = await prisma.company.upsert({
      where: { id: "demo-company-001" },
      update: {},
      create: {
        id: "demo-company-001",
        name: "デモ株式会社",
        industry: "LOGISTICS" as any,
        location: "大阪府大阪市",
        contact_email: "demo@company.jp",
      },
    })

    // デモユーザーを作成（パスワード: demo1234）
    const hash = await bcrypt.hash("demo1234", 10)
    const user = await prisma.companyUser.upsert({
      where: { email: "demo@company.jp" },
      update: { password_hash: hash },
      create: {
        id: "demo-user-001",
        email: "demo@company.jp",
        password_hash: hash,
        company_id: company.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "デモユーザー作成完了",
      email: user.email,
      password: "demo1234",
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
