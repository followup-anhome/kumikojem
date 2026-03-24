// 求人タイトル・説明の英語翻訳マップ
export const JOB_TITLE_EN: Record<string, string> = {
  "フォークリフトオペレーター": "Forklift Operator",
  "介護職員（デイサービス）": "Care Worker (Day Service)",
  "鉄筋工（現場作業員）": "Rebar Worker (Construction Site)",
  "工場ライン作業員": "Factory Line Worker",
  "トラックドライバー": "Truck Driver",
  "溶接工": "Welder",
  "塗装工": "Painter",
  "大工": "Carpenter",
  "配管工": "Plumber",
  "電気工事士": "Electrician",
  "介護士": "Care Staff",
  "看護助手": "Nursing Assistant",
  "ホテルスタッフ": "Hotel Staff",
  "清掃員": "Cleaning Staff",
  "コンビニスタッフ": "Convenience Store Staff",
};

export const JOB_DESC_EN: Record<string, string> = {
  "倉庫内でのフォークリフト作業。日勤のみ。社宅完備。週休2日制。":
    "Forklift operation inside warehouse. Day shift only. Company housing included. 2 days off per week.",
  "デイサービスでの入浴・食事介助。日本語N3以上歓迎。残業ほぼなし。":
    "Bathing and meal assistance at a day service facility. N3 Japanese or above welcome. Minimal overtime.",
  "マンション建設現場での鉄筋組立作業。未経験可・経験者優遇。":
    "Rebar assembly work at apartment construction site. No experience needed — experienced workers preferred.",
};

export function toEnTitle(title: string): string {
  return JOB_TITLE_EN[title] || title;
}

export function toEnDesc(desc: string): string {
  return JOB_DESC_EN[desc] || desc;
}

// JPY → PHP換算（1円 ≈ 0.37ペソ 2026年3月目安）
const JPY_TO_PHP = 0.37;

export function formatSalaryWithPeso(min?: number, max?: number): { jpy: string; php: string } {
  if (min && max) {
    const jpyText = `¥${(min / 10000).toFixed(0)}〜${(max / 10000).toFixed(0)}万/month`;
    const phpMin = Math.round((min * JPY_TO_PHP) / 1000) * 1000;
    const phpMax = Math.round((max * JPY_TO_PHP) / 1000) * 1000;
    const phpText = `₱${phpMin.toLocaleString()}〜${phpMax.toLocaleString()}/month`;
    return { jpy: jpyText, php: phpText };
  } else if (min) {
    const jpyText = `¥${(min / 10000).toFixed(0)}万+/month`;
    const phpMin = Math.round((min * JPY_TO_PHP) / 1000) * 1000;
    const phpText = `₱${phpMin.toLocaleString()}+/month`;
    return { jpy: jpyText, php: phpText };
  }
  return { jpy: "Salary negotiable", php: "" };
}
