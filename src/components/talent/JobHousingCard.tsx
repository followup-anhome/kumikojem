"use client";

import Link from "next/link";
import PropertyImageCard from "./PropertyImageCard";
import type { MockJob, MockProperty } from "@/lib/mock-data";
import { calcDistanceKm } from "@/lib/geo-matcher";
import { toEnTitle, toEnDesc, formatSalaryWithPeso } from "@/lib/job-translations";
import { COMPANY_NAME_EN, LOCATION_NAME_EN } from "@/lib/mock-data";

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

  const { jpy, php } = formatSalaryWithPeso(job.salary_min, job.salary_max);
  const titleEn = toEnTitle(job.title);
  const descEn = toEnDesc(job.description || "");
  const companyEn = COMPANY_NAME_EN[job.company_name] || job.company_name;
  const locationEn = LOCATION_NAME_EN[job.location_name] || job.location_name;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 w-full">

      {/* Category Header */}
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

        {job.critical_need && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              🚨 Critical Need — 2024 Problem
            </span>
            <span className="text-white/80 text-xs">Urgent Hire!</span>
          </div>
        )}
      </div>

      {/* Job Info */}
      <div className="p-4">
        {/* タイトル（英語） */}
        <h2 className="text-xl font-black text-slate-900 leading-tight">{titleEn}</h2>
        <div className="mt-0.5">
          <p className="text-sm font-semibold text-slate-700">{companyEn}</p>
          <p className="text-xs text-slate-400">{job.company_name}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {/* 給与（JPY + PHP） */}
          <div className="bg-slate-50 rounded-xl p-2.5 col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">💴</span>
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Salary</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800">{jpy}</span>
              {php && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ≈ {php}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">*PHP rate approx. ¥1 = ₱0.37</p>
          </div>

          <InfoChipBilingual icon="📍" label="Location" valueEn={locationEn} valueJa={job.location_name} />
          <InfoChip
            icon={job.housing_status ? "🏠" : "🚶"}
            label="Housing"
            value={job.housing_status ? "Included ✓" : "Self-arranged"}
            valueColor={job.housing_status ? "text-emerald-600 font-semibold" : "text-slate-500"}
          />
        </div>

        {/* 説明文（英語） */}
        {descEn && (
          <p className="text-sm text-slate-600 mt-3 leading-relaxed border-t border-slate-50 pt-3">
            {descEn}
          </p>
        )}
      </div>

      {/* Nearby Housing */}
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

      {/* Action Buttons */}
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

function InfoChip({
  icon, label, value, valueColor = "text-slate-800",
}: {
  icon: string; label: string; value: string; valueColor?: string;
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

function InfoChipBilingual({
  icon, label, valueEn, valueJa,
}: {
  icon: string; label: string; valueEn: string; valueJa: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-800 truncate">{valueEn}</div>
      <div className="text-xs text-slate-400 truncate">{valueJa}</div>
    </div>
  );
}
