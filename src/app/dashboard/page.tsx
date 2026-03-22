"use client";

/**
 * Dashboard — KUMIKOJEM メイン管理画面
 *
 * レイアウト（デスクトップ）:
 *   ┌─ Header (navy) ──────────────────────────────┐
 *   ├─ 左サイドバー ──┬─ メインエリア ─────────────┤
 *   │  求人リスト    │  [解析パネル]               │
 *   │  + 解析済み   │  [マッチングリスト]          │
 *   │               │  [マップ]                   │
 *   └───────────────┴─────────────────────────────┘
 *
 * モバイル: すべて縦積み
 */

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import JobParserPanel from "@/components/JobParserPanel";
import MatchingList from "@/components/MatchingList";
import { MOCK_JOBS, MOCK_TALENTS, MOCK_PROPERTIES, type MockJob } from "@/lib/mock-data";
import { rankTalentsForJob, type MatchResult } from "@/lib/matcher";
import { calcDistanceKm } from "@/lib/geo-matcher";
import type { ChatMessage } from "@/app/api/chat/route";

// Leaflet は SSR 非対応のため dynamic import
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─── カテゴリ表示設定 ──────────────────────────────────────
const CATEGORY_CONFIG = {
  LOGISTICS: { label: "運送・物流", color: "bg-blue-100 text-blue-700", icon: "🚛" },
  CONSTRUCTION: { label: "建設・土木", color: "bg-orange-100 text-orange-700", icon: "🏗️" },
  CARE: { label: "福祉・介護", color: "bg-emerald-100 text-emerald-700", icon: "🤝" },
  FACTORY: { label: "製造・工場", color: "bg-purple-100 text-purple-700", icon: "🏭" },
} as const;

// ─── コンポーネント ────────────────────────────────────────
export default function DashboardPage() {
  const [jobs, setJobs] = useState<MockJob[]>(MOCK_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>(MOCK_JOBS[0].id);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"matching" | "map">("matching");

  // 選択中の求人
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? jobs[0],
    [jobs, selectedJobId]
  );

  // 求人変更時にマッチング再計算
  useEffect(() => {
    if (!selectedJob) return;
    const results = rankTalentsForJob(MOCK_TALENTS, selectedJob, MOCK_PROPERTIES, 5);
    setMatchResults(results);
  }, [selectedJob]);

  // 解析済み求人の追加
  function handleJobConfirmed(newJob: Partial<MockJob>) {
    const fullJob: MockJob = {
      id: newJob.id ?? `job-${Date.now()}`,
      title: newJob.title ?? "新規求人",
      category: newJob.category ?? "FACTORY",
      description: newJob.description ?? "",
      salary_min: newJob.salary_min ?? null,
      salary_max: newJob.salary_max ?? null,
      location_name: newJob.location_name ?? "不明",
      location_lat: newJob.location_lat ?? 34.6937,
      location_lng: newJob.location_lng ?? 135.4576,
      housing_status: newJob.housing_status ?? false,
      company_name: newJob.company_name ?? "",
    };
    setJobs((prev) => [fullJob, ...prev]);
    setSelectedJobId(fullJob.id);
    setActiveSection("matching"); // 確定後はマッチングタブへ自動遷移
    setSidebarOpen(false);
    // マッチングエリアへスクロール
    setTimeout(() => {
      document.getElementById("matching")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // 推薦物件（5km以内）+ 距離付き
  const nearbyProperties = useMemo(() => {
    if (!selectedJob) return [];
    return MOCK_PROPERTIES.map((p) => ({
      ...p,
      distance_km: Math.round(
        calcDistanceKm(
          { lat: selectedJob.location_lat, lng: selectedJob.location_lng },
          { lat: p.lat, lng: p.lng }
        ) * 100
      ) / 100,
    }))
      .filter((p) => p.distance_km <= 5)
      .sort((a, b) => a.distance_km - b.distance_km);
  }, [selectedJob]);

  const cfg = selectedJob ? CATEGORY_CONFIG[selectedJob.category] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ═══════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════ */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3 px-4 h-14">
          {/* ハンバーガー (モバイル) */}
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="メニュー"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* ロゴ */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">
              🏗️
            </div>
            <div>
              <div className="font-black text-base tracking-wide leading-none">KUMIKOJEM</div>
              <div className="text-[10px] text-blue-200 leading-none mt-0.5">
                フィリピン人材マッチング
              </div>
            </div>
          </div>

          {/* 統計サマリー（デスクトップ） */}
          <div className="hidden lg:flex items-center gap-6 ml-8 text-sm">
            <StatChip icon="📋" value={jobs.length} label="求人" />
            <StatChip icon="👥" value={MOCK_TALENTS.length} label="人材" />
            <StatChip icon="🏠" value={MOCK_PROPERTIES.length} label="物件" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300
                             px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              稼働中
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ═══════════════════════════════════════════════════
            SIDEBAR (求人リスト)
        ═══════════════════════════════════════════════════ */}
        {/* モバイルオーバーレイ */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-72 bg-white border-r border-slate-200 flex flex-col
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:z-auto
          `}
          style={{ top: "56px" }}
        >
          <div className="p-4 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              求人一覧
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {jobs.map((job) => {
              const c = CATEGORY_CONFIG[job.category];
              const isSelected = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                    isSelected
                      ? "bg-[#1e3a5f] text-white shadow-sm"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5 flex-shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {job.title}
                      </div>
                      <div className={`text-xs mt-0.5 truncate ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                        {job.company_name || job.location_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-blue-100"
                              : c.color
                          }`}
                        >
                          {c.label}
                        </span>
                        {job.housing_status && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              isSelected ? "bg-white/20 text-blue-100" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            🏠 社宅
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">

            {/* ── 選択中の求人バナー ───────────────────────── */}
            {selectedJob && cfg && (
              <div className="bg-[#1e3a5f] text-white rounded-xl p-4 flex flex-wrap items-center gap-4">
                <div className="text-3xl">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold">{selectedJob.title}</div>
                  <div className="text-sm text-blue-200 mt-0.5">
                    {selectedJob.company_name} · {selectedJob.location_name}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-blue-300">月給</div>
                    <div className="font-semibold">
                      {selectedJob.salary_min
                        ? `¥${(selectedJob.salary_min / 10000).toFixed(0)}〜${((selectedJob.salary_max ?? selectedJob.salary_min) / 10000).toFixed(0)}万`
                        : "要相談"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-blue-300">マッチ数</div>
                    <div className="font-semibold">{matchResults.length}名</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-blue-300">近隣物件</div>
                    <div className="font-semibold">{nearbyProperties.length}件</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── チャット監視パネル ───────────────────────── */}
            <ChatMonitorPanel />

            {/* ── 2カラムグリッド (lg以上) ─────────────────── */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* 左: 求人票解析パネル */}
              <div id="parser">
                <JobParserPanel onJobConfirmed={handleJobConfirmed} />
              </div>

              {/* 右: マッチング/マップ切替 */}
              <div id="matching" className="flex flex-col gap-3">
                {/* タブ切替 */}
                <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                  <TabBtn
                    active={activeSection === "matching"}
                    onClick={() => setActiveSection("matching")}
                    icon="👥"
                    label={`マッチング (${matchResults.length}名)`}
                  />
                  <TabBtn
                    active={activeSection === "map"}
                    onClick={() => setActiveSection("map")}
                    icon="🗺️"
                    label={`マップ (${nearbyProperties.length}件)`}
                  />
                </div>

                {/* マッチングリスト */}
                {activeSection === "matching" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">👥</span>
                      <h2 className="font-semibold text-slate-800">マッチング結果</h2>
                      <span className="ml-auto text-xs text-slate-400">スコア降順</span>
                    </div>
                    <MatchingList
                      results={matchResults}
                      talents={MOCK_TALENTS}
                      properties={MOCK_PROPERTIES}
                    />
                  </div>
                )}

                {/* マップ */}
                {activeSection === "map" && selectedJob && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                      <span className="text-lg">🗺️</span>
                      <h2 className="font-semibold text-slate-800">勤務地 + 推薦物件</h2>
                      <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                          勤務地
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                          推薦物件
                        </span>
                      </div>
                    </div>
                    <div className="h-[420px]">
                      <MapView
                        jobLat={selectedJob.location_lat}
                        jobLng={selectedJob.location_lng}
                        jobTitle={selectedJob.title}
                        jobLocation={selectedJob.location_name}
                        properties={nearbyProperties}
                        radiusKm={5}
                      />
                    </div>
                    {/* 物件一覧テーブル */}
                    <div className="border-t border-slate-100">
                      {nearbyProperties.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50"
                        >
                          <span className="text-lg">🏠</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-400">{p.address}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-blue-600">
                              ¥{p.rent.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400">
                              {p.floor_plan} · {p.distance_km}km
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── チャット監視パネル ────────────────────────────────────
function ChatMonitorPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(true);
  const [staffReply, setStaffReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  // 3秒ごとにポーリング
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/chat?session_id=talent-001");
        const data = await res.json();
        const msgs: ChatMessage[] = data.messages ?? [];
        setMessages(msgs);
        const newCount = msgs.length - lastCountRef.current;
        if (newCount > 0 && lastCountRef.current > 0) {
          setUnread((u) => u + newCount);
        }
        lastCountRef.current = msgs.length;
      } catch {
        // ignore polling errors
      }
    }
    poll();
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, []);

  // 新着メッセージでメッセージ内コンテナのみスクロール
  useEffect(() => {
    if (!open || !bottomRef.current) return;
    const container = bottomRef.current.closest('.overflow-y-auto');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  // 開いた時に未読クリア
  function handleOpen() {
    setOpen(true);
    setUnread(0);
  }

  // スタッフからメッセージ送信
  async function sendStaffMessage() {
    const text = staffReply.trim();
    if (!text) return;
    setStaffReply("");
    try {
      let translated: string | undefined;
      try {
        const tr = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        translated = (await tr.json()).translated ?? undefined;
      } catch { /* non-blocking */ }

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "talent-001",
          from: "staff",
          sender_name: "Yuki (KUMIKOJEM)",
          text,
          translated,
          lang: "JP",
        }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* パネルヘッダー */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <span className="text-xl">💬</span>
        <span className="font-semibold text-slate-800">チャット監視</span>
        <span className="text-xs text-slate-400 ml-1">talent-001 (Juan)</span>
        <span className="ml-auto flex items-center gap-2">
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread} 新着
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <>
          {/* メッセージ一覧 */}
          <div className="h-56 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                まだメッセージがありません — チャット画面でメッセージを送信してください
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.from === "talent" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`max-w-[75%] space-y-1 ${msg.from === "talent" ? "items-end" : "items-start"} flex flex-col`}
                  >
                    <div className={`text-[10px] font-medium px-1 ${
                      msg.from === "talent" ? "text-blue-400 text-right" : "text-slate-400"
                    }`}>
                      {msg.sender_name} · {new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm leading-snug shadow-sm ${
                      msg.from === "talent"
                        ? "bg-[#1e3a5f] text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    {msg.translated && (
                      <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 max-w-full">
                        🌐 {msg.translated}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* スタッフ返信フォーム */}
          <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={staffReply}
              onChange={(e) => setStaffReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendStaffMessage()}
              placeholder="Yukiとして返信… (Enter で送信)"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
            />
            <button
              onClick={sendStaffMessage}
              disabled={!staffReply.trim()}
              className="px-4 py-2 bg-[#1e3a5f] disabled:bg-slate-200 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              送信
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ヘルパーコンポーネント ────────────────────────────────

function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/80">
      <span>{icon}</span>
      <span className="font-bold text-white">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-[#1e3a5f] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
