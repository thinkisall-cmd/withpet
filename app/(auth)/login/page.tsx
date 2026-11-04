'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🐾 DogWalk</h1>
        <p className="mt-2 text-gray-500">동네 강아지 산책 실시간 위치 공유</p>
      </div>

      <button
        onClick={handleLogin}
        className="rounded-lg bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600"
      >
        구글로 시작하기
      </button>

      <p className="text-xs text-gray-400 text-center max-w-xs">
        서비스 이용 시 위치정보가 수집·이용됩니다.
      </p>
    </main>
  )
}
