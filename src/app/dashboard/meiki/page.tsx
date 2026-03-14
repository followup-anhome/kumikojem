"use client";

/**
 * /dashboard/meiki
 * ファースト住建（型枠大工・足場）× 目利きスコア × AnHome 泉佐野
 * ――「即戦力人材 ＋ 最高住環境」フルコース提案ダッシュボード
 */

import { useState } from "react";
import Link from "next/link";
import { MOCK_TALENTS, type MockTalent } from "@/lib/mock-data";

// ─── 求人定義 ─────────────────────────────────────────────────
const JOB = {
  company:    "ファースト住建株式会社",
  title:      "建築現場作業員（型枠大工・足場）",
  location:   "大阪府泉佐野市",
  salaryMin:  250_000,
  salaryMax:  320_000,
  reqCerts:   ["玉掛け", "足場"] as string[],
  tags:       ["体力・ガタイ重視", "真面目重視", "外国人可", "経験者優遇"],
  desc:       "型枠大工・足場組立の経験者を優遇。ガタイが良く真面目な方を歓迎。無断欠勤厳禁。",
};

// ─── AnHome 物件 ──────────────────────────────────────────────
const PROP = {
  name:     "AnHome 泉佐野第1レジデンス",
  address:  "大阪府泉佐野市栄町2丁目",
  rent:     30_000,
  commute:  "現場まで自転車7分",
  features: ["無料Wi-Fi完備", "家具家電付き", "外国人入居歓迎", "敷金ゼロ"],
  img:      "https://picsum.photos/seed/izumisano-anhome-01/640/400",
};

// ─── ペソ換算 ─────────────────────────────────────────────────
const GROSS     = 250_000;
const NET_JPY   = Math.round(GROSS * 0.76);            // 税・社保 概算 24% 控除
const NET_PHP   = Math.round(NET_JPY * 0.37 / 1000) * 1000; // 1円≈₱0.37

// ─── 目利きスコア計算エンジン ─────────────────────────────────
function calcMeiki(t: MockTalent) {
  const has = (c: string) => t.certificates.includes(c);

  // 体格点 (0–100) ← ガタイの良さ重視 → weight 55%
  const h = t.height_cm ?? 0;
  const w = t.weight_kg ?? 0;
  const hPts =
    h >= 180 ? 100 :
    h >= 175 ? 85  :
    h >= 170 ? 70  :
    h >= 165 ? 55  : 40;
  const wPts =
    w >= 85 ? 100 :
    w >= 80 ? 88  :
    w >= 75 ? 75  :
    w >= 70 ? 62  :
    w >= 65 ? 48  : 32;
  const gMod  = t.gender === "MALE" ? 1.0 : 0.32;
  const build = ((hPts + wPts) / 2) * gMod;

  // 建設経験点 (0–100) ← weight 20%
  const conCerts = ["足場", "玉掛け", "溶接", "クレーン"].filter(has).length;
  const cMul     = conCerts >= 2 ? 1.0 : conCerts === 1 ? 0.5 : 0;
  const exp      = conCerts > 0
    ? Math.min(100, t.years_experience! * 20 * cMul + conCerts * 12)
    : Math.min(18, (t.years_experience ?? 0) * 3);

  // 資格マッチ点 (0–100) ← weight 25%
  const certs = Math.min(100,
    (has("足場")   ? 55 : 0) +
    (has("玉掛け") ? 30 : 0) +
    (has("溶接")   ? 10 : 0)
  );

  const base    = build * 0.55 + exp * 0.20 + certs * 0.25;
  const bonus   = JOB.reqCerts.every(has) ? 5 : 0;   // 全必須資格一致ボーナス
  const total   = Math.min(99, Math.round(base + bonus));

  return {
    total,
    build:  Math.round(build),
    exp:    Math.round(exp),
    certs,
    bonus:  bonus > 0,
  };
}

type Scored = MockTalent & { sc: ReturnType<typeof calcMeiki> };

// ランキング生成
const RANKED: Scored[] = [...MOCK_TALENTS]
  .map((t) => ({ ...t, sc: calcMeiki(t) }))
  .sort((a, b) => b.sc.total - a.sc.total);

// ─── ユーティリティ ───────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("ja-JP");

const MEDALS  = ["🥇", "🥈", "🥉"];
const RANK_STYLES = [
  { outer: "bg-gradient-to-br from-yellow-500/20 to-amber-600/5 border-yellow-500/40",  badge: "bg-yellow-500 text-slate-900", score: "text-yellow-400" },
  { outer: "bg-gradient-to-br from-slate-400/20 to-slate-500/5 border-slate-400/40",   badge: "bg-slate-300 text-slate-900",  score: "text-slate-300"  },
  { outer: "bg-gradient-to-br from-orange-600/20 to-orange-700/5 border-orange-600/40",badge: "bg-orange-600 text-white",     score: "text-orange-400" },
];

// ─── ページ ───────────────────────────────────────────────────
export default function MeikiDashboard() {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? RANKED : RANKED.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#080e1e] text-white">

      {/* ── ヘッダー ── */}
      <header className="bg-[#0d1e3a] border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/talent" className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">🏗️</div>
            <div>
              <div className="font-black text-sm leading-none tracking-tight">KUMIKOJEM</div>
              <div className="text-[10px] text-blue-300 leading-none mt-0.5">目利きダッシュボード</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 border border-green-500/30 rounded-full text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
              AI LIVE
            </span>
            <Link href="/dashboard" className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition">
              ← ダッシュボード
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── TOP STATS BAR ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
          <StatCard icon="👥" val={`${RANKED.length}名`}  label="分析候補者" />
          <StatCard icon="🥇" val={`${RANKED[0]?.sc.total}pt`} label="最高スコア" accent />
          <StatCard icon="💴" val={`¥${fmt(JOB.salaryMin / 10_000)}万〜`} label="月給" />
          <StatCard icon="🇵🇭" val={`₱${fmt(NET_PHP / 1000)}K`} label="手取りペソ" gold />
          <StatCard icon="🏠" val={`¥${fmt(PROP.rent / 1000)}K`} label="AnHome家賃" emerald />
          <StatCard icon="🚲" val="7分"   label="自転車通勤" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ──────────── LEFT: 求人 + 候補者 ──────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* 求人カード */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-xs text-red-400 font-bold animate-pulse">
                      🔥 緊急採用
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300">
                      建設・足場
                    </span>
                  </div>
                  <h1 className="text-lg font-black leading-snug">{JOB.title}</h1>
                  <p className="text-slate-400 text-sm mt-0.5">{JOB.company}</p>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">{JOB.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-amber-400">
                    ¥{(JOB.salaryMin / 10_000).toFixed(0)}万〜
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {(JOB.salaryMax / 10_000).toFixed(0)}万円 / 月
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/60">
                <div className="flex items-center gap-2 text-sm">
                  <span>📍</span>
                  <div>
                    <div className="text-xs text-slate-500">勤務地</div>
                    <div className="font-semibold">{JOB.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🏆</span>
                  <div>
                    <div className="text-xs text-slate-500">優遇資格</div>
                    <div className="font-semibold">{JOB.reqCerts.join(" / ")}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {JOB.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 bg-slate-700/70 text-slate-300 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI分析ヘッダー */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-black flex items-center gap-2">
                  🎯 代表の「目利きスコア」— AI自動採点
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  体格（55%）・建設経験（20%）・資格マッチ（25%）の3軸で全10名を採点
                </p>
              </div>
              <span className="text-xs text-slate-600 whitespace-nowrap">
                {RANKED.length}名分析済み
              </span>
            </div>

            {/* 候補者カード */}
            <div className="space-y-3">
              {list.map((t) => {
                const rank = RANKED.indexOf(t);
                return <CandidateCard key={t.id} talent={t} rank={rank} />;
              })}
            </div>

            {!showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 border border-slate-700/60 text-slate-500 rounded-xl text-sm hover:border-slate-600 hover:text-slate-400 transition flex items-center justify-center gap-2"
              >
                残り {RANKED.length - 3} 名を表示（スコア低順）
                <span className="text-xs">↓</span>
              </button>
            )}
          </div>

          {/* ──────────── RIGHT: サイドバー ──────────── */}
          <div className="space-y-5">
            <PesoCard />
            <PropertyCard />
            <ProposalCard />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 候補者カード ─────────────────────────────────────────────
function CandidateCard({ talent, rank }: { talent: Scored; rank: number }) {
  const [open, setOpen] = useState(false);
  const isTop3 = rank < 3;
  const { sc } = talent;
  const perfectMatch = JOB.reqCerts.every((c) => talent.certificates.includes(c));
  const style = isTop3 ? RANK_STYLES[rank] : null;

  return (
    <div
      role="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={`rounded-2xl border p-4 cursor-pointer transition-all select-none ${
        style
          ? `${style.outer} hover:brightness-110`
          : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"
      }`}
    >
      {/* ── 上段: アイコン + 名前 + スコア ── */}
      <div className="flex items-center gap-3">
        {/* ランクバッジ */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 shadow-sm ${
            style ? style.badge : "bg-slate-700 text-slate-400"
          }`}
        >
          {rank < 3 ? MEDALS[rank] : `#${rank + 1}`}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-sm">{talent.name}</span>
            <span className="text-xs text-slate-500">{talent.gender === "MALE" ? "♂ M" : "♀ F"}</span>
            {perfectMatch && (
              <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-400 font-bold">
                ✓ 資格完全一致
              </span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
            <span>📏 {talent.height_cm}cm</span>
            <span>⚖️ {talent.weight_kg}kg</span>
            <span>🔧 {talent.years_experience}年経験</span>
          </div>
        </div>

        {/* スコア */}
        <div className="text-right flex-shrink-0">
          <div className={`text-4xl font-black leading-none ${style ? style.score : "text-slate-400"}`}>
            {sc.total}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">pt / 99</div>
        </div>
      </div>

      {/* ── 下段: スコアバー (TOP3は常時展開) ── */}
      {(isTop3 || open) && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2.5">
          <ScoreRow label="体格・ガタイ" value={sc.build}  color="bg-blue-500"    />
          <ScoreRow label="建設経験"     value={sc.exp}    color="bg-violet-500"  />
          <ScoreRow label="資格マッチ"   value={sc.certs}  color="bg-emerald-500" />

          {/* 資格バッジ */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {talent.certificates.map((c) => (
              <span
                key={c}
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  JOB.reqCerts.includes(c)
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-slate-700/70 text-slate-400"
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              受入可能: {talent.availability_date}
            </span>
            <a
              href={talent.fb_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              FB確認 →
            </a>
          </div>
        </div>
      )}

      {!isTop3 && !open && (
        <div className="text-xs text-slate-700 text-right mt-1.5">タップで詳細 ↓</div>
      )}
    </div>
  );
}

// ─── 手取りペソ換算カード ─────────────────────────────────────
function PesoCard() {
  return (
    <div className="bg-gradient-to-br from-amber-500/12 to-orange-600/5 border border-amber-500/30 rounded-2xl p-5">
      <h3 className="font-black text-xs text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        🇵🇭 手取りペソ換算
        <span className="font-normal text-slate-500 normal-case tracking-normal text-xs">候補者目線</span>
      </h3>

      <div className="space-y-2 text-sm">
        <PRow label="月給（額面）"       value={`¥${fmt(GROSS)}`} />
        <PRow label="税・社保（概算24%）" value={`－¥${fmt(GROSS - NET_JPY)}`} red />
        <div className="border-t border-slate-700/60 pt-2">
          <PRow label="手取り（円）" value={`¥${fmt(NET_JPY)}`} bold />
        </div>
      </div>

      {/* 大きいペソ表示 */}
      <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-5 text-center">
        <div className="text-xs text-amber-400/70 mb-1">フィリピンペソ換算（1円≈₱0.37）</div>
        <div className="text-5xl font-black text-amber-400 leading-none">₱{fmt(NET_PHP)}</div>
        <div className="text-xs text-amber-400/60 mt-1.5">/ 月 相当</div>
      </div>

      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
        ※ 概算値。実際の為替・税額は変動します。
      </p>
    </div>
  );
}

// ─── AnHome 物件カード ────────────────────────────────────────
function PropertyCard() {
  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/30 rounded-2xl overflow-hidden">
      {/* 物件画像 */}
      <div className="relative h-36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROP.img}
          alt={PROP.name}
          className="absolute inset-0 w-full h-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080e1e] via-[#080e1e]/40 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <span className="px-2 py-0.5 bg-emerald-500 text-black text-xs font-black rounded-full shadow">
            🏠 AnHome 自社管理物件
          </span>
        </div>
      </div>

      {/* 物件情報 */}
      <div className="p-4">
        <h3 className="font-black text-sm leading-snug">{PROP.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{PROP.address}</p>

        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="text-3xl font-black text-emerald-400">¥{fmt(PROP.rent)}</div>
            <div className="text-xs text-slate-500">/ 月</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">通勤</div>
            <div className="text-sm font-bold text-emerald-300">🚲 {PROP.commute}</div>
          </div>
        </div>

        {/* 特徴一覧 */}
        <div className="grid grid-cols-2 gap-1 mt-3">
          {PROP.features.map((f) => (
            <div key={f} className="flex items-center gap-1 text-xs text-emerald-300/80">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* キャッチコピー */}
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <div className="text-xs text-emerald-300 font-bold">💡 外国人労働者が絶対に逃げない優良物件</div>
          <div className="text-xs text-slate-500 mt-1 leading-relaxed">
            仕事＋住まいをワンストップ提供。<br />
            候補者の離脱率ほぼゼロを実現。
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── フルコース提案サマリー ───────────────────────────────────
function ProposalCard() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
      <h3 className="font-black text-sm mb-3 flex items-center gap-2">
        📋 フルコース提案
        <span className="text-xs font-normal text-slate-500">逃げ道なし完璧プラン</span>
      </h3>

      <div className="space-y-2.5">
        <PropRow icon="💼" label="UNO（求人）"       value={JOB.title}         color="text-blue-400" />
        <PropRow icon="🏠" label="AnHome（住まい）"   value={PROP.name}         color="text-emerald-400" />
        <PropRow icon="🇵🇭" label="手取り（ペソ）"    value={`₱${fmt(NET_PHP)} / 月`} color="text-amber-400" />
        <PropRow icon="💡" label="家賃"               value={`¥${fmt(PROP.rent)} / 月`} color="text-emerald-400" />
        <PropRow icon="🚲" label="通勤"               value={PROP.commute}      color="text-slate-300" />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          即戦力人材（UNO）＋ 最高の住環境（AnHome）。<br />
          顧客に提示するフルコースの完成形。
        </p>
        <button
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl text-sm hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-900/30 active:scale-[0.98]"
          onClick={() => alert("提案書出力（Demo）")}
        >
          提案書を出力 →
        </button>
      </div>
    </div>
  );
}

// ─── 共通サブコンポーネント ───────────────────────────────────
function StatCard({
  icon, val, label, accent = false, gold = false, emerald = false,
}: {
  icon: string; val: string; label: string;
  accent?: boolean; gold?: boolean; emerald?: boolean;
}) {
  const textColor = gold ? "text-amber-400" : emerald ? "text-emerald-400" : accent ? "text-blue-400" : "text-white";
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 sm:p-3 text-center">
      <div className="text-lg sm:text-xl">{icon}</div>
      <div className={`font-black text-xs sm:text-sm mt-1 ${textColor}`}>{val}</div>
      <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}</span>
      </div>
      <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PRow({ label, value, red = false, bold = false }: { label: string; value: string; red?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-sm ${red ? "text-red-400" : "text-white"} ${bold ? "font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function PropRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-xs font-bold ${color} truncate`}>{value}</div>
      </div>
    </div>
  );
}
