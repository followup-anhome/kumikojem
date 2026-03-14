"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { analyzeFBProfile, toPercent, type FBAnalysisResult } from "@/lib/fb-analyzer";

// ─── 定数 ─────────────────────────────────────────────────

const VISA_OPTIONS = [
  { value: "ENGINEER",            label: "技術・人文知識・国際業務（技人国）" },
  { value: "SPECIFIED_SKILLED_1", label: "特定技能1号" },
  { value: "SPECIFIED_SKILLED_2", label: "特定技能2号" },
  { value: "TECHNICAL_INTERN",    label: "技能実習" },
  { value: "STUDENT",             label: "留学" },
  { value: "PERMANENT_RESIDENT",  label: "永住者" },
  { value: "SPOUSE",              label: "配偶者ビザ" },
  { value: "OTHER",               label: "その他" },
];

const JAPANESE_LEVELS = [
  { value: "N1",   label: "N1（最上級）" },
  { value: "N2",   label: "N2（ビジネス可）" },
  { value: "N3",   label: "N3（日常会話）" },
  { value: "N4",   label: "N4（基礎）" },
  { value: "N5",   label: "N5（入門）" },
  { value: "NONE", label: "なし" },
];

const ENGLISH_LEVELS = [
  { value: "BUSINESS", label: "ビジネスレベル" },
  { value: "DAILY",    label: "日常会話" },
  { value: "BASIC",    label: "基礎" },
  { value: "NONE",     label: "なし" },
];

const SKILL_OPTIONS = [
  { value: "介護",   icon: "🤝", label: "介護・福祉" },
  { value: "建設",   icon: "🏗️", label: "建設・土木" },
  { value: "製造",   icon: "🏭", label: "製造・工場" },
  { value: "IT",     icon: "💻", label: "IT・システム" },
  { value: "飲食",   icon: "🍜", label: "飲食・調理" },
  { value: "農業",   icon: "🌾", label: "農業・林業" },
  { value: "運送",   icon: "🚛", label: "運送・物流" },
  { value: "その他", icon: "✨", label: "その他" },
];

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const CERT_OPTIONS = [
  "フォークリフト運転技能", "大型自動車免許", "危険物取扱者",
  "玉掛け技能", "足場の組立て等", "溶接技術",
  "介護福祉士", "ホームヘルパー2級", "初任者研修修了",
  "実務者研修修了", "調理師", "普通自動車免許",
];

type Step = "profile" | "skills" | "pr" | "fb" | "confirm";
type FormErrors = Record<string, string>;

// ─── フォームデータ型 ─────────────────────────────────────
interface FormData {
  // Step 1 — 基本情報
  name: string;
  email: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  height: string;
  weight: string;
  visa_type: string;
  japanese_level: string;
  english_level: string;
  // Step 2 — スキル・希望条件
  skills: string[];
  certs: string[];
  desired_prefecture: string;
  salary_type: "MONTHLY" | "HOURLY";
  desired_salary: string;
  // Step 3 — 自己PR + 写真
  bio_ja: string;
  bio_en: string;
  photo_url: string;
  // Step 4 — FB
  fb_profile_url: string;
  fb_score: number | null;
}

const initialForm: FormData = {
  name: "", email: "", phone: "",
  gender: "MALE", height: "", weight: "",
  visa_type: "", japanese_level: "", english_level: "",
  skills: [], certs: [],
  desired_prefecture: "", salary_type: "MONTHLY", desired_salary: "",
  bio_ja: "", bio_en: "",
  photo_url: "", fb_profile_url: "https://facebook.com/", fb_score: null,
};

// ─── バリデーション ──────────────────────────────────────
function validateStep(step: Step, form: FormData): FormErrors {
  const errs: FormErrors = {};
  if (step === "profile") {
    if (!form.name.trim())          errs.name = "名前を入力してください";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                     errs.email = "正しいメールアドレスを入力してください";
    if (!form.visa_type)             errs.visa_type = "ビザ種別を選択してください";
    if (!form.japanese_level)        errs.japanese_level = "日本語レベルを選択してください";
    if (!form.english_level)         errs.english_level = "英語レベルを選択してください";
    if (form.height && (isNaN(+form.height) || +form.height < 100 || +form.height > 250))
                                     errs.height = "100〜250cm の値を入力してください";
    if (form.weight && (isNaN(+form.weight) || +form.weight < 30 || +form.weight > 200))
                                     errs.weight = "30〜200kg の値を入力してください";
  }
  if (step === "skills") {
    if (form.skills.length === 0)    errs.skills = "スキルを1つ以上選択してください";
    if (!form.desired_prefecture)    errs.desired_prefecture = "希望勤務地を選択してください";
    if (!form.desired_salary.trim()) errs.desired_salary = "希望給与を入力してください";
    else if (isNaN(+form.desired_salary) || +form.desired_salary <= 0)
                                     errs.desired_salary = "正しい金額を入力してください";
  }
  return errs;
}

// ─── メインコンポーネント ─────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState<Step>("profile");
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fbAnalyzing, setFbAnalyzing] = useState(false);
  const [fbResult, setFbResult] = useState<FBAnalysisResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
    },
    []
  );

  function toggleMulti(key: "skills" | "certs", val: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter((v) => v !== val)
        : [...prev[key], val],
    }));
    if (key === "skills") setErrors((prev) => { const e = { ...prev }; delete e.skills; return e; });
  }

  // ── 写真アップロード ──────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/upload/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set("photo_url", data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "写真のアップロードに失敗しました");
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Facebook 解析 ─────────────────────────────────────
  async function runFBAnalysis() {
    if (!form.fb_profile_url || form.fb_profile_url === "https://facebook.com/") return;
    setFbAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const result = analyzeFBProfile(form.fb_profile_url);
    setFbResult(result);
    set("fb_score", result.overall_fb_score);
    setFbAnalyzing(false);
  }

  // ── ステップ遷移 ──────────────────────────────────────
  const STEPS: Step[] = ["profile", "skills", "pr", "fb", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  function goNext(next: Step) {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack(prev: Step) {
    setErrors({});
    setStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── 送信 ─────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          gender: form.gender,
          height_cm: form.height || undefined,
          weight_kg: form.weight || undefined,
          visa_type: form.visa_type,
          japanese_level: form.japanese_level,
          english_level: form.english_level,
          skills: form.skills,
          desired_prefecture: form.desired_prefecture,
          salary_type: form.salary_type,
          desired_salary: form.desired_salary,
          bio_ja: form.bio_ja || undefined,
          bio_en: form.bio_en || undefined,
          photo_url: form.photo_url || undefined,
          fb_profile_url: form.fb_profile_url !== "https://facebook.com/" ? form.fb_profile_url : undefined,
          fb_score: form.fb_score ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 完了画面 ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {photoPreview && (
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-emerald-400 shadow-lg">
              <Image src={photoPreview} alt="profile" width={96} height={96} className="object-cover w-full h-full" />
            </div>
          )}
          {!photoPreview && <div className="text-6xl mb-4">🎉</div>}
          <h1 className="text-2xl font-black text-slate-900 mb-2">登録完了！</h1>
          <p className="text-slate-500 mb-1">
            <strong className="text-slate-700">{form.name}</strong> さんのプロフィールが登録されました。
          </p>
          <p className="text-sm text-slate-400 mb-6">
            24時間以内にマッチング求人をお知らせします。
          </p>
          <Link
            href="/talent"
            className="inline-block px-8 py-3 bg-[#1e3a5f] text-white font-bold rounded-xl shadow-sm"
          >
            求人一覧を見る →
          </Link>
        </div>
      </div>
    );
  }

  // ── ヘッダー ─────────────────────────────────────────
  const STEP_LABELS = ["基本情報", "スキル・希望", "自己PR", "FB解析", "確認"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] text-white px-4 py-3 sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/talent" className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="font-bold text-sm">求職者登録</div>
            <div className="text-[10px] text-blue-200">
              Step {stepIdx + 1} / {STEPS.length} — {STEP_LABELS[stepIdx]}
            </div>
          </div>
          <div className="ml-auto flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  i < stepIdx ? "bg-blue-300" : i === stepIdx ? "bg-white" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-12">

        {/* ══════════════════════════════════════════════
            STEP 1: 基本情報
        ══════════════════════════════════════════════ */}
        {step === "profile" && (
          <div className="space-y-5 mt-2">
            <StepHeader
              icon="👤"
              title="基本情報"
              desc="あなたのプロフィールを入力してください。"
            />

            {/* 名前 */}
            <Field label="氏名" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="例：Juan dela Cruz"
                className={inputCls(!!errors.name)}
              />
            </Field>

            {/* 性別 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">性別</label>
              <div className="grid grid-cols-3 gap-2">
                {([["MALE","👨 男性"],["FEMALE","👩 女性"],["OTHER","🧑 その他"]] as const).map(([v, l]) => (
                  <ToggleBtn key={v} active={form.gender === v} onClick={() => set("gender", v)}>
                    {l}
                  </ToggleBtn>
                ))}
              </div>
            </div>

            {/* 身長・体重 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="身長 (cm)" error={errors.height}>
                <input type="number" value={form.height} onChange={(e) => set("height", e.target.value)}
                  placeholder="例：170" className={inputCls(!!errors.height)} />
              </Field>
              <Field label="体重 (kg)" error={errors.weight}>
                <input type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)}
                  placeholder="例：65" className={inputCls(!!errors.weight)} />
              </Field>
            </div>

            {/* ビザ種別 */}
            <Field label="ビザ種別" required error={errors.visa_type}>
              <select value={form.visa_type} onChange={(e) => set("visa_type", e.target.value)}
                className={selectCls(!!errors.visa_type)}>
                <option value="">選択してください</option>
                {VISA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* 日本語レベル */}
            <Field label="日本語レベル（JLPT）" required error={errors.japanese_level}>
              <div className="grid grid-cols-3 gap-2">
                {JAPANESE_LEVELS.map((l) => (
                  <ToggleBtn
                    key={l.value}
                    active={form.japanese_level === l.value}
                    onClick={() => set("japanese_level", l.value)}
                    small
                  >
                    {l.label}
                  </ToggleBtn>
                ))}
              </div>
            </Field>

            {/* 英語レベル */}
            <Field label="英語レベル" required error={errors.english_level}>
              <div className="grid grid-cols-2 gap-2">
                {ENGLISH_LEVELS.map((l) => (
                  <ToggleBtn
                    key={l.value}
                    active={form.english_level === l.value}
                    onClick={() => set("english_level", l.value)}
                    small
                  >
                    {l.label}
                  </ToggleBtn>
                ))}
              </div>
            </Field>

            {/* 連絡先 */}
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-3">連絡先（任意）</p>
              <div className="space-y-3">
                <Field label="メールアドレス" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="例：juan@example.com" className={inputCls(!!errors.email)} />
                </Field>
                <Field label="電話番号">
                  <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="例：09012345678" className={inputCls(false)} />
                </Field>
              </div>
            </div>

            <NextBtn onClick={() => goNext("skills")}>
              次へ：スキル・希望条件 →
            </NextBtn>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2: スキル・希望条件
        ══════════════════════════════════════════════ */}
        {step === "skills" && (
          <div className="space-y-5 mt-2">
            <StepHeader
              icon="🎯"
              title="スキル・希望条件"
              desc="経験・スキルと勤務条件を教えてください。"
            />

            {/* スキル */}
            <Field label="スキル・経験" required error={errors.skills}>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleMulti("skills", s.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.skills.includes(s.value)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    {s.label}
                    {form.skills.includes(s.value) && (
                      <span className="ml-auto text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* 資格・免許 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                資格・免許
                <span className="ml-2 text-xs font-normal text-slate-400">任意・複数選択可</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CERT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleMulti("certs", c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      form.certs.includes(c)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {form.certs.includes(c) ? "✓ " : ""}{c}
                  </button>
                ))}
              </div>
            </div>

            {/* 希望勤務地 */}
            <Field label="希望勤務地（都道府県）" required error={errors.desired_prefecture}>
              <select
                value={form.desired_prefecture}
                onChange={(e) => set("desired_prefecture", e.target.value)}
                className={selectCls(!!errors.desired_prefecture)}
              >
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            {/* 希望給与 */}
            <Field label="希望給与" required error={errors.desired_salary}>
              <div className="flex gap-2">
                <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                  {(["MONTHLY","HOURLY"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => set("salary_type", t)}
                      className={`px-3 py-2.5 text-sm font-semibold transition-colors ${
                        form.salary_type === t
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {t === "MONTHLY" ? "月給" : "時給"}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                  <input
                    type="number"
                    value={form.desired_salary}
                    onChange={(e) => set("desired_salary", e.target.value)}
                    placeholder={form.salary_type === "MONTHLY" ? "例：180000" : "例：1100"}
                    className={`${inputCls(!!errors.desired_salary)} pl-7`}
                  />
                </div>
              </div>
              {form.desired_salary && !errors.desired_salary && (
                <p className="text-xs text-slate-400 mt-1">
                  ¥{parseInt(form.desired_salary).toLocaleString()}/{form.salary_type === "MONTHLY" ? "月" : "時間"}
                </p>
              )}
            </Field>

            <div className="flex gap-3">
              <BackBtn onClick={() => goBack("profile")} />
              <NextBtn onClick={() => goNext("pr")}>次へ：自己PR →</NextBtn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 3: 自己PR + 写真
        ══════════════════════════════════════════════ */}
        {step === "pr" && (
          <div className="space-y-5 mt-2">
            <StepHeader
              icon="✍️"
              title="自己PR・プロフィール写真"
              desc="企業へのアピール文と顔写真を登録してください（任意）。"
            />

            {/* プロフィール写真 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                プロフィール写真
                <span className="ml-2 text-xs font-normal text-slate-400">JPEG・PNG・WebP（最大5MB）</span>
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 bg-slate-50
                             flex items-center justify-center overflow-hidden cursor-pointer
                             hover:border-blue-400 transition-colors flex-shrink-0"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="preview"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : uploadingPhoto ? (
                    <svg className="animate-spin w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="text-sm px-4 py-2 border border-slate-200 rounded-lg bg-white
                               hover:bg-slate-50 text-slate-600 font-medium transition-colors
                               disabled:opacity-50"
                  >
                    {uploadingPhoto ? "アップロード中…" : photoPreview ? "写真を変更" : "写真を選択"}
                  </button>
                  {form.photo_url && (
                    <p className="text-xs text-emerald-600 mt-1">✓ アップロード完了</p>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* 自己PR (日本語) */}
            <Field label="自己PR（日本語）">
              <textarea
                value={form.bio_ja}
                onChange={(e) => set("bio_ja", e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="日本語での自己紹介・アピールポイントを入力してください（最大500文字）"
                className={`${inputCls(false)} resize-none`}
              />
              <p className="text-xs text-slate-400 text-right mt-1">{form.bio_ja.length}/500</p>
            </Field>

            {/* 自己PR (英語) */}
            <Field label="Self Introduction (English)">
              <textarea
                value={form.bio_en}
                onChange={(e) => set("bio_en", e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Write your self-introduction in English (max 500 chars)"
                className={`${inputCls(false)} resize-none`}
              />
              <p className="text-xs text-slate-400 text-right mt-1">{form.bio_en.length}/500</p>
            </Field>

            <div className="flex gap-3">
              <BackBtn onClick={() => goBack("skills")} />
              <NextBtn onClick={() => goNext("fb")}>次へ：FB解析 →</NextBtn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 4: Facebook 解析
        ══════════════════════════════════════════════ */}
        {step === "fb" && (
          <div className="space-y-5 mt-2">
            <StepHeader
              icon="🤖"
              title="Facebook プロフィール解析"
              desc="AIがあなたの活力・個性・信頼性をスコア化します。任意ですがスキップも可能です。"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <strong>🔒 プライバシー保護：</strong> 公開情報のみを解析します。URLは企業に直接共有されません。
            </div>

            <Field label="Facebook プロフィール URL">
              <input
                type="url"
                value={form.fb_profile_url}
                onChange={(e) => set("fb_profile_url", e.target.value)}
                placeholder="https://facebook.com/your.name"
                className={inputCls(false)}
              />
            </Field>

            <button
              onClick={runFBAnalysis}
              disabled={fbAnalyzing || form.fb_profile_url === "https://facebook.com/"}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200
                         text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {fbAnalyzing ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  解析中…
                </>
              ) : "🤖 プロフィールを解析する"}
            </button>

            {fbResult && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
                  <div className="text-white font-bold">AI解析完了 ✨</div>
                  <div className="text-blue-100 text-xs mt-0.5">
                    {fbResult.simulated ? "シミュレーションモード" : "ライブ解析"}
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <ScoreBar label="⚡ 活力・エネルギー"   score={fbResult.vitality_score}    color="bg-orange-500" />
                    <ScoreBar label="😊 性格・明るさ"       score={fbResult.personality_score}  color="bg-yellow-500" />
                    <ScoreBar label="🎯 信頼性・真面目さ"   score={fbResult.reliability_score}  color="bg-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <span className="font-semibold text-slate-700">総合 FB スコア</span>
                    <span className="text-2xl font-black text-blue-600">
                      {toPercent(fbResult.overall_fb_score)}
                      <span className="text-sm font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fbResult.tags.map((tag) => (
                      <span key={tag.label} className={`text-sm px-3 py-1 rounded-full font-medium ${
                        tag.type === "positive" ? "bg-emerald-100 text-emerald-700"
                        : tag.type === "neutral" ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                        {tag.emoji} {tag.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic border-t border-slate-100 pt-3">
                    &ldquo;{fbResult.summary}&rdquo;
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <BackBtn onClick={() => goBack("pr")} />
              <NextBtn onClick={() => { setErrors({}); setStep("confirm"); window.scrollTo({top:0,behavior:"smooth"}); }}>
                次へ：確認 →
              </NextBtn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 5: 確認
        ══════════════════════════════════════════════ */}
        {step === "confirm" && (
          <div className="space-y-5 mt-2">
            <StepHeader
              icon="✅"
              title="登録内容の確認"
              desc="内容を確認して「登録する」ボタンを押してください。"
            />

            {/* 写真 */}
            {photoPreview && (
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1e3a5f]/20 shadow">
                  <Image src={photoPreview} alt="profile" width={96} height={96} className="object-cover w-full h-full" />
                </div>
              </div>
            )}

            <ConfirmCard title="基本情報">
              <ConfirmRow label="氏名"       value={form.name} />
              <ConfirmRow label="性別"       value={form.gender === "MALE" ? "男性" : form.gender === "FEMALE" ? "女性" : "その他"} />
              {form.height && <ConfirmRow label="身長"  value={`${form.height} cm`} />}
              {form.weight && <ConfirmRow label="体重"  value={`${form.weight} kg`} />}
              <ConfirmRow label="ビザ種別"   value={VISA_OPTIONS.find(o => o.value === form.visa_type)?.label ?? "—"} />
              <ConfirmRow label="日本語"     value={JAPANESE_LEVELS.find(l => l.value === form.japanese_level)?.label ?? "—"} />
              <ConfirmRow label="英語"       value={ENGLISH_LEVELS.find(l => l.value === form.english_level)?.label ?? "—"} />
              {form.email && <ConfirmRow label="メール" value={form.email} />}
              {form.phone && <ConfirmRow label="電話"   value={form.phone} />}
            </ConfirmCard>

            <ConfirmCard title="スキル・希望条件">
              <ConfirmRow label="スキル"     value={form.skills.join("、") || "—"} />
              {form.certs.length > 0 && <ConfirmRow label="資格"  value={form.certs.join("、")} />}
              <ConfirmRow label="希望勤務地" value={form.desired_prefecture || "—"} />
              <ConfirmRow
                label="希望給与"
                value={form.desired_salary ? `¥${parseInt(form.desired_salary).toLocaleString()}/${form.salary_type === "MONTHLY" ? "月" : "時間"}` : "—"}
                highlight
              />
            </ConfirmCard>

            {(form.bio_ja || form.bio_en) && (
              <ConfirmCard title="自己PR">
                {form.bio_ja && <ConfirmRow label="日本語" value={form.bio_ja} multi />}
                {form.bio_en && <ConfirmRow label="English" value={form.bio_en} multi />}
              </ConfirmCard>
            )}

            {fbResult && (
              <ConfirmCard title="FB スコア">
                <ConfirmRow label="総合スコア" value={`${toPercent(fbResult.overall_fb_score)}/100`} highlight />
              </ConfirmCard>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                ⚠️ {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <BackBtn onClick={() => goBack("fb")} />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200
                           text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登録中…
                  </>
                ) : "✅ 登録する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UI ヘルパーコンポーネント ────────────────────────────

function inputCls(hasErr: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
    hasErr
      ? "border-red-400 focus:ring-red-300"
      : "border-slate-200 focus:ring-blue-500 focus:border-transparent"
  }`;
}
function selectCls(hasErr: boolean) {
  return `${inputCls(hasErr)} appearance-none pr-8 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]`;
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-1.5">
        {label}
        {required && <span className="ml-1 text-red-500 text-xs">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">⚠ {error}</p>}
    </div>
  );
}

function ToggleBtn({
  active, onClick, children, small = false,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-xl border-2 font-semibold transition-all text-center ${
        small ? "text-xs px-2" : "text-sm px-3"
      } ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function NextBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-bold rounded-xl transition-colors"
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
    >
      ← 戻る
    </button>
  );
}

function StepHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="pt-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
      </div>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function ConfirmCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function ConfirmRow({ label, value, highlight = false, multi = false }: {
  label: string; value: string; highlight?: boolean; multi?: boolean;
}) {
  return (
    <div className={`flex gap-4 text-sm ${multi ? "flex-col" : "justify-between items-start"} border-b border-slate-50 pb-2 last:border-0 last:pb-0`}>
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className={`font-medium ${highlight ? "text-blue-600" : "text-slate-700"} ${multi ? "" : "text-right"}`}>
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
