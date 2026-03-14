"use client";

/**
 * JobHousingCard.tsx
 * 求人・住まい一体型カード — フィリピン人材向けスマホUI（英語）
 *
 * 表示内容:
 *   ① 求人情報（カテゴリ・タイトル・給与・場所・社宅有無）
 *   ② マッチスコア（存在する場合）
 *   ③ Critical Need バッジ（2024問題対応 LOGISTICS 求人）
 *   ④ 近隣のアンホーム物件（横スクロール写真カード）
 *   ⑤ Apply Now + 詳細リンクボタン
 */

import Link from "next/link";
import PropertyImageCard from "./PropertyImageCard";
import type { MockJob, MockProperty } from "@/lib/mock-data";
import { calcDistanceKm } from "@/lib/geo-matcher";

export interface JobHousingCardProps {
  job: MockJob;
  properties: MockProperty[];
  matchScore?: number;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
}

const CATEGORY_CONFIG = {
  LOGISTICS:    { label: "Logistics",    emoji: "🚛", bg: "bg-blue-600",    light: "bg-blue-50 text-blue-700" },
  CONSTRUCTION: { label: "Construction", emoji: "🏗️", bg: "bg-orange-600",  light: "bg-orange-50 text-orange-700" },
  CARE:         { label: "Care Work",    emoji: "🤝", bg: "bg-emerald-600", light: "bg-emerald-50 text-emerald-700" },
  FACTORY:      { label: "Factory",      emoji: "🏭", bg: "bg-purple-600",  light: "bg-purple-50 text-purple-700" },
} as const;

const SCORE_COLOR = (s: number) =>
  s >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
  : s >= 65 ? "text-blue-600 bg-blue-50 border-blue-200"
  : s >= 50 ? "text-amber-600 bg-amber-50 border-amber-200"
  : "text-slate-500 bg-slate-50 border-slate-200";

export default function JobHousingCard({
  job,
  properties,
  matchScore,
  onApply,
  onSave,
}: JobHousingCardProps) {
  const cfg = CATEGORY_CONFIG[job.category];

  // 勤務地から5km以内の物件を距離昇順で取得
  const nearbyProps = properties
    .map((p) => ({
      ...p,
      distance_km: Math.round(
        calcDistanceKm(
          { lat: job.location_lat, lng: job.location_lng },
          { lat: p.lat, lng: p.lng }
        ) * 100
      ) / 100,
    }))
    .filter((p) => p.distance_km <= 5)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 4);

  const salaryText =
    job.salary_min && job.salary_max
      ? `¥${(job.salary_min / 10000).toFixed(0)}〜${(job.salary_max / 10000).toFixed(0)}万/月`
      : job.salary_min
      ? `¥${(job.salary_min / 10000).toFixed(0)}万+/月`
      : "Salary negotiable";

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 w-full">

      {/* ── カテゴリヘッダー ──────────────────────────── */}
      <div className={`${cfg.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cfg.emoji}</span>
            <span className="text-white font-semibold text-sm tracking-wide uppercase">
              {cfg.label}
            </span>
          </div>
          {matchScore !== undefined && (
            <div className={`border rounded-xl px-3 py-1 ${SCORE_COLOR(matchScore)} font-black text-lg`}>
              {matchScore}
              <span className="text-xs font-normal ml-0.5">pts</span>
            </div>
          )}
        </div>

        {/* Critical Need badge */}
        {job.critical_need && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              🚨 Critical Need — 2024 Problem
            </span>
            <span className="text-white/80 text-xs">Urgent Hire!</span>
          </div>
        )}
      </div>

      {/* ── 求人情報 ──────────────────────────────────── */}
      <div className="p-4">
        <h2 className="text-xl font-black text-slate-900 leading-tight">{job.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{job.company_name}</p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <InfoChip icon="💴" label="Salary" value={salaryText} />
          <InfoChip icon="📍" label="Location" value={job.location_name} />
          <InfoChip
            icon={job.housing_status ? "🏠" : "🚶"}
            label="Housing"
            value={job.housing_status ? "Included ✓" : "Self-arranged"}
            valueColor={job.housing_status ? "text-emerald-600 font-semibold" : "text-slate-500"}
          />
          <InfoChip icon="📋" label="Category" value={cfg.label} />
        </div>

        {job.description && (
          <p className="text-sm text-slate-600 mt-3 leading-relaxed border-t border-slate-50 pt-3">
            {job.description}
          </p>
        )}
      </div>

      {/* ── 近隣物件セクション ────────────────────────── */}
      {nearbyProps.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏠</span>
              <span className="font-bold text-slate-800 text-sm">Nearby Housing</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {nearbyProps.length} options
              </span>
            </div>
            <span className="text-xs text-slate-400">within 5km</span>
          </div>

          {/* 横スクロール物件カード */}
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide pt-2"
               style={{ scrollbarWidth: "none" }}>
            {nearbyProps.map((p) => (
              <PropertyImageCard
                key={p.id}
                property={p}
                distance_km={p.distance_km}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* ── アクションボタン ──────────────────────────── */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onApply?.(job.id)}
          className="flex-1 py-3 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-bold
                     rounded-xl transition-colors text-sm shadow-sm active:scale-95"
        >
          Apply Now →
        </button>
        <Link
          href={`/talent/jobs/${job.id}`}
          className="w-12 h-12 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300
                     flex items-center justify-center text-xl transition-colors active:scale-95"
          title="View details"
          aria-label="View job details"
        >
          📋
        </Link>
        <button
          onClick={() => onSave?.(job.id)}
          className="w-12 h-12 rounded-xl border border-slate-200 hover:bg-slate-50
                     flex items-center justify-center text-xl transition-colors active:scale-95"
          aria-label="Save job"
        >
          🔖
        </button>
      </div>
    </div>
  );
}

// ─── ヘルパー ──────────────────────────────────────────────
function InfoChip({
  icon,
  label,
  value,
  valueColor = "text-slate-800",
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${valueColor} truncate`}>{value}</div>
    </div>
  );
}
