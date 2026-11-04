'use client'

import { useEffect, useRef } from 'react'
import type { LiveLocation } from '@/types'

interface Props {
  map: kakao.maps.Map | null
  locations: LiveLocation[]
  onMarkerClick: (location: LiveLocation) => void
}

export default function WalkerMarkers({ map, locations, onMarkerClick }: Props) {
  const overlaysRef = useRef<Map<string, kakao.maps.CustomOverlay>>(new Map())
  // onMarkerClick 최신값 유지 (closure 문제 방지)
  const clickRef = useRef(onMarkerClick)
  clickRef.current = onMarkerClick

  useEffect(() => {
    if (!map) return

    const existing = overlaysRef.current
    const incomingIds = new Set(locations.map(l => l.user_id))

    // 사라진 오버레이 제거
    for (const [userId, overlay] of existing) {
      if (!incomingIds.has(userId)) {
        overlay.setMap(null)
        existing.delete(userId)
      }
    }

    // 추가/이동
    for (const loc of locations) {
      const pos = new kakao.maps.LatLng(loc.lat, loc.lng)
      if (existing.has(loc.user_id)) {
        existing.get(loc.user_id)!.setPosition(pos)
      } else {
        const content = document.createElement('div')
        content.style.cssText = 'background:#3b82f6;color:white;border-radius:999px;padding:4px 8px;font-size:12px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer'
        content.textContent = `🐾 ${loc.users?.nickname ?? '산책러'}`
        content.addEventListener('click', () => clickRef.current(loc))

        const overlay = new kakao.maps.CustomOverlay({ position: pos, content, map, zIndex: 3 })
        existing.set(loc.user_id, overlay)
      }
    }
  }, [map, locations])

  useEffect(() => {
    return () => {
      for (const overlay of overlaysRef.current.values()) overlay.setMap(null)
      overlaysRef.current.clear()
    }
  }, [])

  return null
}
