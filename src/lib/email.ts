/**
 * email.ts — Resend を使ったメール送信ユーティリティ
 * 対応言語: 日本語 / English / Tagalog
 * 送信元: onboarding@resend.dev (独自ドメイン設定前)
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "KUMIKOJEM <onboarding@resend.dev>"

// ─────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────

export interface ApplicationEmailData {
  talentName: string
  talentEmail: string
  companyName: string
  companyEmail: string
  jobTitle: string
  jobLocation: string
  appliedAt: string // ISO string
}

export interface StatusChangeEmailData {
  talentName: string
  talentEmail: string
  companyName: string
  jobTitle: string
  newStatus: "REVIEWING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN"
  interviewAt?: string | null // ISO string (面談日時, INTERVIEW時のみ)
}

// ─────────────────────────────────────────────────────────
// 共通スタイル
// ─────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KUMIKOJEM</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- ヘッダー -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">KUMIKOJEM</h1>
          <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">外国人材 × 住まい × 仕事のプラットフォーム</p>
        </td>
      </tr>
      <!-- 本文 -->
      <tr>
        <td style="padding:40px 40px 32px;">
          ${content}
        </td>
      </tr>
      <!-- フッター -->
      <tr>
        <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
            © 2026 KUMIKOJEM. このメールに心当たりがない場合は、無視してください。<br/>
            If you did not expect this email, please ignore it.<br/>
            Kung hindi mo inaasahan ang email na ito, balewalain mo lang ito.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;"/>`
}

function badge(color: string, text: string): string {
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;">${text}</span>`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:500;">${value}</td>
  </tr>`
}

// ─────────────────────────────────────────────────────────
// テンプレート: 応募確認 (求職者向け)
// ─────────────────────────────────────────────────────────

function talentAppliedHtml(d: ApplicationEmailData): string {
  const content = `
    <!-- JP -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇯🇵 日本語</p>
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">ご応募を受け付けました！</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
      ${d.talentName} 様、<strong>${d.jobTitle}</strong>（${d.companyName}）へのご応募ありがとうございます。<br/>
      担当者が書類を確認次第、ご連絡いたします。
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
      <tbody>
        ${infoRow("求人", d.jobTitle)}
        ${infoRow("企業", d.companyName)}
        ${infoRow("勤務地", d.jobLocation)}
        ${infoRow("応募日時", new Date(d.appliedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }))}
      </tbody>
    </table>

    ${divider()}

    <!-- EN -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇺🇸 English</p>
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Application Received!</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Hi ${d.talentName},<br/>
      We've received your application for <strong>${d.jobTitle}</strong> at ${d.companyName}.<br/>
      The recruiter will review your profile and get back to you soon.
    </p>

    ${divider()}

    <!-- TL -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇵🇭 Filipino / Tagalog</p>
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Natanggap ang Iyong Aplikasyon!</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Kumusta ${d.talentName},<br/>
      Natanggap namin ang iyong aplikasyon para sa <strong>${d.jobTitle}</strong> sa ${d.companyName}.<br/>
      Susuriin ng recruiter ang iyong profile at makikipag-ugnayan sa iyo sa lalong madaling panahon.
    </p>
  `
  return baseLayout(content)
}

// ─────────────────────────────────────────────────────────
// テンプレート: 応募通知 (企業向け)
// ─────────────────────────────────────────────────────────

function companyNewApplicantHtml(d: ApplicationEmailData): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">新しい応募がありました</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
      <strong>${d.jobTitle}</strong>に新しい応募者がいます。管理画面からご確認ください。
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:24px;">
      <tbody>
        ${infoRow("応募者", d.talentName)}
        ${infoRow("応募求人", d.jobTitle)}
        ${infoRow("応募日時", new Date(d.appliedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }))}
      </tbody>
    </table>
    <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/company/dashboard"
       style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
      管理画面で確認する →
    </a>
  `
  return baseLayout(content)
}

// ─────────────────────────────────────────────────────────
// テンプレート: ステータス変更 (求職者向け)
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  REVIEWING: {
    badgeColor: "#f59e0b",
    ja: { label: "書類選考中", message: "書類選考が始まりました。結果をお待ちください。" },
    en: { label: "Under Review", message: "Your application is now under review. Please wait for further updates." },
    tl: { label: "Sinusuri", message: "Ang iyong aplikasyon ay kasalukuyang sinusuri. Mangyaring maghintay ng karagdagang update." },
  },
  INTERVIEW: {
    badgeColor: "#8b5cf6",
    ja: { label: "面談予定", message: "おめでとうございます！面談の日程が決まりました。" },
    en: { label: "Interview Scheduled", message: "Congratulations! Your interview has been scheduled." },
    tl: { label: "Naka-iskedyul na Interview", message: "Maligayang bati! Naka-iskedyul na ang iyong interview." },
  },
  OFFERED: {
    badgeColor: "#10b981",
    ja: { label: "内定", message: "おめでとうございます！内定のご連絡です。詳細は担当者よりご連絡します。" },
    en: { label: "Job Offer", message: "Congratulations! You have received a job offer. Details will follow from the recruiter." },
    tl: { label: "Job Offer", message: "Maligayang bati! Nakatanggap ka ng job offer. Makikipag-ugnayan sa iyo ang recruiter para sa mga detalye." },
  },
  REJECTED: {
    badgeColor: "#ef4444",
    ja: { label: "不採用", message: "誠に恐れ入りますが、今回は採用を見送らせていただくこととなりました。またのご応募をお待ちしております。" },
    en: { label: "Not Selected", message: "Thank you for your application. Unfortunately, you were not selected this time. We encourage you to apply again in the future." },
    tl: { label: "Hindi Napili", message: "Salamat sa iyong aplikasyon. Sa kasamaang-palad, hindi ka napili sa pagkakataong ito. Hinihikayat ka naming mag-apply muli sa hinaharap." },
  },
  WITHDRAWN: {
    badgeColor: "#94a3b8",
    ja: { label: "辞退", message: "応募を辞退されたことを確認しました。またのご利用をお待ちしております。" },
    en: { label: "Withdrawn", message: "We've confirmed your withdrawal. We hope to see you again in the future." },
    tl: { label: "Na-withdraw", message: "Nakumpirma namin ang iyong pag-withdraw. Umaasa kaming makita kang muli sa hinaharap." },
  },
} as const

function talentStatusChangedHtml(d: StatusChangeEmailData): string {
  const cfg = STATUS_CONFIG[d.newStatus]
  const interviewBlock =
    d.newStatus === "INTERVIEW" && d.interviewAt
      ? `<p style="background:#ede9fe;border-left:4px solid #8b5cf6;padding:12px 16px;border-radius:0 8px 8px 0;font-size:14px;color:#4c1d95;margin:0 0 20px;">
          📅 面談日時 / Interview Date:<br/>
          <strong>${new Date(d.interviewAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</strong><br/>
          <span style="color:#6d28d9;font-size:12px;">${new Date(d.interviewAt).toLocaleString("en-US", { timeZone: "Asia/Tokyo", dateStyle: "full", timeStyle: "short" })}</span>
        </p>`
      : ""

  const content = `
    <!-- JP -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇯🇵 日本語</p>
    <p style="margin:0 0 12px;">${badge(cfg.badgeColor, cfg.ja.label)}</p>
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">応募状況が更新されました</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
      ${d.talentName} 様、<strong>${d.jobTitle}</strong>（${d.companyName}）の応募状況が更新されました。<br/>
      ${cfg.ja.message}
    </p>
    ${interviewBlock}

    ${divider()}

    <!-- EN -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇺🇸 English</p>
    <p style="margin:0 0 12px;">${badge(cfg.badgeColor, cfg.en.label)}</p>
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Application Status Updated</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Hi ${d.talentName},<br/>
      Your application for <strong>${d.jobTitle}</strong> at ${d.companyName} has been updated.<br/>
      ${cfg.en.message}
    </p>

    ${divider()}

    <!-- TL -->
    <p style="margin:0 0 4px;color:#2563eb;font-size:12px;font-weight:600;">🇵🇭 Filipino / Tagalog</p>
    <p style="margin:0 0 12px;">${badge(cfg.badgeColor, cfg.tl.label)}</p>
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Na-update ang Status ng Aplikasyon</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Kumusta ${d.talentName},<br/>
      Na-update ang iyong aplikasyon para sa <strong>${d.jobTitle}</strong> sa ${d.companyName}.<br/>
      ${cfg.tl.message}
    </p>
  `
  return baseLayout(content)
}

// ─────────────────────────────────────────────────────────
// 送信関数
// ─────────────────────────────────────────────────────────

/**
 * 応募完了メール: 求職者 + 企業の両方に送信
 */
export async function sendApplicationEmails(data: ApplicationEmailData) {
  const results = await Promise.allSettled([
    // 求職者向け
    ...(data.talentEmail
      ? [resend.emails.send({
          from: FROM,
          to: [data.talentEmail],
          subject: `【KUMIKOJEM】ご応募を受け付けました — ${data.jobTitle}`,
          html: talentAppliedHtml(data),
        })]
      : []),

    // 企業向け
    ...(data.companyEmail
      ? [resend.emails.send({
          from: FROM,
          to: [data.companyEmail],
          subject: `【KUMIKOJEM】新しい応募 — ${data.jobTitle}`,
          html: companyNewApplicantHtml(data),
        })]
      : []),
  ])

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[email] send failed (index ${i}):`, r.reason)
    }
  })
}

/**
 * ステータス変更メール: 求職者のみ
 */
export async function sendStatusChangeEmail(data: StatusChangeEmailData) {
  if (!data.talentEmail) return

  const statusLabels: Record<StatusChangeEmailData["newStatus"], string> = {
    REVIEWING: "書類選考中",
    INTERVIEW: "面談予定",
    OFFERED: "内定",
    REJECTED: "不採用",
    WITHDRAWN: "辞退",
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [data.talentEmail],
    subject: `【KUMIKOJEM】応募状況：${statusLabels[data.newStatus]} — ${data.jobTitle}`,
    html: talentStatusChangedHtml(data),
  })

  if (error) {
    console.error("[email] sendStatusChangeEmail failed:", error)
  }
}
