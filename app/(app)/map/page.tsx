'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import KakaoMap from '@/components/KakaoMap'
import WalkControls from '@/components/WalkControls'
import WalkerMarkers from '@/components/WalkerMarkers'
import DogBottomSheet from '@/components/DogBottomSheet'
import { useWalkSession } from '@/hooks/useWalkSession'
import { useBackgroundGeo } from '@/hooks/useBackgroundGeo'
import { useLiveLocations } from '@/hooks/useLiveLocations'
import { shouldSendLocation } from '@/lib/distance'
import Link from 'next/link'
import type { LiveLocation } from '@/types'

interface Point { lat: number; lng: number }

export default function MapPage() {
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [myUserId, setMyUserId] = useState('')
  const [nickname, setNickname] = useState('')
  const [myPosition, setMyPosition] = useState<Point | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LiveLocation | null>(null)
  const { session, startWalk, endWalk, elapsedSeconds } = useWalkSession()
  const [myRoute, setMyRoute] = useState<Point[]>([])
  const lastSentRef = useRef<Point | null>(null)
  const polylineRef = useRef<kakao.maps.Polyline | null>(null)
  const myMarkerRef = useRef<kakao.maps.Marker | null>(null)
  const nearbyWalkers = useLiveLocations(myUserId, myPosition)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setMyUserId(session.user.id)
      const { data } = await supabase.from('users').select('nickname').eq('id', session.user.id).single()
      if (data?.nickname) setNickname(data.nickname)
    })
  }, [])

  function handlePosition(pos: Point) {
    setMyPosition(pos)
    if (map) {
      const latLng = new kakao.maps.LatLng(pos.lat, pos.lng)
      if (!myMarkerRef.current) {
        myMarkerRef.current = new kakao.maps.Marker({ position: latLng, map, title: '나' })
      } else {
        myMarkerRef.current.setPosition(latLng)
      }
      map.setCenter(latLng)
    }

    if (!session) return
    if (!shouldSendLocation(lastSentRef.current, pos)) return
    lastSentRef.current = pos

    fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.lat, lng: pos.lng, session_id: session.id }),
    })

    setMyRoute(prev => [...prev, pos])
  }

  useBackgroundGeo(handlePosition, true)

  useEffect(() => {
    if (!map || myRoute.length < 2) return
    polylineRef.current?.setMap(null)
    polylineRef.current = new kakao.maps.Polyline({
      map,
      path: myRoute.map(p => new kakao.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#6366f1',
      strokeWeight: 4,
      strokeOpacity: 0.8,
    })
  }, [myRoute, map])

  async function handleEndWalk() {
    await endWalk()
    polylineRef.current?.setMap(null)
    polylineRef.current = null
    myMarkerRef.current?.setMap(null)
    myMarkerRef.current = null
    setMyRoute([])
    lastSentRef.current = null
    setMyPosition(null)
  }

  return (
    <div className="relative h-screen w-full">
      <KakaoMap onMapReady={setMap} className="h-full w-full" />
      {/* 상단 바 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm">
        <span className="font-semibold text-gray-800">{nickname || '...'}</span>
        <div className="flex items-center gap-3">
          <Link href="/history" className="text-sm text-blue-500 font-medium">산책 기록</Link>
          <button
            onClick={() => createClient().auth.signOut().then(() => window.location.href = '/login')}
            className="text-sm text-gray-400"
          >
            로그아웃
          </button>
        </div>
      </div>
      <WalkerMarkers
        map={map}
        locations={nearbyWalkers}
        onMarkerClick={setSelectedLocation}
      />
      <DogBottomSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
      <WalkControls
        session={session}
        elapsedSeconds={elapsedSeconds}
        onStart={startWalk}
        onEnd={handleEndWalk}
      />
    </div>
  )
}
