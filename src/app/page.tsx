"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="text-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            🤝 KUMIKOJEM
          </h1>
          <p className="text-blue-200 text-lg">
            フィリピン人材 × 日本企業マッチング
          </p>
          <p className="text-blue-300 text-sm mt-1">
            Filipino Talent × Japanese Company Matching
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* 企業向け */}
          <button
            onClick={() => router.push("/company/login")}
            className="w-full bg-white text-blue-900 font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-blue-50 active:scale-95 transition-all duration-150 flex items-center justify-between"
          >
            <span className="text-2xl">🏢</span>
            <span className="flex-1 text-left ml-4">
              <span className="block text-lg">企業の方はこちら</span>
              <span className="block text-sm font-normal text-blue-600">求人掲載・人材マッチング</span>
            </span>
            <span className="text-blue-400 text-xl">→</span>
          </button>

          {/* 求職者向け */}
          <button
            onClick={() => router.push("/talent")}
            className="w-full bg-yellow-400 text-blue-900 font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-yellow-300 active:scale-95 transition-all duration-150 flex items-center justify-between"
          >
            <span className="text-2xl">🇵🇭</span>
            <span className="flex-1 text-left ml-4">
              <span className="block text-lg">Find Jobs in Japan</span>
              <span className="block text-sm font-normal text-blue-700">For Filipino Talent</span>
            </span>
            <span className="text-blue-600 text-xl">→</span>
          </button>

          {/* 管理者 */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-white/10 text-white font-semibold py-3 px-6 rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>⚙️</span>
            <span className="text-sm">管理者ダッシュボード</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-blue-400 text-xs mt-10">
          © 2025 Follow Up Co., Ltd. — An Home Kansai
        </p>
      </div>
    </main>
  );
}
