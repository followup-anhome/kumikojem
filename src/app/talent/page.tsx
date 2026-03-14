"use client";

import { useState } from "react";
import Link from "next/link";
import JobHousingCard from "@/components/talent/JobHousingCard";
import { MOCK_JOBS, MOCK_PROPERTIES } from "@/lib/mock-data";
import { rankJobsForTalent } from "@/lib/matcher";
import { analyzeFBProfile, fbResultToMatcherScore } from "@/lib/fb-analyzer";

// デモ用タレント（Juan = talent-001 のモックプロフィール）
const DEMO_TALENT = {
  id: "talent-001",
  name: "Juan",
  height_cm: 174,
  weight_kg: 68,
  certificates: ["フォークリフト", "普通免許"],
  desired_salary_min: 175000,
  suitability_score: 0.82,
  fb_vitality_score: fbResultToMatcherScore(analyzeFBProfile("https://facebook.com/juan.delacruz")),
};

// スコア計算（全求人 × Juanのプロフィール）
const RANKED = rankJobsForTalent(DEMO_TALENT, MOCK_JOBS, MOCK_PROPERTIES, 5);
const SCORE_MAP = Object.fromEntries(RANKED.map((r) => [r.job_id, r.score]));

const CATEGORY_FILTERS = [
  { key: "ALL",          label: "All Jobs", emoji: "🌐" },
  { key: "LOGISTICS",    label: "Logistics", emoji: "🚛" },
  { key: "CONSTRUCTION", label: "Construction", emoji: "🏗️" },
  { key: "CARE",         label: "Care", emoji: "🤝" },
  { key: "FACTORY",      label: "Factory", emoji: "🏭" },
];

export default function TalentHomePage() {
  const [filter, setFilter] = useState("ALL");
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = MOCK_JOBS.filter(
    (j) => filter === "ALL" || j.category === filter
  ).sort((a, b) => (SCORE_MAP[b.id] ?? 0) - (SCORE_MAP[a.id] ?? 0));

  function toggleSave(jobId: string) {
    setSaved((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────── */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              🏗️
            </div>
            <div>
              <div className="font-black text-base leading-none">KUMIKOJEM</div>
              <div className="text-[10px] text-blue-200 leading-none mt-0.5">Jobs in Japan 🇯🇵</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/talent/chat"
              className="relative px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              💬 Chat
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <Link href="/talent/register"
              className="px-3 py-1.5 text-xs bg-white text-[#1e3a5f] font-bold rounded-lg hover:bg-blue-50 transition-colors">
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Welcome Banner ────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8] text-white px-4 pt-5 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-blue-200 text-sm">Good day,</p>
          <h1 className="text-2xl font-black mt-1">
            Hey {DEMO_TALENT.name}! 🇵🇭
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            We found <strong className="text-white">{filtered.length} jobs</strong> matched for you in Japan.
          </p>

          <div className="flex gap-4 mt-4">
            <StatBadge value={MOCK_JOBS.length} label="Jobs" icon="📋" />
            <StatBadge value={MOCK_PROPERTIES.length} label="Housing" icon="🏠" />
            <StatBadge value={saved.length} label="Saved" icon="🔖" />
          </div>
        </div>
      </div>

      {/* ── Filter Chips ─────────────────────────── */}
      <div className="sticky top-14 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-[#1e3a5f] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Job Cards ────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-4 -mt-4 relative z-10 space-y-4">
        {filtered.map((job) => (
          <JobHousingCard
            key={job.id}
            job={job}
            properties={MOCK_PROPERTIES}
            matchScore={SCORE_MAP[job.id]}
            onApply={(id) => alert(`Applied for: ${id}\n(Demo mode — real form coming soon!)`)}
            onSave={(id) => toggleSave(id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-sm">No jobs found for this category.</p>
          </div>
        )}

        {/* 末尾バナー */}
        <div className="bg-[#1e3a5f] text-white rounded-2xl p-5 text-center">
          <div className="text-2xl mb-2">💼</div>
          <p className="font-bold">Want more personalized matches?</p>
          <p className="text-blue-200 text-sm mt-1">Register your profile and FB URL for AI-powered matching.</p>
          <Link href="/talent/register"
            className="inline-block mt-3 px-6 py-2.5 bg-white text-[#1e3a5f] font-bold rounded-xl text-sm">
            Create Profile →
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatBadge({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
      <span className="text-sm">{icon}</span>
      <span className="font-black text-white">{value}</span>
      <span className="text-xs text-blue-200">{label}</span>
    </div>
  );
}
