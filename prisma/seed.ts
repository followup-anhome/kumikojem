/**
 * prisma/seed.ts
 * 開発用サンプルデータ — 3求人 / 10人材 / 10物件 / 3企業 / 3求人票 / 10求職者 / 5応募
 *
 * 実行: npm run db:seed
 * 冪等: upsert 使用のため何度実行しても安全
 */

import {
  PrismaClient,
  JobCategory,
  JobStatus,
  Gender,
  ManagementCompany,
  VisaType,
  JapaneseLevel,
  IndustryType,
  ApplicationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

// certificatesからJLPTレベルを推定
function inferJapaneseLevel(certs: string[]): JapaneseLevel {
  if (certs.includes("N1")) return JapaneseLevel.N1;
  if (certs.includes("N2")) return JapaneseLevel.N2;
  if (certs.includes("N3")) return JapaneseLevel.N3;
  if (certs.includes("N4")) return JapaneseLevel.N4;
  if (certs.includes("N5")) return JapaneseLevel.N5;
  return JapaneseLevel.NONE;
}

async function main() {
  console.log("🌱 シードデータ投入開始...\n");

  // ══════════════════════════════════════════
  // 1. 求人 (3件) — 既存 Job モデル
  // ══════════════════════════════════════════
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: "job-001" },
      update: {},
      create: {
        id: "job-001",
        title: "フォークリフトオペレーター",
        category: JobCategory.LOGISTICS,
        description: "倉庫内でのフォークリフト作業。日勤のみ。社宅完備。週休2日制。",
        salary_min: 180000,
        salary_max: 220000,
        location_name: "大阪市西淀川区大和田",
        location_lat: 34.6937,
        location_lng: 135.4576,
        housing_status: true,
        company_name: "西淀川運輸株式会社",
        status: JobStatus.OPEN,
      },
    }),
    prisma.job.upsert({
      where: { id: "job-002" },
      update: {},
      create: {
        id: "job-002",
        title: "介護職員（デイサービス）",
        category: JobCategory.CARE,
        description: "デイサービスでの入浴・食事介助。日本語N3以上歓迎。残業ほぼなし。",
        salary_min: 160000,
        salary_max: 190000,
        location_name: "兵庫県尼崎市南武庫之荘",
        location_lat: 34.7328,
        location_lng: 135.4148,
        housing_status: true,
        company_name: "みどりケアサービス",
        status: JobStatus.OPEN,
      },
    }),
    prisma.job.upsert({
      where: { id: "job-003" },
      update: {},
      create: {
        id: "job-003",
        title: "鉄筋工（現場作業員）",
        category: JobCategory.CONSTRUCTION,
        description: "マンション建設現場での鉄筋組立作業。未経験可・経験者優遇。",
        salary_min: 200000,
        salary_max: 260000,
        location_name: "大阪市淀川区西中島",
        location_lat: 34.7344,
        location_lng: 135.4967,
        housing_status: false,
        company_name: "大阪鉄筋工業株式会社",
        status: JobStatus.OPEN,
      },
    }),
  ]);
  console.log(`✅ 求人 (Job): ${jobs.map((j) => j.title).join(" / ")}`);

  // ══════════════════════════════════════════
  // 2. 人材 (10名) — 既存 Talent モデル
  // ══════════════════════════════════════════
  const talentsData = [
    {
      id: "talent-001", name: "Juan dela Cruz",   gender: Gender.MALE,
      height_cm: 174, weight_kg: 68,
      certificates: ["フォークリフト", "普通免許"],
      fb_profile_url: "https://facebook.com/juan.delacruz",
      suitability_score: 0.82, desired_salary_min: 175000,
      availability_date: new Date("2025-04-01"),
    },
    {
      id: "talent-002", name: "Maria Santos",     gender: Gender.FEMALE,
      height_cm: 158, weight_kg: 52,
      certificates: ["介護職員初任者研修", "N3"],
      fb_profile_url: "https://facebook.com/maria.santos",
      suitability_score: 0.75, desired_salary_min: 160000,
      availability_date: new Date("2025-04-01"),
    },
    {
      id: "talent-003", name: "Carlos Reyes",     gender: Gender.MALE,
      height_cm: 168, weight_kg: 72,
      certificates: ["玉掛け", "足場"],
      fb_profile_url: "https://facebook.com/carlos.reyes",
      suitability_score: 0.70, desired_salary_min: 195000,
      availability_date: new Date("2025-05-01"),
    },
    {
      id: "talent-004", name: "Jose Mendoza",     gender: Gender.MALE,
      height_cm: 178, weight_kg: 80,
      certificates: ["大型免許", "フォークリフト", "危険物取扱乙4"],
      fb_profile_url: "https://facebook.com/jose.mendoza",
      suitability_score: 0.88, desired_salary_min: 190000,
      availability_date: new Date("2025-04-15"),
    },
    {
      id: "talent-005", name: "Ana dela Rosa",    gender: Gender.FEMALE,
      height_cm: 162, weight_kg: 54,
      certificates: ["介護福祉士", "N2", "実務者研修"],
      fb_profile_url: "https://facebook.com/ana.delarosa",
      suitability_score: 0.91, desired_salary_min: 170000,
      availability_date: new Date("2025-03-15"),
    },
    {
      id: "talent-006", name: "Rodel Bautista",   gender: Gender.MALE,
      height_cm: 171, weight_kg: 75,
      certificates: ["玉掛け", "溶接"],
      fb_profile_url: "https://facebook.com/rodel.bautista",
      suitability_score: 0.73, desired_salary_min: 200000,
      availability_date: new Date("2025-06-01"),
    },
    {
      id: "talent-007", name: "Christine Aquino", gender: Gender.FEMALE,
      height_cm: 155, weight_kg: 48,
      certificates: ["N3", "ホームヘルパー2級"],
      fb_profile_url: "https://facebook.com/christine.aquino",
      suitability_score: 0.68, desired_salary_min: 155000,
      availability_date: new Date("2025-04-01"),
    },
    {
      id: "talent-008", name: "Mark Villanueva",  gender: Gender.MALE,
      height_cm: 182, weight_kg: 85,
      certificates: ["大型二種", "フォークリフト", "危険物取扱甲"],
      fb_profile_url: "https://facebook.com/mark.villanueva",
      suitability_score: 0.85, desired_salary_min: 210000,
      availability_date: new Date("2025-04-01"),
    },
    {
      id: "talent-009", name: "Romeo Garcia",     gender: Gender.MALE,
      height_cm: 165, weight_kg: 70,
      certificates: ["フォークリフト", "玉掛け"],
      fb_profile_url: "https://facebook.com/romeo.garcia",
      suitability_score: 0.72, desired_salary_min: 175000,
      availability_date: new Date("2025-05-15"),
    },
    {
      id: "talent-010", name: "Luz Manalo",       gender: Gender.FEMALE,
      height_cm: 160, weight_kg: 55,
      certificates: ["介護職員初任者研修", "N4"],
      fb_profile_url: "https://facebook.com/luz.manalo",
      suitability_score: 0.60, desired_salary_min: 150000,
      availability_date: new Date("2025-07-01"),
    },
  ];

  const talents = await Promise.all(
    talentsData.map((t) =>
      prisma.talent.upsert({ where: { id: t.id }, update: {}, create: t })
    )
  );
  console.log(`✅ 人材 (Talent): ${talents.length}名 登録`);

  // ══════════════════════════════════════════
  // 3. アンホーム物件 (10件) — 既存 Property モデル
  // ══════════════════════════════════════════
  const propertiesData = [
    { id: "prop-001", name: "レオパレス大和田",       address: "大阪市西淀川区大和田3丁目5-2",    lat: 34.6952, lng: 135.4601, rent: 45000, floor_plan: "1K",  max_occupancy: 1 },
    { id: "prop-002", name: "一建設 姫島コーポラス",   address: "大阪市西淀川区姫島5丁目11-8",     lat: 34.7010, lng: 135.4521, rent: 52000, floor_plan: "1DK", max_occupancy: 2 },
    { id: "prop-003", name: "アンホーム 出来島荘",     address: "大阪市西淀川区出来島1丁目3-14",   lat: 34.6880, lng: 135.4450, rent: 43000, floor_plan: "1K",  max_occupancy: 1 },
    { id: "prop-004", name: "一建設 野里ハイツ",       address: "大阪市西淀川区野里1丁目22-5",     lat: 34.7090, lng: 135.4630, rent: 48000, floor_plan: "1K",  max_occupancy: 1 },
    { id: "prop-005", name: "アンホーム 武庫之荘",     address: "兵庫県尼崎市南武庫之荘1丁目4-7",  lat: 34.7348, lng: 135.4132, rent: 48000, floor_plan: "1K",  max_occupancy: 1 },
    { id: "prop-006", name: "一建設 塚口サニーコート", address: "兵庫県尼崎市塚口町2丁目8-15",     lat: 34.7470, lng: 135.4210, rent: 55000, floor_plan: "2K",  max_occupancy: 3 },
    { id: "prop-007", name: "アンホーム 立花パレス",   address: "兵庫県尼崎市立花町3丁目1-9",      lat: 34.7200, lng: 135.4320, rent: 46000, floor_plan: "1K",  max_occupancy: 1 },
    { id: "prop-008", name: "一建設 西中島南方コート", address: "大阪市淀川区西中島6丁目2-11",     lat: 34.7320, lng: 135.4940, rent: 58000, floor_plan: "1DK", max_occupancy: 2 },
    { id: "prop-009", name: "アンホーム 新大阪ロイヤル", address: "大阪市淀川区宮原3丁目5-22",    lat: 34.7330, lng: 135.5020, rent: 62000, floor_plan: "2K",  max_occupancy: 3 },
    { id: "prop-010", name: "一建設 十三グリーンハイツ", address: "大阪市淀川区十三本町2丁目7-4", lat: 34.7240, lng: 135.4880, rent: 50000, floor_plan: "1K",  max_occupancy: 1 },
  ];

  const properties = await Promise.all(
    propertiesData.map((p) =>
      prisma.property.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, management_company: ManagementCompany.AN_HOME },
      })
    )
  );
  console.log(`✅ 物件 (Property): ${properties.length}件 登録`);

  // ══════════════════════════════════════════
  // 4. 受入企業 (3件) — 新規 Company モデル
  // ══════════════════════════════════════════
  const company1 = await prisma.company.upsert({
    where: { id: "company-001" },
    update: {},
    create: {
      id: "company-001",
      name: "西淀川運輸株式会社",
      industry: IndustryType.LOGISTICS,
      location: "大阪市西淀川区大和田",
      accepted_visas: [VisaType.SPECIFIED_SKILLED_1, VisaType.TECHNICAL_INTERN],
    },
  });

  const company2 = await prisma.company.upsert({
    where: { id: "company-002" },
    update: {},
    create: {
      id: "company-002",
      name: "みどりケアサービス",
      industry: IndustryType.CARE,
      location: "兵庫県尼崎市南武庫之荘",
      accepted_visas: [
        VisaType.SPECIFIED_SKILLED_1,
        VisaType.SPECIFIED_SKILLED_2,
        VisaType.ENGINEER,
      ],
    },
  });

  const company3 = await prisma.company.upsert({
    where: { id: "company-003" },
    update: {},
    create: {
      id: "company-003",
      name: "大阪鉄筋工業株式会社",
      industry: IndustryType.CONSTRUCTION,
      location: "大阪市淀川区西中島",
      accepted_visas: [VisaType.SPECIFIED_SKILLED_1, VisaType.TECHNICAL_INTERN],
    },
  });
  console.log(`✅ 企業 (Company): ${company1.name} / ${company2.name} / ${company3.name}`);

  // ══════════════════════════════════════════
  // 5. 求人票 (3件) — 新規 JobPosting モデル
  // ══════════════════════════════════════════
  const jobPostings = await Promise.all([
    prisma.jobPosting.upsert({
      where: { id: "jp-001" },
      update: {},
      create: {
        id: "jp-001",
        company_id: company1.id,
        title: "フォークリフトオペレーター",
        salary_min: 180000,
        salary_max: 220000,
        location: "大阪市西淀川区大和田",
        required_skills: ["フォークリフト", "普通免許"],
        status: JobStatus.OPEN,
      },
    }),
    prisma.jobPosting.upsert({
      where: { id: "jp-002" },
      update: {},
      create: {
        id: "jp-002",
        company_id: company2.id,
        title: "介護職員（デイサービス）",
        salary_min: 160000,
        salary_max: 190000,
        location: "兵庫県尼崎市南武庫之荘",
        required_skills: ["介護職員初任者研修", "N3"],
        status: JobStatus.OPEN,
      },
    }),
    prisma.jobPosting.upsert({
      where: { id: "jp-003" },
      update: {},
      create: {
        id: "jp-003",
        company_id: company3.id,
        title: "鉄筋工（現場作業員）",
        salary_min: 200000,
        salary_max: 260000,
        location: "大阪市淀川区西中島",
        required_skills: ["玉掛け", "足場"],
        status: JobStatus.OPEN,
      },
    }),
  ]);
  console.log(`✅ 求人票 (JobPosting): ${jobPostings.length}件 登録`);

  // ══════════════════════════════════════════
  // 6. 求職者 (10名) — 新規 User モデル
  //    MOCK_TALENTSを変換: certificatesからjapanese_level/visa_typeを推定
  // ══════════════════════════════════════════
  const usersData = [
    { id: "user-001", name: "Juan dela Cruz",   certs: ["フォークリフト", "普通免許"],             email: "juan.delacruz@example.com",   visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-002", name: "Maria Santos",     certs: ["介護職員初任者研修", "N3"],               email: "maria.santos@example.com",    visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-003", name: "Carlos Reyes",     certs: ["玉掛け", "足場"],                         email: "carlos.reyes@example.com",    visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-004", name: "Jose Mendoza",     certs: ["大型免許", "フォークリフト", "危険物取扱乙4"], email: "jose.mendoza@example.com",    visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-005", name: "Ana dela Rosa",    certs: ["介護福祉士", "N2", "実務者研修"],          email: "ana.delarosa@example.com",    visa: VisaType.SPECIFIED_SKILLED_2 },
    { id: "user-006", name: "Rodel Bautista",   certs: ["玉掛け", "溶接"],                         email: "rodel.bautista@example.com",  visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-007", name: "Christine Aquino", certs: ["N3", "ホームヘルパー2級"],                 email: "christine.aquino@example.com", visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-008", name: "Mark Villanueva",  certs: ["大型二種", "フォークリフト", "危険物取扱甲"], email: "mark.villanueva@example.com", visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-009", name: "Romeo Garcia",     certs: ["フォークリフト", "玉掛け"],                email: "romeo.garcia@example.com",    visa: VisaType.SPECIFIED_SKILLED_1 },
    { id: "user-010", name: "Luz Manalo",       certs: ["介護職員初任者研修", "N4"],               email: "luz.manalo@example.com",      visa: VisaType.SPECIFIED_SKILLED_1 },
  ];

  const users = await Promise.all(
    usersData.map(({ id, name, certs, email, visa }) =>
      prisma.user.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name,
          nationality: "Philippines",
          visa_type: visa,
          skills: certs,
          japanese_level: inferJapaneseLevel(certs),
          email,
        },
      })
    )
  );
  console.log(`✅ 求職者 (User): ${users.length}名 登録`);

  // ══════════════════════════════════════════
  // 7. 応募 (5件) — 新規 Application モデル
  // ══════════════════════════════════════════
  const applications = await Promise.all([
    // Juan → フォークリフトオペレーター (面談設定済み)
    prisma.application.upsert({
      where: { user_id_job_posting_id: { user_id: "user-001", job_posting_id: "jp-001" } },
      update: {},
      create: {
        id: "app-001",
        user_id: "user-001",
        job_posting_id: "jp-001",
        status: ApplicationStatus.INTERVIEW,
        interview_at: new Date("2026-03-20T10:00:00+09:00"),
        notes: "フォークリフト経験3年。面談設定済み。",
      },
    }),
    // Maria → 介護職員 (書類選考中)
    prisma.application.upsert({
      where: { user_id_job_posting_id: { user_id: "user-002", job_posting_id: "jp-002" } },
      update: {},
      create: {
        id: "app-002",
        user_id: "user-002",
        job_posting_id: "jp-002",
        status: ApplicationStatus.REVIEWING,
        notes: "N3取得済み。書類選考中。",
      },
    }),
    // Ana → 介護職員 (内定済み — 介護福祉士・N2の高スキル)
    prisma.application.upsert({
      where: { user_id_job_posting_id: { user_id: "user-005", job_posting_id: "jp-002" } },
      update: {},
      create: {
        id: "app-003",
        user_id: "user-005",
        job_posting_id: "jp-002",
        status: ApplicationStatus.OFFERED,
        interview_at: new Date("2026-03-10T14:00:00+09:00"),
        notes: "介護福祉士・N2。面談通過・内定済み。",
      },
    }),
    // Carlos → 鉄筋工 (応募済み)
    prisma.application.upsert({
      where: { user_id_job_posting_id: { user_id: "user-003", job_posting_id: "jp-003" } },
      update: {},
      create: {
        id: "app-004",
        user_id: "user-003",
        job_posting_id: "jp-003",
        status: ApplicationStatus.APPLIED,
        notes: "建設現場経験2年。応募書類送付済み。",
      },
    }),
    // Jose → フォークリフトオペレーター (面談予定)
    prisma.application.upsert({
      where: { user_id_job_posting_id: { user_id: "user-004", job_posting_id: "jp-001" } },
      update: {},
      create: {
        id: "app-005",
        user_id: "user-004",
        job_posting_id: "jp-001",
        status: ApplicationStatus.INTERVIEW,
        interview_at: new Date("2026-03-22T11:00:00+09:00"),
        notes: "大型+フォークリフト資格あり。面談予定。",
      },
    }),
  ]);
  console.log(`✅ 応募 (Application): ${applications.length}件 登録`);

  console.log("\n🎉 シード完了!");
  console.log("   → npm run db:studio でデータを確認できます");
}

main()
  .catch((e) => {
    console.error("❌ シードエラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
