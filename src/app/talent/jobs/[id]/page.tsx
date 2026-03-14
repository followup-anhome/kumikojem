"use client";

import { use, useState } from "react";
import Link from "next/link";
import PropertyImageCard from "@/components/talent/PropertyImageCard";
import BookingModal, { type BookingResult } from "@/components/talent/BookingModal";
import { MOCK_JOBS, MOCK_PROPERTIES } from "@/lib/mock-data";
import { calcDistanceKm } from "@/lib/geo-matcher";

const CATEGORY_CONFIG = {
  LOGISTICS:    { label: "Logistics",    emoji: "🚛", color: "bg-blue-600" },
  CONSTRUCTION: { label: "Construction", emoji: "🏗️", color: "bg-orange-500" },
  CARE:         { label: "Care Work",    emoji: "🤝", color: "bg-emerald-600" },
  FACTORY:      { label: "Factory",      emoji: "🏭", color: "bg-purple-600" },
} as const;

const CERT_EN: Record<string, string> = {
  "フォークリフト": "Forklift License",
  "大型免許": "Large Vehicle License",
  "普通免許": "Regular Driver License",
  "危険物取扱乙4": "Hazardous Materials Type 4",
  "危険物取扱甲": "Hazardous Materials Full",
  "大型二種": "Large Vehicle Class 2",
  "玉掛け": "Rigging License",
  "足場": "Scaffolding License",
  "溶接": "Welding Certification",
  "介護福祉士": "Certified Care Worker",
  "介護職員初任者研修": "Initial Caregiver Training",
  "実務者研修": "Practical Training",
  "N1": "JLPT N1", "N2": "JLPT N2", "N3": "JLPT N3", "N4": "JLPT N4",
  "ホームヘルパー2級": "Home Helper Level 2",
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const job = MOCK_JOBS.find((j) => j.id === id);

  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p>Job not found.</p>
          <Link href="/talent" className="text-blue-600 text-sm mt-2 inline-block">← Back to jobs</Link>
        </div>
      </div>
    );
  }

  const cfg = CATEGORY_CONFIG[job.category];

  // 近隣物件 (5km以内、距離昇順)
  const nearbyProps = MOCK_PROPERTIES
    .map((p) => ({
      ...p,
      distance_km: Math.round(
        calcDistanceKm({ lat: job.location_lat, lng: job.location_lng }, { lat: p.lat, lng: p.lng }) * 100
      ) / 100,
    }))
    .filter((p) => p.distance_km <= 5)
    .sort((a, b) => a.distance_km - b.distance_km);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className={`${cfg.color} text-white sticky top-0 z-40 shadow-lg`}>
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/talent" className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-lg">{cfg.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{job.title}</div>
            <div className="text-xs opacity-70">{job.company_name}</div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Job Banner */}
        <div className={`${cfg.color} text-white px-5 pt-2 pb-8`}>
          {/* Critical Need badge */}
          {job.critical_need && (
            <div className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
              🚨 Critical Need — 2024 Problem
            </div>
          )}
          <div className="text-xs opacity-70 uppercase tracking-wider mb-1">{cfg.label}</div>
          <h1 className="text-2xl font-black leading-tight">{job.title}</h1>
          <p className="text-sm opacity-80 mt-1">{job.company_name}</p>
        </div>

        <div className="px-4 -mt-4 space-y-4 pb-32">
          {/* Key Info Card */}
          <div className="bg-white rounded-2xl shadow-md p-4 border border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox icon="💴" label="Monthly Salary"
                value={job.salary_min && job.salary_max
                  ? `¥${(job.salary_min / 10000).toFixed(0)}〜${(job.salary_max / 10000).toFixed(0)}万`
                  : "Negotiable"}
                valueStyle="text-blue-600 font-bold text-base"
              />
              <InfoBox icon="📍" label="Location" value={job.location_name} />
              <InfoBox
                icon={job.housing_status ? "🏠" : "🚶"}
                label="Company Housing"
                value={job.housing_status ? "Provided ✓" : "Self-arranged"}
                valueStyle={job.housing_status ? "text-emerald-600 font-semibold" : ""}
              />
              <InfoBox icon="📅" label="Start Date" value="ASAP" />
            </div>
          </div>

          {/* About the Job */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-2">About this Job</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
          </div>

          {/* Required Certificates */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-3">Requirements & Certificates</h2>
            <div className="flex flex-wrap gap-2">
              {["フォークリフト", "大型免許", "普通免許", "N3", "介護職員初任者研修", "玉掛け"].slice(
                0,
                job.category === "LOGISTICS" ? 3
                  : job.category === "CARE" ? 3
                  : 2
              ).map((cert) => (
                <span key={cert}
                  className="text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl font-medium">
                  📜 {CERT_EN[cert] ?? cert}
                </span>
              ))}
            </div>
          </div>

          {/* Book Interview CTA */}
          {!booking ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📅</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">Ready to interview?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule directly with {job.company_name}. Pick your date and time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBooking(true)}
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors active:scale-95"
              >
                📅 Book Interview →
              </button>
            </div>
          ) : (
            // Booking confirmed banner
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className="font-bold text-emerald-800 text-sm">Interview Booked!</span>
              </div>
              <div className="text-xs text-emerald-700 space-y-1">
                <p>📅 {new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric"
                })}</p>
                <p>⏰ {booking.timeSlot} · {booking.interviewType === "online" ? "💻 Online" : "📍 In-Person"}</p>
                <p className="text-emerald-500 font-medium">✓ Added to Google Calendar</p>
              </div>
            </div>
          )}

          {/* ── Nearby Housing Section ── */}
          {nearbyProps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏠</span>
                <h2 className="font-bold text-slate-900">
                  Nearby Housing ({nearbyProps.length} options)
                </h2>
              </div>
              <div className="space-y-3">
                {nearbyProps.map((p) => (
                  <PropertyImageCard
                    key={p.id}
                    property={p}
                    distance_km={p.distance_km}
                    compact={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Apply + Chat Buttons */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex gap-3">
          <Link
            href="/talent/chat"
            className="flex-shrink-0 w-12 h-12 border border-slate-200 rounded-xl flex items-center justify-center text-xl hover:bg-slate-50 transition-colors"
          >
            💬
          </Link>
          <button
            onClick={() => setShowBooking(true)}
            className="flex-shrink-0 w-12 h-12 border border-emerald-300 bg-emerald-50 rounded-xl flex items-center justify-center text-xl hover:bg-emerald-100 transition-colors"
            title="Book Interview"
          >
            📅
          </button>
          <button
            onClick={() => alert("Application submitted! (Demo mode)")}
            className={`flex-1 py-3 ${cfg.color} text-white font-bold rounded-xl text-sm shadow-sm active:scale-95 transition-transform`}
          >
            Apply for this Job →
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          jobTitle={job.title}
          companyName={job.company_name}
          onClose={() => setShowBooking(false)}
          onConfirmed={(result) => {
            setBooking(result);
            setShowBooking(false);
          }}
        />
      )}
    </div>
  );
}

function InfoBox({ icon, label, value, valueStyle = "" }: {
  icon: string; label: string; value: string; valueStyle?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-sm font-semibold text-slate-800 ${valueStyle}`}>{value}</div>
    </div>
  );
}
