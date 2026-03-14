"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function CompanyLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError("メールアドレスとパスワードを入力してください"); return }
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError("メールアドレスまたはパスワードが正しくありません")
    } else {
      router.push("/company/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#1e3a5f] text-white px-6 py-4">
        <Link href="/" className="font-black text-lg tracking-tight">KUMIKOJEM</Link>
        <span className="ml-3 text-blue-200 text-sm">企業向けポータル</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a5f] text-white text-2xl mb-4">🏢</div>
            <h1 className="text-2xl font-black text-slate-900">企業ログイン</h1>
            <p className="text-slate-500 text-sm mt-1">求人管理・応募者確認はこちらから</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.co.jp"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  ログイン中…
                </>
              ) : "ログイン →"}
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-400 mt-2">
                デモ: <code className="bg-slate-100 px-1 rounded">demo@company.jp</code> / <code className="bg-slate-100 px-1 rounded">demo1234</code>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
