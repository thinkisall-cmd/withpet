'use client'

import { useState, useEffect, useRef } from 'react'
import type { WalkSession } from '@/types'

export function useWalkSession() {
  const [session, setSession] = useState<WalkSession | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startWalk(dogIds: string[]) {
    const res = await fetch('/api/walk/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_ids: dogIds }),
    })
    if (!res.ok) throw new Error(await res.text())
    const { session_id } = await res.json()
    const newSession: WalkSession = {
      id: session_id,
      user_id: '',
      started_at: new Date().toISOString(),
      ended_at: null,
      route: [],
      share_token: null,
    }
    setSession(newSession)
    setElapsedSeconds(0)
    intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
  }

  async function endWalk() {
    if (!session) return
    await fetch('/api/walk/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id }),
    })
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSession(null)
    setElapsedSeconds(0)
  }

  useEffect(() => {
    // appStateChange: background 전환 시 종료
    // shortcut: 프로세스 강제종료는 잡지 못함. Task 2 pg_cron이 5분 후 보완.
    let cleanup: (() => void) | undefined
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()
    if (isNative) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) endWalk()
        }).then(handle => {
          cleanup = () => handle.remove()
        })
      })
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      cleanup?.()
    }
  }, [])

  return { session, startWalk, endWalk, elapsedSeconds }
}
