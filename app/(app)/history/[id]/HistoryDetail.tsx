'use client'

import { useState, useEffect } from 'react'
import NaverMap from '@/components/NaverMap'

interface Props {
  walkSession: any
}

export default function HistoryDetail({ walkSession }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(
    walkSession.share_token ? `/walk/share/${walkSession.share_token}` : null
  )
  const [copied, setCopied] = useState(false)

  async function generateLink() {
    const res = await fetch('/api/walk/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: walkSession.id, action: 'generate' }),
    })
    const { share_url } = await res.json()
    setShareUrl(share_url)
    await navigator.clipboard.writeText(window.location.origin + share_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function revokeLink() {
    await fetch('/api/walk/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: walkSession.id, action: 'revoke' }),
    })
    setShareUrl(null)
  }

  function handleMapReady(map: naver.maps.Map) {
    const route: Array<{ lat: number; lng: number }> = walkSession.route ?? []
    if (route.length < 2) return
    new naver.maps.Polyline({
      map,
      path: route.map(p => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#6366f1',
      strokeWeight: 4,
    })
    map.setCenter(new naver.maps.LatLng(route[0].lat, route[0].lng))
  }

  const dogs = walkSession.walk_session_dogs?.map((wsd: any) => wsd.dogs).filter(Boolean) ?? []
  const started = new Date(walkSession.started_at)
  const ended = walkSession.ended_at ? new Date(walkSession.ended_at) : null
  const minutes = ended ? Math.round((ended.getTime() - started.getTime()) / 60000) : 0

  return (
    <main className="min-h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">{started.toLocaleDateString('ko-KR')}</h1>
        <p className="text-sm text-gray-500">{minutes}분 · 🐾 {dogs.map((d: any) => d.name).join(', ')}</p>
      </div>

      <div className="flex-1 min-h-64">
        <NaverMap onMapReady={handleMapReady} className="h-64 w-full" />
      </div>

      <div className="p-4 flex flex-col gap-3">
        {shareUrl ? (
          <>
            <p className="text-sm text-gray-500 break-all">{window?.location?.origin}{shareUrl}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.origin + shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex-1 rounded-lg border py-2 text-sm"
              >
                {copied ? '복사됨!' : '링크 복사'}
              </button>
              <button onClick={revokeLink} className="flex-1 rounded-lg border border-red-300 py-2 text-sm text-red-500">
                링크 삭제
              </button>
            </div>
          </>
        ) : (
          <button onClick={generateLink} className="w-full rounded-lg bg-blue-500 py-3 text-white font-medium">
            공유 링크 생성
          </button>
        )}
      </div>
    </main>
  )
}
