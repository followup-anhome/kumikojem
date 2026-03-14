"use client";

import { useState, useTransition } from "react";
import { ApplicationStatus, VisaType } from "@prisma/client";

// ─── 型定義 ───────────────────────────────────────────────
export type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  created_at: Date;
  user: { name: string };
  job_posting: {
    title: string;
    company: { name: string };
  };
};

export type VisaCount = { visa_type: VisaType; _count: { id: number } };

// ─── ステータス設定 ───────────────────────────────────────
const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  APPLIED:    { label: "応募済み",     color: "text-slate-600",   bg: "bg-slate-100" },
  REVIEWING:  { label: "書類選考中",   color: "text-amber-700",   bg: "bg-amber-100" },
  INTERVIEW:  { label: "面談予定",     color: "text-blue-700",    bg: "bg-blue-100"  },
  OFFERED:    { label: "内定",         color: "text-emerald-700", bg: "bg-emerald-100" },
  REJECTED:   { label: "不採用",       color: "text-red-700",     bg: "bg-red-100"   },
  WITHDRAWN:  { label: "辞退",         color: "text-slate-500",   bg: "bg-slate-100" },
};

const VISA_LABELS: Record<VisaType, string> = {
  SPECIFIED_SKILLED_1: "特定技能1号",
  SPECIFIED_SKILLED_2: "特定技能2号",
  TECHNICAL_INTERN:    "技能実習",
  ENGINEER:            "技術・人文・国際",
  PERMANENT_RESIDENT:  "永住者",
  STUDENT:             "留学",
  SPOUSE:              "配偶者",
  OTHER:               "その他",
};

const VISA_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-violet-500",
  "bg-emerald-500", "bg-amber-500", "bg-slate-400",
];

// ─── 次ステータス遷移定義 ─────────────────────────────────
function getNextActions(
  status: ApplicationStatus
): { label: string; next: ApplicationStatus; style: string }[] {
  const actions: { label: string; next: ApplicationStatus; style: string }[] = [];

  if (status === "APPLIED") {
    actions.push({ label: "審査中へ", next: "REVIEWING", style: "bg-amber-500 hover:bg-amber-600 text-white" });
  }
  if (status === "REVIEWING") {
    actions.push({ label: "面談設定", next: "INTERVIEW", style: "bg-blue-600 hover:bg-blue-700 text-white" });
  }
  if (status === "INTERVIEW") {
    actions.push({ label: "内定承認", next: "OFFERED", style: "bg-emerald-600 hover:bg-emerald-700 text-white" });
  }
  if (!["REJECTED", "WITHDRAWN", "OFFERED"].includes(status)) {
    actions.push({ label: "却下", next: "REJECTED", style: "bg-red-500 hover:bg-red-600 text-white" });
  }

  return actions;
}

// ─── ビザ種別グラフ ───────────────────────────────────────
function VisaChart({ data }: { data: VisaCount[] }) {
  const max = Math.max(...data.map((d) => d._count.id), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.round((d._count.id / max) * 100);
        return (
          <div key={d.visa_type} className="flex items-center gap-3">
            <div className="w-28 text-xs text-slate-600 text-right flex-shrink-0 leading-tight">
              {VISA_LABELS[d.visa_type]}
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
              <div
                className={`h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${VISA_COLORS[i % VISA_COLORS.length]}`}
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                <span className="text-[10px] font-bold text-white">{d._count.id}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI カード ───────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800">{value.toLocaleString()}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── メインクライアントコンポーネント ─────────────────────
export default function AdminClient({
  userCount,
  companyCount,
  applicationCount,
  initialApplications,
  visaCounts,
}: {
  userCount: number;
  companyCount: number;
  applicationCount: number;
  initialApplications: ApplicationRow[];
  visaCounts: VisaCount[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(id: string, nextStatus: ApplicationStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      startTransition(() => {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
        );
      });
    } catch {
      alert("ステータスの更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">
              🏗️
            </div>
            <div>
              <div className="font-black text-base tracking-wide leading-none">KUMIKOJEM</div>
              <div className="text-[10px] text-blue-200 leading-none mt-0.5">管理者ダッシュボード</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/dashboard"
              className="text-xs text-blue-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              ← メインダッシュボード
            </a>
            <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Supabase 接続中
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── KPI カード ─────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            サマリー
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard icon="👤" label="登録求職者数" value={userCount} sub="Supabase · users テーブル" />
            <KpiCard icon="🏢" label="登録企業数" value={companyCount} sub="Supabase · companies テーブル" />
            <KpiCard icon="📋" label="総応募件数" value={applicationCount} sub="Supabase · applications テーブル" />
          </div>
        </section>

        {/* ── 2カラム ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── 応募一覧テーブル (2/3) ─────────────────── */}
          <section className="lg:col-span-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              最新の応募一覧
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        求職者名
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        企業名
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        応募日
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => {
                      const cfg = STATUS_CONFIG[app.status];
                      const actions = getNextActions(app.status);
                      const isUpdating = updatingId === app.id;

                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-slate-50 transition-colors ${isUpdating ? "opacity-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f]">
                                {app.user.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800">{app.user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{app.job_posting.company.name}</div>
                            <div className="text-xs text-slate-400">{app.job_posting.title}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(app.created_at).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                              {actions.map((action) => (
                                <button
                                  key={action.next}
                                  disabled={isUpdating || isPending}
                                  onClick={() => handleStatusChange(app.id, action.next)}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
                                >
                                  {isUpdating ? "…" : action.label}
                                </button>
                              ))}
                              {actions.length === 0 && (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {applications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                          応募データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── ビザ種別グラフ (1/3) ────────────────────── */}
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              ビザ種別 · 求職者数
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              {visaCounts.length > 0 ? (
                <VisaChart data={visaCounts} />
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">データなし</p>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                合計 {visaCounts.reduce((s, d) => s + d._count.id, 0)} 名
              </div>
            </div>

            {/* ステータス内訳 */}
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-3">
              応募ステータス内訳
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = applications.filter((a) => a.status === key).length;
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="font-bold text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
