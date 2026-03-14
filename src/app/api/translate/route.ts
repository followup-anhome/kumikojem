export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server";

// ── JP → EN  職場用フレーズ辞書（温かみのある英語）────────────
const JP_TO_EN: Record<string, string> = {
  // 挨拶
  "こんにちは": "Hello! 👋",
  "おはようございます": "Good morning! ☀️",
  "こんばんは": "Good evening!",
  "お疲れ様でした": "Great work today! You did well! 👍",
  "お疲れ様です": "Thank you for your hard work! 💪",
  "よろしくお願いします": "Nice to work with you! Best regards 🙏",
  "よろしくお願いいたします": "I look forward to working with you! 🙏",
  "ありがとうございます": "Thank you so much! 😊",
  "ありがとうございました": "Thank you very much for everything! 😊",
  "ありがとう": "Thanks! 😊",
  "すみません": "Excuse me",
  "申し訳ありません": "I sincerely apologize",

  // 激励・応援
  "頑張ってください": "You can do it! Keep up the great work! 💪",
  "頑張りましょう": "Let's do our best! 💪",
  "頑張って": "Go for it! You've got this! 💪",
  "体調に気をつけて": "Please take good care of your health 🌿",
  "体調に気をつけてください": "Please take good care of yourself! Stay healthy 🌿",
  "無理しないでください": "Please don't push yourself too hard. Take it easy! 🙏",
  "無理しないで": "Don't overdo it! Rest when you need to 🙏",
  "ゆっくり休んでください": "Please get plenty of rest! 😴",
  "安全に気をつけて": "Please stay safe! ⛑️",
  "安全第一で": "Safety first! ⛑️",
  "気をつけて": "Please be careful! Take care 🙏",

  // 現場・職場
  "新しい現場": "the new worksite",
  "現場": "the worksite",
  "新しい現場ですね": "It's a new worksite!",
  "明日から": "Starting tomorrow,",
  "明日から新しい現場ですね": "You're starting at the new worksite tomorrow!",
  "明日から新しい現場ですね。体調に気をつけて頑張りましょう！": "You're starting at the new worksite tomorrow! Take good care of your health and let's give it our best! 💪🌿",
  "今日から": "Starting today,",
  "来週から": "Starting next week,",
  "仕事が始まります": "Your work is starting",
  "仕事を頑張ってください": "Please do your best at work! 💪",
  "職場の仲間と仲良くしてください": "Please get along well with your coworkers! 😊",
  "何かあれば連絡してください": "Please reach out anytime if you need anything! 📱",
  "困ったことがあれば相談してください": "If you have any problems, please don't hesitate to ask! 🙏",
  "わからないことがあれば聞いてください": "If there's anything you don't understand, please ask! 😊",
  "いつでも連絡してください": "Feel free to contact us anytime! 📱",
  "サポートします": "We are here to support you! 🤝",
  "サポートしますので安心してください": "Don't worry — we're here to support you! 🤝",

  // 求人・就職
  "仕事について教えてください": "Could you tell me more about the job?",
  "給料はいくらですか": "What is the salary?",
  "給与について教えてください": "Could you please share the salary details?",
  "寮はありますか": "Is company housing available?",
  "住居はありますか": "Is accommodation provided?",
  "いつから始められますか": "When would I be able to start?",
  "面接の日程を教えてください": "Could you let me know the interview schedule?",
  "面接はいつですか": "When is the interview?",
  "フォークリフトの免許があります": "I have a forklift license ✅",
  "大型免許があります": "I have a large vehicle license ✅",
  "介護の経験があります": "I have care work experience ✅",
  "日本語が少し話せます": "I can speak a little Japanese",
  "興味があります": "I'm very interested! 😊",
  "ぜひ応募したいです": "I would love to apply! 🙌",
  "採用担当者です": "I am the hiring manager",
  "面接の準備をしてください": "Please prepare for the interview",
  "来週会いましょう": "Let's meet next week! 📅",
  "書類を送ってください": "Please send the documents",
  "ビザのサポートがあります": "We provide visa support 🛂",
  "住居は職場から近いです": "The housing is close to the workplace 🏠",
  "月給は20万円です": "The monthly salary is ¥200,000 💴",
  "月給は18万円です": "The monthly salary is ¥180,000 💴",
  "月給は22万円です": "The monthly salary is ¥220,000 💴",
  "残業代は別途支給されます": "Overtime pay is provided separately 💴",
  "社会保険があります": "Social insurance is included ✅",
  "交通費が支給されます": "Transportation costs are covered 🚌",

  // 確認・連絡
  "了解しました": "Understood! Got it 👍",
  "わかりました": "I understand! 👍",
  "はい": "Yes",
  "いいえ": "No",
  "お願いします": "Please 🙏",
  "確認しました": "Confirmed! ✅",
  "確認いたします": "I will confirm this right away",
  "後ほど連絡します": "I will get back to you shortly 📱",
  "少々お待ちください": "Please wait just a moment ⏳",
  "もう少し待ってください": "Please hold on just a little longer ⏳",
  "すぐに確認します": "I'll check on that right away! ✅",
  "問題ありません": "No problem at all! 😊",
  "大丈夫ですか": "Are you doing okay? 😊",
  "大丈夫です": "I'm doing fine, thank you! 😊",

  // 一般
  "おめでとうございます": "Congratulations! 🎉",
  "よかったです": "That's great news! 😊",
  "楽しみにしています": "I'm really looking forward to it! 🙌",
  "一緒に頑張りましょう": "Let's work hard together! 💪🤝",
  "応援しています": "We are cheering you on! 📣",
  "信頼しています": "We trust you! 🤝",
  "期待しています": "We have high hopes for you! ⭐",
};

// ── EN → JP 逆引き ─────────────────────────────────────────
const EN_TO_JP: Record<string, string> = {
  "hello": "こんにちは！",
  "good morning": "おはようございます！",
  "good evening": "こんばんは！",
  "thank you": "ありがとうございます！",
  "thanks": "ありがとう！",
  "yes": "はい",
  "no": "いいえ",
  "please": "お願いします",
  "understood": "了解しました",
  "i understand": "わかりました",
  "excuse me": "すみません",
  "congratulations": "おめでとうございます！🎉",
  "i am interested": "興味があります！",
  "when can i start": "いつから始められますか？",
  "what is the salary": "給料はいくらですか？",
  "is housing available": "住居はありますか？",
  "i have a forklift license": "フォークリフトの免許があります ✅",
  "i can speak a little japanese": "少し日本語が話せます",
  "no problem": "問題ありません 😊",
  "looking forward to it": "楽しみにしています！",
  "let's do our best": "一緒に頑張りましょう！💪",
  "take care": "気をつけて！🙏",
  "safety first": "安全第一！⛑️",
  "i will contact you later": "後ほど連絡します",
  "please wait": "少々お待ちください",
};

// ── 言語検出 ────────────────────────────────────────────────
function detectLang(text: string): "ja" | "en" {
  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
  return hasJapanese ? "ja" : "en";
}

// ── 文分割翻訳（。！？ で分割して各文を翻訳） ─────────────
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?…])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function translateSingleSentence(sentence: string, sourceLang: "ja" | "en"): string {
  if (sourceLang === "ja") {
    // 1. Exact match
    if (JP_TO_EN[sentence]) return JP_TO_EN[sentence];

    // 2. Trim trailing punctuation and try again
    const noPunct = sentence.replace(/[。！？!?…、,]+$/, "").trim();
    if (JP_TO_EN[noPunct]) return JP_TO_EN[noPunct];

    // 3. Partial key match (longest matching key wins)
    let bestKey = "";
    let bestVal = "";
    for (const [key, val] of Object.entries(JP_TO_EN)) {
      if (sentence.includes(key) && key.length > bestKey.length) {
        bestKey = key;
        bestVal = val;
      }
    }
    if (bestKey) return bestVal;

    // 4. Keyword-based composition
    return composeFromKeywords(sentence);
  } else {
    const lower = sentence.toLowerCase();
    if (EN_TO_JP[lower]) return EN_TO_JP[lower];
    const noPunct = lower.replace(/[.!?…,]+$/, "").trim();
    if (EN_TO_JP[noPunct]) return EN_TO_JP[noPunct];
    for (const [key, val] of Object.entries(EN_TO_JP)) {
      if (lower.includes(key)) return val;
    }
    return `[翻訳不可 — 日本語: "${sentence}"]`;
  }
}

// ── キーワード組み立て翻訳 ──────────────────────────────────
const KEYWORD_MAP: [RegExp, string][] = [
  [/明日から.*現場/, "Starting at the new worksite tomorrow"],
  [/来週から.*現場/, "Starting at the new worksite next week"],
  [/新しい.*現場/, "new worksite"],
  [/体調.*気をつけ/, "take good care of your health 🌿"],
  [/安全.*気をつけ/, "please stay safe ⛑️"],
  [/頑張りましょ/, "let's give it our best! 💪"],
  [/頑張って/, "you can do it! 💪"],
  [/お疲れ.*様/, "great work! 👍"],
  [/よろしく.*お願い/, "best regards 🙏"],
  [/ありがとう/, "thank you 😊"],
  [/了解/, "understood 👍"],
  [/わかりました/, "got it 👍"],
  [/連絡.*ください/, "please feel free to contact us 📱"],
  [/相談.*ください/, "please don't hesitate to ask 🙏"],
  [/サポート/, "we're here to support you 🤝"],
  [/面接/, "interview 📅"],
  [/給料|給与|月給/, "salary 💴"],
  [/住居|寮/, "housing 🏠"],
  [/ビザ/, "visa 🛂"],
];

function composeFromKeywords(text: string): string {
  const parts: string[] = [];
  let remaining = text;

  for (const [pattern, translation] of KEYWORD_MAP) {
    if (pattern.test(remaining)) {
      parts.push(translation);
      remaining = remaining.replace(pattern, "");
    }
  }

  if (parts.length > 0) {
    const composed = parts.join(", ");
    // Capitalize first letter
    return composed.charAt(0).toUpperCase() + composed.slice(1);
  }

  return `[Translation unavailable — please use Google Translate for: "${text}"]`;
}

// ── メイン翻訳関数 ──────────────────────────────────────────
function offlineTranslate(text: string): {
  translated: string;
  source_lang: string;
  target_lang: string;
  method: "offline";
} {
  const sourceLang = detectLang(text);
  const targetLang = sourceLang === "ja" ? "en" : "ja";

  // 1. Full exact match
  const exactResult = sourceLang === "ja" ? JP_TO_EN[text] : EN_TO_JP[text.toLowerCase()];
  if (exactResult) {
    return { translated: exactResult, source_lang: sourceLang, target_lang: targetLang, method: "offline" };
  }

  // 2. Split into sentences and translate each
  const sentences = splitSentences(text);
  if (sentences.length > 1) {
    const translated = sentences
      .map((s) => translateSingleSentence(s, sourceLang))
      .join(" ");
    return { translated, source_lang: sourceLang, target_lang: targetLang, method: "offline" };
  }

  // 3. Single sentence translation
  const singleResult = translateSingleSentence(text, sourceLang);
  return { translated: singleResult, source_lang: sourceLang, target_lang: targetLang, method: "offline" };
}

// ── Route handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { text, target_lang } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const sourceLang = detectLang(text);
    const finalTarget = target_lang ?? (sourceLang === "ja" ? "en" : "ja");

    // Try OpenAI first if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const langNames: Record<string, string> = { ja: "Japanese", en: "English" };
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator specializing in warm, friendly workplace communication for Filipino workers in Japan. Translate to ${langNames[finalTarget] ?? finalTarget}. Use warm, encouraging language with appropriate emoji. Return ONLY the translated text.`,
              },
              { role: "user", content: text },
            ],
            max_tokens: 512,
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.choices?.[0]?.message?.content?.trim();
          if (translated) {
            return NextResponse.json({ translated, source_lang: sourceLang, target_lang: finalTarget, method: "openai" });
          }
        }
      } catch {
        // fall through to offline
      }
    }

    const result = offlineTranslate(text);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Translation failed", details: String(error) }, { status: 500 });
  }
}
