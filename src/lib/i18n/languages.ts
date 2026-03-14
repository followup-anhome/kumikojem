/**
 * i18n/languages.ts — KUMIKOJEM 言語マスター設定
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  新言語を追加するには（約1分の作業）:               ║
 * ║    1. LangCode に言語コードを追加                    ║
 * ║    2. SUPPORTED_LANGUAGES にメタデータを追加         ║
 * ║    3. PHRASES に翻訳辞書を追加                       ║
 * ║    4. translate/route.ts の langNames に追記          ║
 * ╚══════════════════════════════════════════════════════╝
 */

// ── 対応言語コード ─────────────────────────────────────────────
export type LangCode = "ja" | "en" | "vi" | "ne" | "tl";

// ── 言語メタデータ ─────────────────────────────────────────────
export interface LangMeta {
  code: LangCode;
  /** 管理画面表示名（日本語） */
  name: string;
  /** ネイティブ表記 */
  nativeName: string;
  /** 国旗絵文字 */
  flag: string;
  /** UI スイッチャーに表示するか（false = 将来対応） */
  enabled: boolean;
  /** タレント送出国の通貨コード */
  currency: string;
}

export const SUPPORTED_LANGUAGES: LangMeta[] = [
  { code: "ja", name: "日本語",     nativeName: "日本語",        flag: "🇯🇵", enabled: true,  currency: "JPY" },
  { code: "en", name: "英語",       nativeName: "English",       flag: "🇵🇭", enabled: true,  currency: "PHP" }, // フィリピン英語
  { code: "vi", name: "ベトナム語", nativeName: "Tiếng Việt",    flag: "🇻🇳", enabled: false, currency: "VND" }, // 🔜 将来対応
  { code: "ne", name: "ネパール語", nativeName: "नेपाली",          flag: "🇳🇵", enabled: false, currency: "NPR" }, // 🔜 将来対応
  { code: "tl", name: "タガログ語", nativeName: "Filipino",       flag: "🇵🇭", enabled: false, currency: "PHP" }, // 🔜 将来対応
];

// ── UI フレーズキー定義 ────────────────────────────────────────
// 新しいUIテキストを追加する場合は PhraseKey に追記するだけ
export type PhraseKey =
  // ── ナビゲーション
  | "nav.jobs"
  | "nav.chat"
  | "nav.profile"
  | "nav.register"
  // ── 求人
  | "job.salary"
  | "job.housing"
  | "job.housing.yes"
  | "job.housing.no"
  | "job.apply"
  | "job.book_interview"
  | "job.match_score"
  | "job.location"
  | "job.start_date"
  | "job.visa_support"
  // ── チャット
  | "chat.placeholder"
  | "chat.translate"
  | "chat.send"
  | "chat.online"
  // ── 物件
  | "property.nearby"
  | "property.rent"
  | "property.distance"
  | "property.available"
  // ── 汎用
  | "common.loading"
  | "common.error"
  | "common.confirm"
  | "common.cancel"
  | "common.close"
  | "common.see_more";

type PhraseDict = Record<PhraseKey, string>;

// ── 翻訳辞書 ──────────────────────────────────────────────────
export const PHRASES: Record<LangCode, PhraseDict> = {

  // ───────────── 日本語 ──────────────────────────────────────
  ja: {
    "nav.jobs":           "求人一覧",
    "nav.chat":           "チャット",
    "nav.profile":        "プロフィール",
    "nav.register":       "登録する",
    "job.salary":         "月給",
    "job.housing":        "社宅",
    "job.housing.yes":    "社宅あり",
    "job.housing.no":     "社宅なし",
    "job.apply":          "応募する",
    "job.book_interview": "面接を予約",
    "job.match_score":    "マッチ度",
    "job.location":       "勤務地",
    "job.start_date":     "開始時期",
    "job.visa_support":   "ビザサポート",
    "chat.placeholder":   "メッセージを入力...",
    "chat.translate":     "翻訳",
    "chat.send":          "送信",
    "chat.online":        "オンライン",
    "property.nearby":    "近くの物件",
    "property.rent":      "家賃",
    "property.distance":  "距離",
    "property.available": "入居可",
    "common.loading":     "読み込み中...",
    "common.error":       "エラーが発生しました",
    "common.confirm":     "確定",
    "common.cancel":      "キャンセル",
    "common.close":       "閉じる",
    "common.see_more":    "もっと見る",
  },

  // ───────────── English (Filipino) ─────────────────────────
  en: {
    "nav.jobs":           "Jobs",
    "nav.chat":           "Chat",
    "nav.profile":        "Profile",
    "nav.register":       "Register",
    "job.salary":         "Monthly Salary",
    "job.housing":        "Housing",
    "job.housing.yes":    "Housing Provided ✅",
    "job.housing.no":     "No Housing",
    "job.apply":          "Apply Now",
    "job.book_interview": "Book Interview",
    "job.match_score":    "Match Score",
    "job.location":       "Work Location",
    "job.start_date":     "Start Date",
    "job.visa_support":   "Visa Support",
    "chat.placeholder":   "Type a message...",
    "chat.translate":     "Translate",
    "chat.send":          "Send",
    "chat.online":        "Online",
    "property.nearby":    "Nearby Housing",
    "property.rent":      "Monthly Rent",
    "property.distance":  "Distance",
    "property.available": "Available Now",
    "common.loading":     "Loading...",
    "common.error":       "An error occurred",
    "common.confirm":     "Confirm",
    "common.cancel":      "Cancel",
    "common.close":       "Close",
    "common.see_more":    "See More",
  },

  // ───────────── Tiếng Việt（ベトナム語）────────────────────
  // ✅ フレーム完成 — 翻訳担当者にレビューしてもらうだけで本番投入可能
  vi: {
    "nav.jobs":           "Việc làm",
    "nav.chat":           "Trò chuyện",
    "nav.profile":        "Hồ sơ",
    "nav.register":       "Đăng ký",
    "job.salary":         "Lương tháng",
    "job.housing":        "Nhà ở",
    "job.housing.yes":    "Có nhà ở ✅",
    "job.housing.no":     "Không có nhà ở",
    "job.apply":          "Ứng tuyển ngay",
    "job.book_interview": "Đặt lịch phỏng vấn",
    "job.match_score":    "Điểm phù hợp",
    "job.location":       "Địa điểm làm việc",
    "job.start_date":     "Ngày bắt đầu",
    "job.visa_support":   "Hỗ trợ Visa",
    "chat.placeholder":   "Nhập tin nhắn...",
    "chat.translate":     "Dịch",
    "chat.send":          "Gửi",
    "chat.online":        "Trực tuyến",
    "property.nearby":    "Nhà ở gần đây",
    "property.rent":      "Tiền thuê nhà",
    "property.distance":  "Khoảng cách",
    "property.available": "Sẵn sàng vào ở",
    "common.loading":     "Đang tải...",
    "common.error":       "Đã xảy ra lỗi",
    "common.confirm":     "Xác nhận",
    "common.cancel":      "Hủy",
    "common.close":       "Đóng",
    "common.see_more":    "Xem thêm",
  },

  // ───────────── नेपाली（ネパール語）────────────────────────
  // ✅ フレーム完成 — 翻訳担当者にレビューしてもらうだけで本番投入可能
  ne: {
    "nav.jobs":           "जागिर",
    "nav.chat":           "च्याट",
    "nav.profile":        "प्रोफाइल",
    "nav.register":       "दर्ता गर्नुहोस्",
    "job.salary":         "मासिक तलब",
    "job.housing":        "आवास",
    "job.housing.yes":    "आवास उपलब्ध ✅",
    "job.housing.no":     "आवास छैन",
    "job.apply":          "अहिले आवेदन दिनुहोस्",
    "job.book_interview": "अन्तर्वार्ता बुक गर्नुहोस्",
    "job.match_score":    "मिलान स्कोर",
    "job.location":       "काम गर्ने ठाउँ",
    "job.start_date":     "सुरु मिति",
    "job.visa_support":   "भिसा सहयोग",
    "chat.placeholder":   "सन्देश टाइप गर्नुहोस्...",
    "chat.translate":     "अनुवाद",
    "chat.send":          "पठाउनुहोस्",
    "chat.online":        "अनलाइन",
    "property.nearby":    "नजिकका घरहरू",
    "property.rent":      "मासिक भाडा",
    "property.distance":  "दूरी",
    "property.available": "उपलब्ध",
    "common.loading":     "लोड हुँदैछ...",
    "common.error":       "त्रुटि भयो",
    "common.confirm":     "पुष्टि गर्नुहोस्",
    "common.cancel":      "रद्द गर्नुहोस्",
    "common.close":       "बन्द गर्नुहोस्",
    "common.see_more":    "थप हेर्नुहोस्",
  },

  // ───────────── Filipino / Tagalog（タガログ語）────────────
  tl: {
    "nav.jobs":           "Mga Trabaho",
    "nav.chat":           "Chat",
    "nav.profile":        "Profile",
    "nav.register":       "Mag-register",
    "job.salary":         "Buwanang Sahod",
    "job.housing":        "Tirahan",
    "job.housing.yes":    "May Tirahan ✅",
    "job.housing.no":     "Walang Tirahan",
    "job.apply":          "Mag-apply Na",
    "job.book_interview": "Mag-book ng Interview",
    "job.match_score":    "Match Score",
    "job.location":       "Lugar ng Trabaho",
    "job.start_date":     "Petsa ng Pagsisimula",
    "job.visa_support":   "Tulong sa Visa",
    "chat.placeholder":   "Mag-type ng mensahe...",
    "chat.translate":     "I-translate",
    "chat.send":          "Ipadala",
    "chat.online":        "Online",
    "property.nearby":    "Mga Tirahan sa Malapit",
    "property.rent":      "Buwanang Upa",
    "property.distance":  "Distansya",
    "property.available": "Available Na",
    "common.loading":     "Naglo-load...",
    "common.error":       "May naganap na error",
    "common.confirm":     "Kumpirmahin",
    "common.cancel":      "Kanselahin",
    "common.close":       "Isara",
    "common.see_more":    "Tingnan Pa",
  },
};

// ── ヘルパー関数 ───────────────────────────────────────────────

/**
 * 指定言語のフレーズを返す。未定義の場合は英語にフォールバック。
 *
 * 使用例:
 *   t("job.salary", "vi")  → "Lương tháng"
 *   t("job.salary", "ne")  → "मासिक तलब"
 */
export function t(key: PhraseKey, lang: LangCode = "en"): string {
  return PHRASES[lang]?.[key] ?? PHRASES.en[key] ?? key;
}

/** 有効化された言語のリストを返す（UI スイッチャー用） */
export function getEnabledLanguages(): LangMeta[] {
  return SUPPORTED_LANGUAGES.filter((l) => l.enabled);
}

/** 言語コードからメタデータを取得 */
export function getLangMeta(code: LangCode): LangMeta | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

/**
 * 翻訳APIに渡す言語名マップ（OpenAI プロンプト用）
 * translate/route.ts の langNames を置き換えられる
 */
export const LANG_NAMES_FOR_AI: Record<LangCode, string> = {
  ja: "Japanese",
  en: "English (warm, friendly, suitable for Filipino workers in Japan)",
  vi: "Vietnamese",
  ne: "Nepali",
  tl: "Filipino (Tagalog)",
};
