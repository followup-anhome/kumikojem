import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Demo company
  const company = await prisma.company.upsert({
    where: { id: "demo-company-001" },
    update: {},
    create: {
      id: "demo-company-001",
      name: "株式会社サンプル建設",
      industry: "CONSTRUCTION",
      location: "大阪府大阪市北区",
      accepted_visas: ["SPECIFIED_SKILLED_1", "SPECIFIED_SKILLED_2", "ENGINEER"],
    },
  })

  const passwordHash = await bcrypt.hash("demo1234", 10)
  await prisma.companyUser.upsert({
    where: { email: "demo@company.jp" },
    update: { password_hash: passwordHash },
    create: {
      company_id: company.id,
      email: "demo@company.jp",
      password_hash: passwordHash,
    },
  })

  console.log("✅ Demo company created:", company.name)
  console.log("✅ Demo login: demo@company.jp / demo1234")
}

main().catch(console.error).finally(() => prisma.$disconnect())
