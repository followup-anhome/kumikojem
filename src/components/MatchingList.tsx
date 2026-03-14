"use client";

/**
 * MatchingList.tsx
 * マッチング結果をスコア順にカード表示するコンポーネント。
 * スコア内訳: 基礎(適性+経験)45pt / 給与15pt / 資格20pt / 体格10pt / FB解析10pt
 */

import type { MatchResult } from "@/lib/matcher";
import type { MockTalent, MockProperty } from "@/lib/mock-data";

interface Props {
  results: MatchResult[];
  talents: MockTalent[];
  properties: MockProperty[];
}

const SCORE_GRADE = (score: number) => {
  if (score >= 80) return { label: "S", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 65) return { label: "A", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  if (score >= 50) return { label: "B", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { label: "C", color: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
};

const BREAKDOWN_LABELS = [
  { key: "base",        label: "基礎",   max: 45, hint: "適性+経験年数" },
  { key: "salary",      label: "給与",   max: 15, hint: "希望給与との一致度" },
  { key: "certificate", label: "資格",   max: 20, hint: "職種必要資格との一致" },
  { key: "physique",    label: "体格",   max: 10, hint: "身長・体重の適性" },
  { key: "fb_analysis", label: "FB解析", max: 10, hint: "FBプロフ体力・性格評価" },
] as const;

const GENDER_EMOJI: Record<string, string> = {
  MALE: "👨",
  FEMALE: "👩",
};

export default function MatchingList({ results, talents, properties }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-sm">左の求人を選択するとマッチング結果が表示されます</p>
      </div>
    );
  }

  const talentMap = Object.fromEntries(talents.map((t) => [t.id, t]));
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      {results.map((r, i) => {
        const talent = talentMap[r.talent_id];
        if (!talent) return null;

        const grade = SCORE_GRADE(r.score);
        const recommendedProps = r.recommended_property_ids
          .slice(0, 2)
          .map((id) => propertyMap[id])
          .filter(Boolean);

        return (
          <div
            key={r.talent_id}
            className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${grade.bg}`}
          >
            {/* カードヘッダー */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* ランク番号 */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200
                              flex items-center justify-center text-xs font-bold text-slate-500">
                {i + 1}
              </div>

              {/* アバター */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${grade.color}
                              flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                {GENDER_EMOJI[talent.gender] ?? "👤"}
              </div>

              {/* 名前 + 属性 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 truncate">{talent.name}</span>
                  <span className="text-sm">🇵🇭</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                  {talent.height_cm && <span>📏 {talent.height_cm}cm</span>}
                  {talent.weight_kg && <span>⚖️ {talent.weight_kg}kg</span>}
                  {talent.years_experience !== undefined && talent.years_experience > 0 && (
                    <span className="font-medium text-blue-600">
                      💼 {talent.years_experience}年
                    </span>
                  )}
                </div>
              </div>

              {/* スコアバッジ */}
              <div className="flex-shrink-0 text-right">
                <div className={`text-2xl font-black ${grade.text}`}>{r.score}</div>
                <div className={`text-xs font-bold ${grade.text} opacity-70`}>
                  {SCORE_GRADE(r.score).label}ランク
                </div>
              </div>
            </div>

            {/* スコア内訳バー */}
            <div className="px-4 pb-2 space-y-1.5">
              {BREAKDOWN_LABELS.map(({ key, label, max, hint }) => {
                const val = r.breakdown[key];
                const pct = (val / max) * 100;
                if (key === "fb_analysis" && val === 0) return null; // FB未解析は非表示
                return (
                  <div key={key} className="flex items-center gap-2 text-xs" title={hint}>
                    <span className="w-10 text-slate-500 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${grade.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-12 text-right font-medium ${grade.text}`}>
                      {val}/{max}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 資格チップ */}
            {talent.certificates.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1">
                {talent.certificates.map((c) => (
                  <span
                    key={c}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600"
                  >
                    📜 {c}
                  </span>
                ))}
              </div>
            )}

            {/* 推薦物件 */}
            {recommendedProps.length > 0 && (
              <div className="px-4 pb-3 space-y-1.5">
                <div className="text-xs font-semibold text-slate-500 mb-1">🏠 推薦物件</div>
                {recommendedProps.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 border border-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.floor_plan} · ¥{p.rent.toLocaleString()}/月</div>
                    </div>
                    {p.management_company === "AN_HOME" && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full flex-shrink-0">AN</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* コメント */}
            {r.notes.length > 0 && (
              <div className="px-4 pb-3">
                <div className="text-xs text-slate-500 space-y-0.5">
                  {r.notes.slice(0, 3).map((n, idx) => (
                    <div key={idx}>• {n}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
