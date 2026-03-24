export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // ── 1. 企業・ユーザー ──────────────────────────────
    const company = await prisma.company.upsert({
      where: { id: "demo-company-001" },
      update: { name: "株式会社サンプル建設" },
      create: {
        id: "demo-company-001",
        name: "株式会社サンプル建設",
        industry: "CONSTRUCTION" as any,
        location: "大阪府大阪市北区",
      },
    })

    const hash = await bcrypt.hash("demo1234", 10)
    await prisma.companyUser.upsert({
      where: { email: "demo@company.jp" },
      update: { password_hash: hash },
      create: {
        id: "demo-user-001",
        email: "demo@company.jp",
        password_hash: hash,
        company_id: company.id,
      },
    })

    // ── 2. 求人票 ──────────────────────────────────────
    const jobs = await Promise.all([
      prisma.job.upsert({
        where: { id: "demo-job-001" },
        update: {},
        create: {
          id: "demo-job-001",
          title: "建築大工",
          category: "CONSTRUCTION" as any,
          description: "木造住宅の建築工事。社宅完備。週休2日。",
          salary_min: 200000,
          salary_max: 280000,
          location_name: "大阪府堺市",
          location_lat: 34.5733,
          location_lng: 135.4830,
          housing_status: true,
          company_name: "株式会社サンプル建設",
          status: "OPEN" as any,
        },
      }),
      prisma.job.upsert({
        where: { id: "demo-job-002" },
        update: {},
        create: {
          id: "demo-job-002",
          title: "型枠大工",
          category: "CONSTRUCTION" as any,
          description: "RC造建物の型枠工事。資格手当あり。",
          salary_min: 220000,
          salary_max: 300000,
          location_name: "大阪府大阪市",
          location_lat: 34.6937,
          location_lng: 135.5023,
          housing_status: true,
          company_name: "株式会社サンプル建設",
          status: "OPEN" as any,
        },
      }),
      prisma.job.upsert({
        where: { id: "demo-job-003" },
        update: {},
        create: {
          id: "demo-job-003",
          title: "フォークリフトオペレーター",
          category: "LOGISTICS" as any,
          description: "倉庫内フォークリフト作業。日勤のみ。",
          salary_min: 180000,
          salary_max: 220000,
          location_name: "大阪府堺市",
          location_lat: 34.5733,
          location_lng: 135.4830,
          housing_status: true,
          company_name: "西淀川運輸株式会社",
          status: "OPEN" as any,
        },
      }),
    ])

    // ── 3. 人材（タレント） ────────────────────────────
    const talents = await Promise.all([
      prisma.talent.upsert({
        where: { id: "demo-talent-001" },
        update: {},
        create: {
          id: "demo-talent-001",
          name: "Juan dela Cruz",
          gender: "MALE" as any,
          nationality: "Philippines",
          certificates: ["N3", "大型免許", "フォークリフト"],
          suitability_score: 0.92,
          desired_salary_min: 200000,
          height_cm: 174,
          weight_kg: 68,
        },
      }),
      prisma.talent.upsert({
        where: { id: "demo-talent-002" },
        update: {},
        create: {
          id: "demo-talent-002",
          name: "Mark Villanueva",
          gender: "MALE" as any,
          nationality: "Philippines",
          certificates: ["N3", "大型二種", "フォークリフト", "危険物取扱甲"],
          suitability_score: 0.98,
          desired_salary_min: 220000,
          height_cm: 182,
          weight_kg: 85,
        },
      }),
      prisma.talent.upsert({
        where: { id: "demo-talent-003" },
        update: {},
        create: {
          id: "demo-talent-003",
          name: "Maria Santos",
          gender: "FEMALE" as any,
          nationality: "Philippines",
          certificates: ["N4", "介護福祉士"],
          suitability_score: 0.75,
          desired_salary_min: 160000,
          height_cm: 158,
          weight_kg: 52,
        },
      }),
      prisma.talent.upsert({
        where: { id: "demo-talent-004" },
        update: {},
        create: {
          id: "demo-talent-004",
          name: "Jose Mendoza",
          gender: "MALE" as any,
          nationality: "Philippines",
          certificates: ["N3", "大型免許", "玉掛け", "足場"],
          suitability_score: 0.89,
          desired_salary_min: 210000,
          height_cm: 178,
          weight_kg: 80,
        },
      }),
      prisma.talent.upsert({
        where: { id: "demo-talent-005" },
        update: {},
        create: {
          id: "demo-talent-005",
          name: "Ana dela Rosa",
          gender: "FEMALE" as any,
          nationality: "Philippines",
          certificates: ["N2", "介護福祉士", "実務者研修"],
          suitability_score: 0.82,
          desired_salary_min: 170000,
          height_cm: 162,
          weight_kg: 54,
        },
      }),
    ])

    // ── 4. マッチング ──────────────────────────────────
    await Promise.all([
      prisma.match.upsert({
        where: { id: "demo-match-001" },
        update: {},
        create: {
          id: "demo-match-001",
          job_id: jobs[0].id,
          talent_id: talents[0].id,
          score: 88,
        },
      }),
      prisma.match.upsert({
        where: { id: "demo-match-002" },
        update: {},
        create: {
          id: "demo-match-002",
          job_id: jobs[1].id,
          talent_id: talents[1].id,
          score: 97,
        },
      }),
      prisma.match.upsert({
        where: { id: "demo-match-003" },
        update: {},
        create: {
          id: "demo-match-003",
          job_id: jobs[2].id,
          talent_id: talents[3].id,
          score: 91,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "サンプルデータ作成完了",
      data: {
        company: company.name,
        jobs: jobs.length,
        talents: talents.length,
        login: { email: "demo@company.jp", password: "demo1234" },
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
