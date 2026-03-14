/**
 * mock-data.ts
 * DBなし・APIキーなしでも画面が動作するサンプルデータ。
 * Prismaが使えない開発初期段階でのフォールバックとして使用。
 */

import type { TalentInput, JobInput, PropertyInput } from "./matcher";

// ─── 拡張型（UI表示用フィールドを追加） ──────────────────
export type MockJob = JobInput & {
  description: string;
  company_name: string;
  location_name: string;
  critical_need?: boolean; // 2024問題など緊急採用フラグ
};

export type MockTalent = TalentInput & {
  gender: "MALE" | "FEMALE";
  fb_profile_url: string;
  availability_date: string; // "YYYY-MM-DD"
};

export type MockProperty = PropertyInput & {
  address: string;
  floor_plan: string;
  management_company: "AN_HOME" | "EXTERNAL";
  available: boolean;
  house_maker: string;       // 例: "一建設", "東栄住宅", "アンホーム不動産"
  interior_images: string[]; // 内装ダミー画像URL (picsum.photos)
};

// ─── 求人データ (3件) ─────────────────────────────────────
export const MOCK_JOBS: MockJob[] = [
  {
    id: "job-001",
    title: "フォークリフトオペレーター",
    category: "LOGISTICS",
    description: "倉庫内でのフォークリフト作業。日勤のみ。社宅完備。週休2日制。",
    salary_min: 180000,
    salary_max: 220000,
    location_name: "大阪市西淀川区大和田",
    location_lat: 34.6937,
    location_lng: 135.4576,
    housing_status: true,
    company_name: "西淀川運輸株式会社",
    critical_need: true, // 2024年物流問題・緊急採用
  },
  {
    id: "job-002",
    title: "介護職員（デイサービス）",
    category: "CARE",
    description:
      "デイサービスでの入浴・食事介助。日本語N3以上歓迎。残業ほぼなし。",
    salary_min: 160000,
    salary_max: 190000,
    location_name: "兵庫県尼崎市南武庫之荘",
    location_lat: 34.7328,
    location_lng: 135.4148,
    housing_status: true,
    company_name: "みどりケアサービス",
  },
  {
    id: "job-003",
    title: "鉄筋工（現場作業員）",
    category: "CONSTRUCTION",
    description:
      "マンション建設現場での鉄筋組立作業。未経験可・経験者優遇。",
    salary_min: 200000,
    salary_max: 260000,
    location_name: "大阪市淀川区西中島",
    location_lat: 34.7344,
    location_lng: 135.4967,
    housing_status: false,
    company_name: "大阪鉄筋工業株式会社",
  },
];

// ─── 人材データ (10名) ────────────────────────────────────
export const MOCK_TALENTS: MockTalent[] = [
  {
    id: "talent-001",
    name: "Juan dela Cruz",
    gender: "MALE",
    height_cm: 174,
    weight_kg: 68,
    certificates: ["フォークリフト", "普通免許"],
    fb_profile_url: "https://facebook.com/juan.delacruz",
    suitability_score: 0.82,
    years_experience: 3,   // 倉庫・フォークリフト作業3年
    desired_salary_min: 175000,
    availability_date: "2025-04-01",
  },
  {
    id: "talent-002",
    name: "Maria Santos",
    gender: "FEMALE",
    height_cm: 158,
    weight_kg: 52,
    certificates: ["介護職員初任者研修", "N3"],
    fb_profile_url: "https://facebook.com/maria.santos",
    suitability_score: 0.75,
    years_experience: 5,   // デイサービス介護5年
    desired_salary_min: 160000,
    availability_date: "2025-04-01",
  },
  {
    id: "talent-003",
    name: "Carlos Reyes",
    gender: "MALE",
    height_cm: 168,
    weight_kg: 72,
    certificates: ["玉掛け", "足場"],
    fb_profile_url: "https://facebook.com/carlos.reyes",
    suitability_score: 0.70,
    years_experience: 2,   // 建設現場補助2年
    desired_salary_min: 195000,
    availability_date: "2025-05-01",
  },
  {
    id: "talent-004",
    name: "Jose Mendoza",
    gender: "MALE",
    height_cm: 178,
    weight_kg: 80,
    certificates: ["大型免許", "フォークリフト", "危険物取扱乙4"],
    fb_profile_url: "https://facebook.com/jose.mendoza",
    suitability_score: 0.88,
    years_experience: 7,   // 大型トラックドライバー7年
    desired_salary_min: 190000,
    availability_date: "2025-04-15",
  },
  {
    id: "talent-005",
    name: "Ana dela Rosa",
    gender: "FEMALE",
    height_cm: 162,
    weight_kg: 54,
    certificates: ["介護福祉士", "N2", "実務者研修"],
    fb_profile_url: "https://facebook.com/ana.delarosa",
    suitability_score: 0.91,
    years_experience: 4,   // 介護福祉士4年
    desired_salary_min: 170000,
    availability_date: "2025-03-15",
  },
  {
    id: "talent-006",
    name: "Rodel Bautista",
    gender: "MALE",
    height_cm: 171,
    weight_kg: 75,
    certificates: ["玉掛け", "溶接"],
    fb_profile_url: "https://facebook.com/rodel.bautista",
    suitability_score: 0.73,
    years_experience: 3,   // 鉄筋・溶接現場3年
    desired_salary_min: 200000,
    availability_date: "2025-06-01",
  },
  {
    id: "talent-007",
    name: "Christine Aquino",
    gender: "FEMALE",
    height_cm: 155,
    weight_kg: 48,
    certificates: ["N3", "ホームヘルパー2級"],
    fb_profile_url: "https://facebook.com/christine.aquino",
    suitability_score: 0.68,
    years_experience: 1,   // ホームヘルパー1年
    desired_salary_min: 155000,
    availability_date: "2025-04-01",
  },
  {
    id: "talent-008",
    name: "Mark Villanueva",
    gender: "MALE",
    height_cm: 182,
    weight_kg: 85,
    certificates: ["大型二種", "フォークリフト", "危険物取扱甲"],
    fb_profile_url: "https://facebook.com/mark.villanueva",
    suitability_score: 0.85,
    years_experience: 10,  // 大型トラック・危険物輸送10年
    desired_salary_min: 210000,
    availability_date: "2025-04-01",
  },
  {
    id: "talent-009",
    name: "Romeo Garcia",
    gender: "MALE",
    height_cm: 165,
    weight_kg: 70,
    certificates: ["フォークリフト", "玉掛け"],
    fb_profile_url: "https://facebook.com/romeo.garcia",
    suitability_score: 0.72,
    years_experience: 5,   // 倉庫・物流センター5年
    desired_salary_min: 175000,
    availability_date: "2025-05-15",
  },
  {
    id: "talent-010",
    name: "Luz Manalo",
    gender: "FEMALE",
    height_cm: 160,
    weight_kg: 55,
    certificates: ["介護職員初任者研修", "N4"],
    fb_profile_url: "https://facebook.com/luz.manalo",
    suitability_score: 0.60,
    years_experience: 1,   // 介護補助1年
    desired_salary_min: 150000,
    availability_date: "2025-07-01",
  },
];

// ─── アンホーム物件データ (10件) ─────────────────────────
// interior_images: picsum.photos のシードURLで一貫した画像を表示
export const MOCK_PROPERTIES: MockProperty[] = [
  // ── job-001 (西淀川区: 34.6937, 135.4576) 周辺 ──
  {
    id: "prop-001",
    name: "レオパレス大和田",
    address: "大阪市西淀川区大和田3丁目5-2",
    lat: 34.6952,
    lng: 135.4601,
    rent: 45000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-bright-001/400/260",
      "https://picsum.photos/seed/kitchen-clean-001/400/260",
    ],
  },
  {
    id: "prop-002",
    name: "一建設 姫島コーポラス",
    address: "大阪市西淀川区姫島5丁目11-8",
    lat: 34.7010,
    lng: 135.4521,
    rent: 52000,
    floor_plan: "1DK",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-modern-002/400/260",
      "https://picsum.photos/seed/bath-clean-002/400/260",
    ],
  },
  {
    id: "prop-003",
    name: "アンホーム 出来島荘",
    address: "大阪市西淀川区出来島1丁目3-14",
    lat: 34.6880,
    lng: 135.4450,
    rent: 43000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "東栄住宅",
    interior_images: [
      "https://picsum.photos/seed/room-cozy-003/400/260",
    ],
  },
  {
    id: "prop-004",
    name: "一建設 野里ハイツ",
    address: "大阪市西淀川区野里1丁目22-5",
    lat: 34.7090,
    lng: 135.4630,
    rent: 48000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-new-004/400/260",
      "https://picsum.photos/seed/exterior-004/400/260",
    ],
  },
  // ── job-002 (尼崎市: 34.7328, 135.4148) 周辺 ──
  {
    id: "prop-005",
    name: "アンホーム 武庫之荘",
    address: "兵庫県尼崎市南武庫之荘1丁目4-7",
    lat: 34.7348,
    lng: 135.4132,
    rent: 48000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "アンホーム不動産",
    interior_images: [
      "https://picsum.photos/seed/room-white-005/400/260",
      "https://picsum.photos/seed/kitchen-005/400/260",
    ],
  },
  {
    id: "prop-006",
    name: "一建設 塚口サニーコート",
    address: "兵庫県尼崎市塚口町2丁目8-15",
    lat: 34.7470,
    lng: 135.4210,
    rent: 55000,
    floor_plan: "2K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-spacious-006/400/260",
      "https://picsum.photos/seed/living-006/400/260",
      "https://picsum.photos/seed/bath-006/400/260",
    ],
  },
  {
    id: "prop-007",
    name: "アンホーム 立花パレス",
    address: "兵庫県尼崎市立花町3丁目1-9",
    lat: 34.7200,
    lng: 135.4320,
    rent: 46000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "東栄住宅",
    interior_images: [
      "https://picsum.photos/seed/room-warm-007/400/260",
    ],
  },
  // ── job-003 (淀川区: 34.7344, 135.4967) 周辺 ──
  {
    id: "prop-008",
    name: "一建設 西中島南方コート",
    address: "大阪市淀川区西中島6丁目2-11",
    lat: 34.7320,
    lng: 135.4940,
    rent: 58000,
    floor_plan: "1DK",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-city-008/400/260",
      "https://picsum.photos/seed/kitchen-modern-008/400/260",
    ],
  },
  {
    id: "prop-009",
    name: "アンホーム 新大阪ロイヤル",
    address: "大阪市淀川区宮原3丁目5-22",
    lat: 34.7330,
    lng: 135.5020,
    rent: 62000,
    floor_plan: "2K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "アンホーム不動産",
    interior_images: [
      "https://picsum.photos/seed/room-premium-009/400/260",
      "https://picsum.photos/seed/living-premium-009/400/260",
      "https://picsum.photos/seed/bath-premium-009/400/260",
    ],
  },
  {
    id: "prop-010",
    name: "一建設 十三グリーンハイツ",
    address: "大阪市淀川区十三本町2丁目7-4",
    lat: 34.7240,
    lng: 135.4880,
    rent: 50000,
    floor_plan: "1K",
    management_company: "AN_HOME",
    available: true,
    house_maker: "一建設",
    interior_images: [
      "https://picsum.photos/seed/room-green-010/400/260",
      "https://picsum.photos/seed/exterior-010/400/260",
    ],
  },
];
