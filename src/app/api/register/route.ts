export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VisaType,
  JapaneseLevel,
  EnglishLevel,
  SalaryType,
  Gender,
} from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      nationality = "Philippines",
      gender,
      height_cm,
      weight_kg,
      visa_type,
      japanese_level,
      english_level,
      skills = [],
      certs = [],
      desired_prefecture,
      salary_type,
      desired_salary,
      bio_ja,
      bio_en,
      photo_url,
      fb_profile_url,
      fb_score,
    } = body;

    // ── バリデーション ──────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "メールアドレスの形式が不正です" }, { status: 400 });
    }
    if (!Object.values(VisaType).includes(visa_type)) {
      return NextResponse.json({ error: "ビザ種別が不正です" }, { status: 400 });
    }
    if (!Object.values(JapaneseLevel).includes(japanese_level)) {
      return NextResponse.json({ error: "日本語レベルが不正です" }, { status: 400 });
    }
    if (!Object.values(EnglishLevel).includes(english_level)) {
      return NextResponse.json({ error: "英語レベルが不正です" }, { status: 400 });
    }

    // ── ユーザー作成 ────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        nationality,
        gender: gender
          ? Object.values(Gender).includes(gender)
            ? (gender as Gender)
            : null
          : null,
        height_cm: height_cm ? parseFloat(height_cm) : null,
        weight_kg: weight_kg ? parseFloat(weight_kg) : null,
        visa_type: visa_type as VisaType,
        japanese_level: japanese_level as JapaneseLevel,
        english_level: english_level as EnglishLevel,
        skills: Array.isArray(skills) ? skills : [],
        certs: Array.isArray(certs) ? certs : [],
        desired_prefecture: desired_prefecture?.trim() || null,
        salary_type: salary_type
          ? Object.values(SalaryType).includes(salary_type)
            ? (salary_type as SalaryType)
            : null
          : null,
        desired_salary: desired_salary ? parseInt(desired_salary) : null,
        bio_ja: bio_ja?.trim() || null,
        bio_en: bio_en?.trim() || null,
        photo_url: photo_url || null,
        fb_profile_url: fb_profile_url?.trim() || null,
        fb_score: fb_score ? parseFloat(fb_score) : null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    console.error("[register]", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint") && msg.includes("email")) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
