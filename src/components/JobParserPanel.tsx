"use client";

/**
 * JobParserPanel.tsx
 * 求人票テキスト入力 → /api/parse-job → 結果表示 + 求人確定ボタン
 */

import { useState, useRef } from "react";
import type { MockJob } from "@/lib/mock-data";

type ParseResult = {
  category: "LOGISTICS" | "CONSTRUCTION" | "CARE" | "FACTORY";
  salary: number | null;
  location: string;
  has_dormitory: boolean;
  filipino_description: string;
  meta: {
    title: string;
    salary_min: number | null;
    salary_max: number | null;
    company_name: string | null;
    description: string | null;
    parsed_by: "openai" | "offline";
  };
};

type NearbyProperty = {
  id: string;
  name: string;
  address: string;
  rent: number;
  floor_plan: string;
  distance_km: number;
  management_company: string;
  recommend_reason: { ja: string; en: string };
};

const CATEGORY_LABEL: Record<string, string> = {
  LOGISTICS: "🚛 運送・物流",
  CONSTRUCTION: "🏗️ 建設・土木",
  CARE: "🤝 福祉・介護",
  FACTORY: "🏭 製造・工場",
};

const SAMPLE_TEXTS: Record<string, string> = {
  logistics: `株式会社西淀川運輸
【職種】大型トラックドライバー（長距離・チャーター便）
【勤務地】大阪市西淀川区大和田3丁目
【給与】月給220,000円〜280,000円（残業代別途・歩合あり）
【資格】大型免許必須・牽引免許歓迎
【待遇】社宅完備・交通費全額支給・週休2日・社会保険完備
【業務内容】関西〜関東間の長距離チャーター配送。2024年問題対応で乗務時間厳守。荷役補助あり。`,

  construction: `大阪鉄筋工業株式会社
【職種】鉄筋工（マンション新築現場）
【勤務地】大阪市淀川区西中島（阪急南方駅より徒歩5分）
【給与】月給200,000円〜260,000円（経験者優遇・危険手当別途）
【資格】玉掛け技能講習歓迎・未経験者は入社後取得サポート
【待遇】現場安全装備一式支給・雨天中止の場合は保証給あり
【業務内容】15階建マンション新築現場での鉄筋組立・配筋作業。班長候補を積極採用中。`,
};

const SAMPLE_TEXT = SAMPLE_TEXTS.logistics;

interface Props {
  onJobConfirmed: (job: Partial<MockJob>) => void;
}

export default function JobParserPanel({ onJobConfirmed }: Props) {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilipino, setShowFilipino] = useState(false);
  const [nearbyProps, setNearbyProps] = useState<NearbyProperty[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setNearbyProps([]);
    setShowFilipino(false);

    try {
      const res = await fetch("/api/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ParseResult = await res.json();
      setResult(data);

      // 解析完了後に近隣物件を自動取得
      fetchNearbyProperties(data.location);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNearbyProperties(locationName: string) {
    setPropsLoading(true);
    try {
      const res = await fetch("/api/property-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_name: locationName, radius_km: 5 }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNearbyProps(data.properties ?? []);
    } catch {
      // 物件取得失敗は無視（コア機能ではない）
    } finally {
      setPropsLoading(false);
    }
  }

  function handleConfirm() {
    if (!result) return;
    const newJob: Partial<MockJob> = {
      id: `job-${Date.now()}`,
      title: result.meta.title,
      category: result.category,
      description: result.meta.description ?? "",
      salary_min: result.meta.salary_min,
      salary_max: result.meta.salary_max,
      location_name: result.location,
      housing_status: result.has_dormitory,
      company_name: result.meta.company_name ?? "",
      // 座標は後でジオコーディング（暫定で大阪市中心）
      location_lat: 34.6937,
      location_lng: 135.4576,
    };
    onJobConfirmed(newJob);
    setResult(null);
    setText("");
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <span className="text-lg">📋</span>
        <h2 className="font-semibold text-slate-800">求人票解析</h2>
        <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
          AI解析
        </span>
      </div>

      <div className="p-5">
        {/* タブ切替 */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-4 w-fit">
          {(["text", "image"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === t
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "text" ? "テキスト入力" : "画像アップロード"}
            </button>
          ))}
        </div>

        {tab === "text" ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="求人票のテキストをここに貼り付けてください..."
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent resize-none"
            />
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-slate-400">サンプル:</span>
              <button onClick={() => setText(SAMPLE_TEXTS.logistics)} className="text-xs text-blue-500 hover:text-blue-700 underline">🚛 運送</button>
              <button onClick={() => setText(SAMPLE_TEXTS.construction)} className="text-xs text-blue-500 hover:text-blue-700 underline">🏗️ 建設</button>
            </div>
          </>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center
                       cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm text-slate-600">
              求人票の画像をクリックして選択
            </p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF対応</p>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" />
          </div>
        )}

        {/* 解析ボタン */}
        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300
                     text-white font-semibold rounded-lg text-sm transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI解析中...
            </>
          ) : (
            "解析を実行"
          )}
        </button>

        {/* エラー */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 解析結果 */}
        {result && (
          <div className="mt-4 border border-emerald-200 rounded-xl bg-emerald-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-700">解析完了</span>
              <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                {result.meta.parsed_by === "openai" ? "🤖 GPT-4o" : "📊 オフライン"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                <div className="text-xs text-slate-500 mb-0.5">職種</div>
                <div className="font-medium text-slate-800">{result.meta.title}</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                <div className="text-xs text-slate-500 mb-0.5">カテゴリ</div>
                <div className="font-medium">{CATEGORY_LABEL[result.category]}</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                <div className="text-xs text-slate-500 mb-0.5">月給</div>
                <div className="font-semibold text-blue-600">
                  {result.salary ? `¥${result.salary.toLocaleString()}` : "不明"}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                <div className="text-xs text-slate-500 mb-0.5">社宅</div>
                <div className={`font-medium ${result.has_dormitory ? "text-emerald-600" : "text-slate-500"}`}>
                  {result.has_dormitory ? "✅ あり" : "❌ なし"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2.5 border border-emerald-100 text-sm">
              <div className="text-xs text-slate-500 mb-0.5">勤務地</div>
              <div className="text-slate-800">{result.location}</div>
            </div>

            {/* ── Filipino向けリライト ── */}
            <div className="border border-blue-200 rounded-xl bg-blue-50 overflow-hidden">
              <button
                onClick={() => setShowFilipino((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-blue-700"
              >
                <span>🇵🇭 Filipino向けリライト確認</span>
                <span className="text-blue-400 text-xs">{showFilipino ? "▲ 閉じる" : "▼ 開く"}</span>
              </button>
              {showFilipino && (
                <div className="px-3 pb-3">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-3 border border-blue-100 max-h-48 overflow-y-auto">
                    {result.filipino_description}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold
                         rounded-lg text-sm transition-colors"
            >
              この求人を確定・マッチング開始
            </button>
          </div>
        )}

        {/* ── 近隣物件レコメンド ── */}
        {(propsLoading || nearbyProps.length > 0) && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">🏠 近くのアンホーム物件</span>
              {propsLoading && (
                <svg className="animate-spin w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {!propsLoading && (
                <span className="text-xs text-slate-500 ml-auto">{nearbyProps.length}件 / 半径5km以内</span>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {nearbyProps.map((p) => (
                <div key={p.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate">{p.name}</span>
                      {p.management_company === "AN_HOME" && (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full flex-shrink-0">AN</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{p.recommend_reason.en}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-bold text-blue-600">¥{p.rent.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{p.distance_km}km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
