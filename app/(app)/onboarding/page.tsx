'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Dog } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'nickname' | 'dog'>('nickname')
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('users').upsert({ id: session.user.id, nickname: nickname.trim() })
    setSaving(false)
    setStep('dog')
  }

  function handleDogSaved(_dog: Dog) {
    router.push('/map')
  }

  if (step === 'nickname') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-bold">닉네임을 입력해주세요</h1>
        <form onSubmit={handleNickname} className="flex flex-col gap-3 w-full max-w-sm">
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="닉네임"
            className="rounded-lg border px-4 py-2"
            maxLength={20}
          />
          <button
            type="submit"
            disabled={saving || !nickname.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
          >
            다음
          </button>
        </form>
      </main>
    )
  }

  // step === 'dog': DogForm은 Task 4에서 완성, 임시 skip 버튼
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">강아지를 등록해주세요</h1>
      <p className="text-gray-500">강아지 등록 폼은 Task 4에서 완성됩니다</p>
      <button
        onClick={() => router.push('/map')}
        className="rounded-lg bg-gray-200 px-4 py-2"
      >
        나중에 하기
      </button>
    </main>
  )
}
