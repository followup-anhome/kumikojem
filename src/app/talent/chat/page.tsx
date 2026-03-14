"use client";

/**
 * /talent/chat — 現場特化型チャット画面
 *
 * 設計思想:
 *  ① 手袋でも押せる 56px+ タッチターゲット、高コントラスト
 *  ② ワンタップ定型文 → 即送信（朝礼 / 現場 / 退勤 3カテゴリ）
 *  ③ エビデンスタイムライン: 全メッセージに日時・JA/EN両言語を表示
 *  ④ 学習ソート: タップ回数を localStorage に保存 → 使うほど自分専用に最適化
 *     FLIP アニメーションでボタンが滑らかにスライド
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────
type Lang     = "EN" | "JP";
type PhraseTab = "morning" | "field" | "endday";

interface Message {
  id: string;
  from: "staff" | "me";
  name: string;
  text: string;
  translated?: string;
  translating?: boolean;
  timestamp: string;
  lang: Lang;
  isQuickPhrase?: boolean;
  delivered: boolean;
}

// ─── 定型文マスター ───────────────────────────────────────────
interface Phrase {
  jp: string; en: string; icon: string;
  urgency: "safe" | "normal" | "warn" | "alert";
}

const QUICK_PHRASES: Record<PhraseTab, Phrase[]> = {
  morning: [
    { jp: "現場に到着しました",       en: "Arrived at site",              icon: "📍", urgency: "safe"   },
    { jp: "朝礼に参加しました",       en: "Morning briefing attended",     icon: "📋", urgency: "normal" },
    { jp: "安全確認が完了しました",   en: "Safety check complete",         icon: "✅", urgency: "safe"   },
    { jp: "作業開始します",           en: "Starting work",                 icon: "💪", urgency: "normal" },
  ],
  field: [
    { jp: "休憩に入ります",           en: "Taking a break",                icon: "☕", urgency: "normal" },
    { jp: "作業を再開します",         en: "Resuming work",                 icon: "▶",  urgency: "normal" },
    { jp: "作業が完了しました",       en: "Work completed",                icon: "✅", urgency: "safe"   },
    { jp: "資材が足りません",         en: "Materials insufficient",        icon: "📦", urgency: "warn"   },
    { jp: "機材に不具合があります",   en: "Equipment issue reported",      icon: "🔧", urgency: "warn"   },
    { jp: "安全上の問題があります",   en: "⚠ Safety concern — urgent",    icon: "🚨", urgency: "alert"  },
  ],
  endday: [
    { jp: "本日の作業を終了します",   en: "Ending work for today",         icon: "🏁", urgency: "normal" },
    { jp: "現場を離れます",           en: "Leaving the site now",          icon: "🚶", urgency: "normal" },
    { jp: "明日もよろしくお願いします", en: "See you tomorrow",            icon: "👋", urgency: "safe"   },
  ],
};

const TAB_META: Record<PhraseTab, { label: string; icon: string }> = {
  morning: { label: "朝礼", icon: "🌅" },
  field:   { label: "現場", icon: "🏗️" },
  endday:  { label: "退勤", icon: "🏁" },
};

const URGENCY_BTN: Record<Phrase["urgency"], string> = {
  safe:   "bg-emerald-600 active:bg-emerald-500",
  normal: "bg-[#1e4d82]  active:bg-[#1a3f6e]",
  warn:   "bg-orange-600 active:bg-orange-500",
  alert:  "bg-red-600    active:bg-red-500",
};

// ─── 学習ソート: localStorage ─────────────────────────────────
const STORAGE_KEY = "kumikojem_phrase_taps_v1";

/** localStorage からタップ回数マップを読み込む */
function loadTapCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

/** localStorage へ保存 */
function saveTapCounts(counts: Record<string, number>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counts)); }
  catch { /* quota exceeded など — 無視 */ }
}

/** タップ回数マップのキー: "{tab}|{jp}" */
function pKey(tab: PhraseTab, jp: string) { return `${tab}|${jp}`; }

/** タブの全フレーズをタップ数降順でソートして返す */
function sortedPhrases(tab: PhraseTab, counts: Record<string, number>): Phrase[] {
  return [...QUICK_PHRASES[tab]].sort(
    (a, b) => (counts[pKey(tab, b.jp)] ?? 0) - (counts[pKey(tab, a.jp)] ?? 0)
  );
}

// ─── スタッフ連絡先 / 自動返信 ───────────────────────────────
const CONTACTS = [
  { id: "tanaka", name: "田中 現場監督", nameEn: "Tanaka (Site Mgr)", avatar: "👷‍♂️", online: true },
  { id: "yuki",   name: "Yuki (KUMIKOJEM)", nameEn: "Yuki (Coord.)",  avatar: "👩‍💼", online: true },
];
const AUTO_REPLIES: { jp: string; en: string }[] = [
  { jp: "了解しました。ありがとうございます。",           en: "Understood. Thank you." },
  { jp: "確認しました。引き続きよろしくお願いします。",   en: "Confirmed. Please continue." },
  { jp: "報告ありがとうございます。状況を確認します。",   en: "Thanks for the report. Checking now." },
  { jp: "安全に作業を進めてください。",                 en: "Please proceed safely." },
];
let replyIdx = 0;

// ─── Helpers ─────────────────────────────────────────────────
const nowISO = () => new Date().toISOString();
function fmtEvidence(iso: string) {
  const d = new Date(iso), p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const INIT_MSGS: Message[] = [
  {
    id: "m0", from: "staff", name: "田中 現場監督",
    text: "おはようございます。今日もよろしくお願いします。安全第一で。",
    translated: "Good morning. Thank you for today. Safety first, always.",
    timestamp: new Date(Date.now() - 900_000).toISOString(), lang: "JP", delivered: true,
  },
  {
    id: "m1", from: "me", name: "Juan (You)",
    text: "現場に到着しました", translated: "Arrived at site",
    timestamp: new Date(Date.now() - 780_000).toISOString(), lang: "JP", delivered: true, isQuickPhrase: true,
  },
  {
    id: "m2", from: "staff", name: "田中 現場監督",
    text: "確認しました。A区画から作業開始してください。",
    translated: "Confirmed. Please start work from Zone A.",
    timestamp: new Date(Date.now() - 720_000).toISOString(), lang: "JP", delivered: true,
  },
];

// ─── 表示する最大ボタン数（認知負荷低減） ─────────────────────
const DEFAULT_VISIBLE = 4;

// ─────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────
export default function FieldChatPage() {
  const [messages,       setMessages]       = useState<Message[]>(INIT_MSGS);
  const [activeContact,  setActiveContact]  = useState("tanaka");
  const [phraseTab,      setPhraseTab]      = useState<PhraseTab>("field");
  const [input,          setInput]          = useState("");
  const [myLang,         setMyLang]         = useState<Lang>("JP");
  const [evidenceMode,   setEvidenceMode]   = useState(false);
  const [sendingPhrase,  setSendingPhrase]  = useState<string | null>(null);
  const [showAll,        setShowAll]        = useState(false);

  // ── 学習ソート state ──────────────────────────────────────
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({});

  // localStorage から初期化（マウント後1回）
  useEffect(() => { setTapCounts(loadTapCounts()); }, []);

  // タブ切替時に「もっと見る」を閉じる
  useEffect(() => { setShowAll(false); }, [phraseTab]);

  // ── FLIP アニメーション用 refs ────────────────────────────
  /** 各ボタンの DOM 参照: key = pKey(tab, jp) */
  const buttonRefs    = useRef<Map<string, HTMLButtonElement>>(new Map());
  /** ソート前の各ボタンの位置を保存 */
  const prevRects     = useRef<Map<string, DOMRect>>(new Map());
  /** 次の layoutEffect で FLIP を実行すべきか */
  const needsFlip     = useRef(false);
  /** FLIP 対象のタブ */
  const flipTab       = useRef<PhraseTab>("field");

  /**
   * タップ前の全ボタン位置をキャプチャ（同期）
   * → setTapCounts の直前に呼ぶこと
   */
  const capturePositions = useCallback((tab: PhraseTab) => {
    prevRects.current.clear();
    QUICK_PHRASES[tab].forEach((p) => {
      const el = buttonRefs.current.get(pKey(tab, p.jp));
      if (el) prevRects.current.set(pKey(tab, p.jp), el.getBoundingClientRect());
    });
    needsFlip.current = true;
    flipTab.current   = tab;
  }, []);

  /**
   * tapCounts 変化後の DOM コミット直後に FLIP を実行
   * useLayoutEffect = paint 前に同期実行 → ちらつきなし
   */
  useLayoutEffect(() => {
    if (!needsFlip.current) return;
    needsFlip.current = false;
    const tab = flipTab.current;

    QUICK_PHRASES[tab].forEach((p) => {
      const key    = pKey(tab, p.jp);
      const el     = buttonRefs.current.get(key);
      const oldPos = prevRects.current.get(key);
      if (!el || !oldPos) return;

      const newPos = el.getBoundingClientRect();
      const dx     = oldPos.left - newPos.left;
      const dy     = oldPos.top  - newPos.top;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        // まず「元の位置」に見せかけ → トランジションで新位置へ
        el.style.transform  = `translate(${dx}px, ${dy}px)`;
        el.style.transition = "none";
        el.style.zIndex     = "20";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transform  = "translate(0, 0)";
            el.style.transition = "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";
            setTimeout(() => {
              el.style.transform  = "";
              el.style.transition = "";
              el.style.zIndex     = "";
            }, 500);
          });
        });
      }
    });
  }, [tapCounts]);

  // ─ refs ───────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─ API 永続化 ─────────────────────────────────────────────
  async function persist(msg: Message) {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "talent-001", from: msg.from === "me" ? "talent" : "staff",
          sender_name: msg.name, text: msg.text, translated: msg.translated, lang: msg.lang,
        }),
      });
    } catch { /* non-blocking */ }
  }

  async function translateText(text: string): Promise<string> {
    try {
      const res  = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      return (await res.json()).translated ?? "";
    } catch { return ""; }
  }

  function scheduleAutoReply(contactId: string, delay = 1500) {
    setTimeout(() => {
      const r = AUTO_REPLIES[replyIdx % AUTO_REPLIES.length]; replyIdx++;
      const reply: Message = {
        id: `ar-${Date.now()}`, from: "staff",
        name: CONTACTS.find((c) => c.id === contactId)?.name ?? "田中",
        text: r.jp, translated: r.en, timestamp: nowISO(), lang: "JP", delivered: true,
      };
      setMessages((prev) => [...prev, reply]);
      persist(reply);
    }, delay);
  }

  // ─ ワンタップ定型文送信 ──────────────────────────────────
  async function sendQuickPhrase(p: Phrase) {
    if (sendingPhrase) return;

    // ① 現在のボタン位置をキャプチャ（FLIP の "F" ステップ）
    capturePositions(phraseTab);

    // ② タップ数を +1 → localStorage 保存 → FLIP トリガー
    const key      = pKey(phraseTab, p.jp);
    const newCounts = { ...tapCounts, [key]: (tapCounts[key] ?? 0) + 1 };
    setTapCounts(newCounts);   // → useLayoutEffect が FLIP を実行
    saveTapCounts(newCounts);

    // ③ 送信処理
    setSendingPhrase(p.jp);
    const msg: Message = {
      id: `qp-${Date.now()}`, from: "me", name: "Juan (You)",
      text: p.jp, translated: p.en, timestamp: nowISO(),
      lang: "JP", delivered: false, isQuickPhrase: true,
    };
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, delivered: true } : m));
      setSendingPhrase(null);
    }, 600);
    persist(msg);
    scheduleAutoReply(activeContact);
  }

  // ─ テキスト送信 ──────────────────────────────────────────
  async function sendMessage() {
    const trimmed = input.trim(); if (!trimmed) return;
    setInput("");
    const msg: Message = {
      id: `msg-${Date.now()}`, from: "me", name: "Juan (You)",
      text: trimmed, timestamp: nowISO(), lang: myLang, delivered: false,
    };
    setMessages((prev) => [...prev, msg]);
    if (myLang === "JP") {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, translating: true } : m));
      const translated = await translateText(trimmed);
      setMessages((prev) => prev.map((m) =>
        m.id === msg.id ? { ...m, translated, translating: false, delivered: true } : m
      ));
      persist({ ...msg, translated });
    } else {
      setTimeout(() => setMessages((prev) =>
        prev.map((m) => m.id === msg.id ? { ...m, delivered: true } : m)
      ), 500);
      persist(msg);
    }
    scheduleAutoReply(activeContact, 1800);
  }

  // ─ 表示フレーズ計算 ───────────────────────────────────────
  const orderedPhrases = sortedPhrases(phraseTab, tapCounts);
  const totalPhrases   = orderedPhrases.length;
  const visiblePhrases = showAll ? orderedPhrases : orderedPhrases.slice(0, DEFAULT_VISIBLE);
  const hiddenCount    = totalPhrases - DEFAULT_VISIBLE;

  // 1位のタップ数（ランク表示に使用）
  const topCount = Math.max(...orderedPhrases.map((p) => tapCounts[pKey(phraseTab, p.jp)] ?? 0), 0);

  const contact = CONTACTS.find((c) => c.id === activeContact)!;

  return (
    <div className="flex flex-col h-screen bg-[#0d1b2a] overflow-hidden select-none">

      {/* ══════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════ */}
      <header className="bg-[#1e3a5f] flex-shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Link
            href="/talent"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/25 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="text-2xl">{contact.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-lg leading-tight truncate">{contact.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">LIVE 通話可</span>
            </div>
          </div>
          <button
            onClick={() => setEvidenceMode((v) => !v)}
            className={`
              flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold
              border transition-all active:scale-95
              ${evidenceMode
                ? "bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/30"
                : "bg-white/10 text-white/80 border-white/20"}
            `}
          >
            📋 <span className="hidden sm:inline">エビデンス</span>
          </button>
          <button
            onClick={() => setMyLang((l) => (l === "EN" ? "JP" : "EN"))}
            className="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-white/10 active:bg-white/25 border border-white/20 transition-all"
          >
            <span className="text-base leading-none">{myLang === "EN" ? "🇵🇭" : "🇯🇵"}</span>
            <span className="text-[10px] text-white/60 font-bold mt-0.5">{myLang}</span>
          </button>
        </div>
        <div className="flex gap-1.5 px-3 pb-2 pt-1">
          {CONTACTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveContact(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeContact === c.id ? "bg-white text-[#1e3a5f] shadow-sm" : "text-white/50 hover:text-white/80 bg-white/5"
              }`}
            >
              {c.avatar} {c.nameEn}
              {c.online && activeContact !== c.id && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          ワンタップ定型文パネル（学習ソート付き）
          ※ max-h-[52vh] + overflow-y-auto で内部スクロール
      ══════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 overflow-y-auto bg-[#0f1e2e] border-b border-white/10"
        style={{ maxHeight: "52vh" }}
      >
        {/* カテゴリタブ */}
        <div className="flex border-b border-white/10">
          {(Object.keys(TAB_META) as PhraseTab[]).map((tab) => {
            const m = TAB_META[tab]; const active = phraseTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setPhraseTab(tab)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold
                  transition-all border-b-2
                  ${active ? "bg-[#1e3a5f]/60 text-white border-amber-400" : "text-white/40 border-transparent hover:text-white/60"}
                `}
              >
                <span className="text-lg">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── 学習ソート ヘッダー ─────────────────────── */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-amber-400 font-bold">🧠 よく使う順</span>
            <span className="text-[10px] text-white/30">
              {topCount > 0 ? `— ${topCount}回タップを1位に表示` : "— まだ学習データなし"}
            </span>
          </div>
          <span className="text-[10px] text-white/25">
            {DEFAULT_VISIBLE}/{totalPhrases} 表示
          </span>
        </div>

        {/* ─── 定型文ボタン グリッド ─────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 px-3 pb-2">
          {visiblePhrases.map((p, rank) => {
            const key       = pKey(phraseTab, p.jp);
            const tapCount  = tapCounts[key] ?? 0;
            const isSending = sendingPhrase === p.jp;
            const isTop     = rank === 0 && tapCount > 0;
            const isAlert   = p.urgency === "alert";

            return (
              <button
                key={p.jp}
                ref={(el) => {
                  if (el) buttonRefs.current.set(pKey(phraseTab, p.jp), el);
                  else    buttonRefs.current.delete(pKey(phraseTab, p.jp));
                }}
                onClick={() => sendQuickPhrase(p)}
                disabled={!!sendingPhrase}
                className={`
                  relative flex flex-col items-start gap-1 px-4 py-4 rounded-2xl text-left
                  shadow-lg disabled:opacity-40
                  ${isAlert ? "col-span-2" : ""}
                  ${isSending
                    ? "bg-white text-[#0d1b2a] scale-95 shadow-none"
                    : `${URGENCY_BTN[p.urgency]} text-white active:scale-95`}
                `}
              >
                {/* 1位バッジ */}
                {isTop && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-black text-[10px] font-black
                                   px-1.5 py-0.5 rounded-full shadow-md shadow-amber-400/40 leading-none">
                    👑 1位
                  </span>
                )}

                {/* アイコン行 + ステータス */}
                <div className="flex items-center w-full gap-2">
                  <span className="text-2xl leading-none">{p.icon}</span>
                  {isSending ? (
                    <span className="ml-auto text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      送信中…
                    </span>
                  ) : (
                    <span className="ml-auto flex items-center gap-1.5">
                      {/* タップ回数バッジ */}
                      {tapCount > 0 && (
                        <span className={`
                          text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none
                          ${isSending ? "bg-emerald-100 text-emerald-700" : "bg-white/20 text-white/80"}
                        `}>
                          {tapCount}回
                        </span>
                      )}
                      <span className="text-[10px] text-white/40">⚡ 即送信</span>
                    </span>
                  )}
                </div>

                {/* 日本語 */}
                <div className="text-base font-bold leading-tight">{p.jp}</div>
                {/* 英語 */}
                <div className="text-xs text-white/65 leading-tight">{p.en}</div>
              </button>
            );
          })}
        </div>

        {/* ─── 「もっと見る / 折りたたむ」ボタン ─────── */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs text-white/45 hover:text-white/70 transition-colors"
          >
            <span>{showAll ? "▲ 折りたたむ" : `▼ 他 ${hiddenCount} 件を表示`}</span>
            <span className="text-white/25">({totalPhrases} 件中 {showAll ? totalPhrases : DEFAULT_VISIBLE} 表示)</span>
          </button>
        )}

        {/* エビデンスモード バナー */}
        {evidenceMode && (
          <div className="mx-3 mb-3 px-3 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-start gap-2">
            <span className="text-amber-400 text-lg mt-0.5">📋</span>
            <div className="text-xs text-amber-300 leading-relaxed">
              <span className="font-bold">エビデンスモード ON</span><br />
              全メッセージに <span className="font-mono">YYYY-MM-DD HH:mm:ss</span> と日英両テキストを表示。
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          タイムライン（メッセージ一覧）
      ══════════════════════════════════════════════════ */}
      <div
        className="flex-1 overflow-y-auto min-h-[120px]"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1e3a5f transparent" }}
      >
        <div className="px-3 py-4 space-y-4">
          {/* 日付区切り */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/35 font-medium px-2">
              {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {messages.map((msg) => {
            const isMe = msg.from === "me";
            return (
              <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {evidenceMode && (
                  <div className={`flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-[11px] text-amber-400/90 font-mono bg-amber-400/10 px-2 py-0.5 rounded">
                      {fmtEvidence(msg.timestamp)}
                    </span>
                    <span className="text-[11px] text-white/40">{msg.name}</span>
                    {msg.isQuickPhrase && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">定型文</span>
                    )}
                  </div>
                )}

                <div className={`max-w-[82%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`
                    relative px-4 py-3.5 rounded-2xl shadow-md
                    ${isMe
                      ? msg.isQuickPhrase
                        ? "bg-emerald-700 text-white rounded-br-sm border border-emerald-500/30"
                        : "bg-[#1e4d82] text-white rounded-br-sm"
                      : "bg-[#1e3a5f]/90 text-white border border-white/10 rounded-bl-sm"}
                  `}>
                    {msg.isQuickPhrase && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded-full">
                          ⚡ ワンタップ定型文
                        </span>
                      </div>
                    )}
                    <div className="text-[17px] font-semibold leading-snug">{msg.text}</div>
                    {msg.translating ? (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/15">
                        <svg className="animate-spin w-3 h-3 text-white/50" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span className="text-xs text-white/40">翻訳中…</span>
                      </div>
                    ) : msg.translated ? (
                      <div className="mt-2 pt-2 border-t border-white/15 flex items-start gap-1.5">
                        <span className="text-xs text-blue-300 flex-shrink-0 mt-px">🌐</span>
                        <span className="text-sm text-white/70 leading-snug">{msg.translated}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className={`flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-[11px] text-white/30 font-mono">
                      {evidenceMode ? fmtEvidence(msg.timestamp) : fmtTime(msg.timestamp)}
                    </span>
                    {isMe && (
                      <span className={`text-[11px] font-medium ${msg.delivered ? "text-emerald-400" : "text-white/30"}`}>
                        {msg.delivered ? "✓✓ 配信済" : "✓ 送信中"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          入力バー
      ══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-[#0f1e2e] border-t border-white/10 px-3 py-3">
        <div className="flex gap-2 items-end">
          <button
            onClick={() => setMyLang((l) => (l === "EN" ? "JP" : "EN"))}
            className="flex-shrink-0 min-w-[48px] min-h-[48px] bg-[#1e3a5f] rounded-xl flex flex-col items-center justify-center border border-white/20 active:scale-95 transition-all"
          >
            <span className="text-xl leading-none">{myLang === "EN" ? "🇵🇭" : "🇯🇵"}</span>
            <span className="text-[9px] text-white/50 font-bold mt-0.5">{myLang}</span>
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={myLang === "JP" ? "日本語でも入力できます…" : "Type a message in English…"}
            className="flex-1 bg-[#1e3a5f] border border-white/20 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-blue-400 resize-none leading-tight"
            style={{ maxHeight: "120px", minHeight: "48px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="flex-shrink-0 min-w-[48px] min-h-[48px] bg-[#1e4d82] disabled:bg-[#1e3a5f]/40 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-white/20 disabled:border-white/10 shadow-lg shadow-blue-900/30"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-white/25">
          <span>⚡ 上の定型文ボタン → 即送信</span>
          <span>·</span>
          <span>使うたびに自動で上位へ 🧠</span>
        </div>
      </div>
    </div>
  );
}
