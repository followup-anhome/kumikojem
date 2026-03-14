"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// ─── Types ──────────────────────────────────────────────
type JobStatus = "OPEN" | "CLOSED" | "DRAFT"
type AppStatus = "APPLIED" | "REVIEWING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN"
type SalaryType = "MONTHLY" | "HOURLY"

interface Job {
  id: string
  title: string
  description: string | null
  salary_min: number | null
  salary_max: number | null
  salary_type: SalaryType | null
  location: string
  required_skills: string[]
  accepted_visas: string[]
  status: JobStatus
  created_at: string
  _count: { applications: number }
}

interface Applicant {
  id: string
  name: string
  email: string | null
  phone: string | null
  visa_type: string
  japanese_level: string
  english_level: string
  skills: string[]
  desired_prefecture: string | null
  desired_salary: number | null
  salary_type: SalaryType | null
  bio_ja: string | null
  bio_en: string | null
  photo_url: string | null
}

interface Application {
  id: string
  status: AppStatus
  interview_at: string | null
  notes: string | null
  created_at: string
  user: Applicant
  job_posting: { id: string; title: string; location: string }
}

interface Company {
  id: string
  name: string
  industry: string
  location: string
  accepted_visas: string[]
  _count: { job_postings: number }
}

// ─── Constants ──────────────────────────────────────────
const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  APPLIED:    { label: "応募済み",   color: "text-blue-700",   bg: "bg-blue-100"   },
  REVIEWING:  { label: "書類選考中", color: "text-yellow-700", bg: "bg-yellow-100" },
  INTERVIEW:  { label: "面談予定",   color: "text-purple-700", bg: "bg-purple-100" },
  OFFERED:    { label: "内定",       color: "text-emerald-700",bg: "bg-emerald-100"},
  REJECTED:   { label: "不採用",     color: "text-red-700",    bg: "bg-red-100"    },
  WITHDRAWN:  { label: "辞退",       color: "text-slate-500",  bg: "bg-slate-100"  },
}

const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  OPEN:   { label: "公開中",  color: "text-emerald-700" },
  DRAFT:  { label: "下書き",  color: "text-yellow-700"  },
  CLOSED: { label: "掲載終了",color: "text-slate-500"   },
}

const SKILL_OPTIONS = ["介護","建設","製造","IT","飲食","農業","運送","その他"]
const VISA_OPTIONS = [
  { value: "ENGINEER",            label: "技人国" },
  { value: "SPECIFIED_SKILLED_1", label: "特定技能1号" },
  { value: "SPECIFIED_SKILLED_2", label: "特定技能2号" },
  { value: "TECHNICAL_INTERN",    label: "技能実習" },
  { value: "STUDENT",             label: "留学" },
  { value: "PERMANENT_RESIDENT",  label: "永住者" },
  { value: "SPOUSE",              label: "配偶者" },
]
const JAPANESE_LABEL: Record<string, string> = { N1:"N1",N2:"N2",N3:"N3",N4:"N4",N5:"N5",NONE:"なし" }
const ENGLISH_LABEL: Record<string, string> = { BUSINESS:"ビジネス",DAILY:"日常会話",BASIC:"基礎",NONE:"なし" }
const INDUSTRY_LABEL: Record<string, string> = {
  LOGISTICS:"運送・物流", CONSTRUCTION:"建設・土木", CARE:"福祉・介護", FACTORY:"製造・工場", OTHER:"その他"
}

// ─── New Job Form State ─────────────────────────────────
interface JobForm {
  title: string
  description: string
  salary_min: string
  salary_max: string
  salary_type: SalaryType
  location: string
  required_skills: string[]
  accepted_visas: string[]
}
const initialJobForm: JobForm = {
  title: "", description: "", salary_min: "", salary_max: "",
  salary_type: "MONTHLY", location: "", required_skills: [], accepted_visas: [],
}

// ─── Main Component ──────────────────────────────────────
export default function CompanyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<"jobs" | "applications">("jobs")
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [jobForm, setJobForm] = useState<JobForm>(initialJobForm)
  const [jobFormErrors, setJobFormErrors] = useState<Record<string, string>>({})
  const [submittingJob, setSubmittingJob] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<AppStatus | "ALL">("ALL")

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/company/login")
  }, [status, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [profileRes, jobsRes, appsRes] = await Promise.all([
      fetch("/api/company/profile"),
      fetch("/api/company/jobs"),
      fetch("/api/company/applications"),
    ])
    if (profileRes.ok) setCompany(await profileRes.json())
    if (jobsRes.ok) setJobs(await jobsRes.json())
    if (appsRes.ok) setApplications(await appsRes.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchData()
  }, [status, fetchData])

  // ── Job creation ────────────────────────────────────────
  function validateJobForm(): boolean {
    const errs: Record<string, string> = {}
    if (!jobForm.title.trim()) errs.title = "職種名を入力してください"
    if (!jobForm.location.trim()) errs.location = "勤務地を入力してください"
    if (jobForm.salary_min && isNaN(+jobForm.salary_min)) errs.salary_min = "数値を入力してください"
    if (jobForm.salary_max && isNaN(+jobForm.salary_max)) errs.salary_max = "数値を入力してください"
    setJobFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleCreateJob() {
    if (!validateJobForm()) return
    setSubmittingJob(true)
    const res = await fetch("/api/company/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobForm),
    })
    setSubmittingJob(false)
    if (res.ok) {
      const newJob = await res.json()
      setJobs(prev => [{ ...newJob, _count: { applications: 0 } }, ...prev])
      setShowJobForm(false)
      setJobForm(initialJobForm)
      setJobFormErrors({})
    }
  }

  async function toggleJobStatus(job: Job) {
    const newStatus: JobStatus = job.status === "OPEN" ? "CLOSED" : "OPEN"
    const res = await fetch(`/api/company/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
    }
  }

  async function handleStatusChange(appId: string, newStatus: AppStatus) {
    setUpdatingStatus(appId)
    const res = await fetch(`/api/company/applications/${appId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setUpdatingStatus(null)
    if (res.ok) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  function toggleSkill(skill: string) {
    setJobForm(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill],
    }))
  }

  function toggleVisa(visa: string) {
    setJobForm(prev => ({
      ...prev,
      accepted_visas: prev.accepted_visas.includes(visa)
        ? prev.accepted_visas.filter(v => v !== visa)
        : [...prev.accepted_visas, visa],
    }))
  }

  const filteredApps = filterStatus === "ALL"
    ? applications
    : applications.filter(a => a.status === filterStatus)

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-[#1e3a5f] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-slate-500 text-sm">読み込み中…</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-[#1e3a5f] text-white px-4 py-3 sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg">KUMIKOJEM</span>
            <span className="text-blue-300 text-xs hidden sm:inline">企業ダッシュボード</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{company?.name ?? session?.user?.name}</p>
              <p className="text-xs text-blue-200">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/company/login" })}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* ── Company Profile Card ────────────────────── */}
        {company && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center text-2xl flex-shrink-0">🏢</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-slate-900 text-lg leading-tight">{company.name}</h2>
              <p className="text-sm text-slate-500">{INDUSTRY_LABEL[company.industry] ?? company.industry} • 📍 {company.location}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.accepted_visas.map(v => (
                <span key={v} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  {VISA_OPTIONS.find(o => o.value === v)?.label ?? v}
                </span>
              ))}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black text-[#1e3a5f]">{company._count.job_postings}</p>
              <p className="text-xs text-slate-400">掲載求人数</p>
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 mb-4">
          {(["jobs", "applications"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "jobs" ? (
                <>📋 求人管理 <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{jobs.length}</span></>
              ) : (
                <>👥 応募者管理 <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{applications.length}</span></>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            TAB: 求人管理
        ═══════════════════════════════════════════════ */}
        {tab === "jobs" && (
          <div>
            {/* Create button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => { setShowJobForm(true); setJobForm(initialJobForm); setJobFormErrors({}) }}
                className="px-4 py-2 bg-[#1e3a5f] text-white text-sm font-bold rounded-xl hover:bg-[#16304f] transition-colors"
              >
                ＋ 新規求人を作成
              </button>
            </div>

            {/* Job list */}
            {jobs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">📋</div>
                <p className="font-semibold">まだ求人がありません</p>
                <p className="text-sm mt-1">「新規求人を作成」から求人票を作成してください。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            job.status === "OPEN" ? "bg-emerald-100 text-emerald-700" :
                            job.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {JOB_STATUS_CONFIG[job.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          📍 {job.location}
                          {job.salary_min && (
                            <> • ¥{job.salary_min.toLocaleString()}{job.salary_max ? `〜¥${job.salary_max.toLocaleString()}` : "〜"}
                            /{job.salary_type === "MONTHLY" ? "月" : "時間"}</>
                          )}
                        </p>
                        {job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.required_skills.map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xl font-black text-[#1e3a5f]">{job._count.applications}</p>
                          <p className="text-xs text-slate-400">応募者</p>
                        </div>
                        <button
                          onClick={() => toggleJobStatus(job)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                            job.status === "OPEN"
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {job.status === "OPEN" ? "非公開にする" : "公開する"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: 応募者管理
        ═══════════════════════════════════════════════ */}
        {tab === "applications" && (
          <div className="flex gap-4">
            {/* Application list */}
            <div className="flex-1 min-w-0">
              {/* Status filter */}
              <div className="flex gap-2 flex-wrap mb-3">
                {(["ALL", ...Object.keys(STATUS_CONFIG)] as (AppStatus | "ALL")[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      filterStatus === s
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s === "ALL" ? `すべて (${applications.length})` : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {filteredApps.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="font-semibold">応募者はいません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredApps.map(app => {
                    const sc = STATUS_CONFIG[app.status]
                    return (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-sm ${
                          selectedApp?.id === app.id ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/20" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {app.user.photo_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <Image src={app.user.photo_url} alt={app.user.name} width={40} height={40} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">👤</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 truncate">{app.user.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sc.bg} ${sc.color}`}>
                                {sc.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {app.job_posting.title} • {JAPANESE_LABEL[app.user.japanese_level] ?? app.user.japanese_level}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 flex-shrink-0">
                            {new Date(app.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Application detail panel */}
            {selectedApp && (
              <div className="w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-20">
                  <div className="bg-[#1e3a5f] px-4 py-3 flex items-center justify-between">
                    <span className="text-white font-bold text-sm">応募者詳細</span>
                    <button onClick={() => setSelectedApp(null)} className="text-white/60 hover:text-white text-lg leading-none">×</button>
                  </div>
                  <div className="p-4 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
                    {/* Photo + Name */}
                    <div className="flex items-center gap-3">
                      {selectedApp.user.photo_url ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                          <Image src={selectedApp.user.photo_url} alt={selectedApp.user.name} width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900">{selectedApp.user.name}</h3>
                        <p className="text-xs text-slate-500">{selectedApp.job_posting.title}</p>
                      </div>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-1.5 text-sm">
                      {[
                        ["日本語", JAPANESE_LABEL[selectedApp.user.japanese_level] ?? selectedApp.user.japanese_level],
                        ["英語",   ENGLISH_LABEL[selectedApp.user.english_level] ?? selectedApp.user.english_level],
                        ["ビザ",   VISA_OPTIONS.find(v => v.value === selectedApp.user.visa_type)?.label ?? selectedApp.user.visa_type],
                        ["希望地", selectedApp.user.desired_prefecture ?? "—"],
                        ...(selectedApp.user.desired_salary ? [["希望給与", `¥${selectedApp.user.desired_salary.toLocaleString()}/${selectedApp.user.salary_type === "MONTHLY" ? "月" : "時間"}`]] : []),
                        ...(selectedApp.user.email ? [["メール", selectedApp.user.email]] : []),
                        ...(selectedApp.user.phone ? [["電話", selectedApp.user.phone]] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-slate-400 flex-shrink-0">{label}</span>
                          <span className="text-slate-700 font-medium text-right break-all">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Skills */}
                    {selectedApp.user.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1.5">スキル</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedApp.user.skills.map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {selectedApp.user.bio_ja && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">自己PR（日本語）</p>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{selectedApp.user.bio_ja}</p>
                      </div>
                    )}
                    {selectedApp.user.bio_en && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Self Introduction</p>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{selectedApp.user.bio_en}</p>
                      </div>
                    )}

                    {/* Status change */}
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">ステータス変更</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(STATUS_CONFIG) as AppStatus[]).map(s => {
                          const sc = STATUS_CONFIG[s]
                          const isActive = selectedApp.status === s
                          return (
                            <button
                              key={s}
                              disabled={isActive || updatingStatus === selectedApp.id}
                              onClick={() => handleStatusChange(selectedApp.id, s)}
                              className={`text-xs px-2 py-2 rounded-lg border font-medium transition-all ${
                                isActive
                                  ? `${sc.bg} ${sc.color} border-current`
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {isActive ? "✓ " : ""}{sc.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          Modal: 新規求人作成
      ═══════════════════════════════════════════════ */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowJobForm(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#1e3a5f] px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">新規求人作成</h2>
              <button onClick={() => setShowJobForm(false)} className="text-white/60 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">職種名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={e => { setJobForm(p => ({...p, title: e.target.value})); setJobFormErrors(p => ({...p, title: ""})) }}
                  placeholder="例：介護スタッフ・製造ラインオペレーター"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white ${jobFormErrors.title ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-blue-500 focus:border-transparent"}`}
                />
                {jobFormErrors.title && <p className="text-xs text-red-500 mt-1">⚠ {jobFormErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">業務内容</label>
                <textarea
                  value={jobForm.description}
                  onChange={e => setJobForm(p => ({...p, description: e.target.value}))}
                  rows={3}
                  placeholder="業務内容・職場環境・待遇などを記入してください"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">勤務地 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={e => { setJobForm(p => ({...p, location: e.target.value})); setJobFormErrors(p => ({...p, location: ""})) }}
                  placeholder="例：大阪府大阪市北区"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white ${jobFormErrors.location ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-blue-500 focus:border-transparent"}`}
                />
                {jobFormErrors.location && <p className="text-xs text-red-500 mt-1">⚠ {jobFormErrors.location}</p>}
              </div>

              {/* Salary */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">給与</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                    {(["MONTHLY","HOURLY"] as SalaryType[]).map(t => (
                      <button key={t} onClick={() => setJobForm(p => ({...p, salary_type: t}))}
                        className={`px-3 py-2 text-xs font-semibold transition-colors ${jobForm.salary_type === t ? "bg-[#1e3a5f] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                        {t === "MONTHLY" ? "月給" : "時給"}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[80px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">¥</span>
                    <input type="number" value={jobForm.salary_min} onChange={e => setJobForm(p => ({...p, salary_min: e.target.value}))}
                      placeholder="下限" className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <span className="text-slate-400 text-sm">〜</span>
                  <div className="relative flex-1 min-w-[80px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">¥</span>
                    <input type="number" value={jobForm.salary_max} onChange={e => setJobForm(p => ({...p, salary_max: e.target.value}))}
                      placeholder="上限" className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
              </div>

              {/* Required skills */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">必要スキル</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggleSkill(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${jobForm.required_skills.includes(s) ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                      {jobForm.required_skills.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accepted visas */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">受入可能ビザ</label>
                <div className="flex flex-wrap gap-2">
                  {VISA_OPTIONS.map(v => (
                    <button key={v.value} onClick={() => toggleVisa(v.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${jobForm.accepted_visas.includes(v.value) ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                      {jobForm.accepted_visas.includes(v.value) ? "✓ " : ""}{v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowJobForm(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  キャンセル
                </button>
                <button onClick={handleCreateJob} disabled={submittingJob}
                  className="flex-1 py-3 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  {submittingJob ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>作成中…</>
                  ) : "求人を作成する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
