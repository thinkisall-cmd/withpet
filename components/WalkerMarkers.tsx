'use client'

import { useEffect, useRef } from 'react'
import type { LiveLocation } from '@/types'

interface Props {
  map: naver.maps.Map | null
  locations: LiveLocation[]
  onMarkerClick: (location: LiveLocation) => void
}

export default function WalkerMarkers({ map, locations, onMarkerClick }: Props) {
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map())

  useEffect(() => {
    if (!map) return

    const existing = markersRef.current
    const incomingIds = new Set(locations.map(l => l.user_id))

    // 사라진 마커 제거
    for (const [userId, marker] of existing) {
      if (!incomingIds.has(userId)) {
        marker.setMap(null)
        existing.delete(userId)
      }
    }

    // 추가/이동
    for (const loc of locations) {
      const pos = new naver.maps.LatLng(loc.lat, loc.lng)
      if (existing.has(loc.user_id)) {
        existing.get(loc.user_id)!.setPosition(pos)
      } else {
        const marker = new naver.maps.Marker({
          position: pos,
          map,
          title: loc.users?.nickname ?? '산책러',
          icon: {
            content: `<div style="background:#3b82f6;color:white;border-radius:999px;padding:4px 8px;font-size:12px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🐾 ${loc.users?.nickname ?? '산책러'}</div>`,
            anchor: new naver.maps.Point(0, 0),
          },
        })
        marker.addListener('click', () => onMarkerClick(loc))
        existing.set(loc.user_id, marker)
      }
    }
  }, [map, locations])

  // unmount 시 모든 마커 제거
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) marker.setMap(null)
      markersRef.current.clear()
    }
  }, [])

  return null
}
