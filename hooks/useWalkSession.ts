'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WalkSession } from '@/types'

function startTimer(intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>, startedAt: string, setElapsedSeconds: (fn: (s: number) => number) => void) {
  if (intervalRef.current) clearInterval(intervalRef.current)
  const base = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  setElapsedSeconds(() => base)
  intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
}

export function useWalkSession() {
  const [session, setSession] = useState<WalkSession | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 마운트 시 진행 중인 세션 복원
  useEffect(() => {
    createClient()
      .from('walk_sessions')
      .select('*')
      .is('ended_at', null)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSession(data as WalkSession)
          startTimer(intervalRef, data.started_at, setElapsedSeconds)
        }
      })
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  async function startWalk(dogIds: string[]) {
    const res = await fetch('/api/walk/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_ids: dogIds }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      // 이미 산책 중이면 기존 세션 복원
      if (body.error === 'already walking') {
        const { data } = await createClient().from('walk_sessions').select('*').is('ended_at', null).maybeSingle()
        if (data) { setSession(data as WalkSession); startTimer(intervalRef, data.started_at, setElapsedSeconds) }
        return
      }
      throw new Error(JSON.stringify(body))
    }
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
    startTimer(intervalRef, newSession.started_at, setElapsedSeconds)
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
    // appStateChange 리스너 — 세션 복원 useEffect와 별도
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
