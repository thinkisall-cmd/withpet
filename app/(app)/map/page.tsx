'use client'

import { useState, useRef, useEffect } from 'react'
import NaverMap from '@/components/NaverMap'
import WalkControls from '@/components/WalkControls'
import { useWalkSession } from '@/hooks/useWalkSession'
import { useBackgroundGeo } from '@/hooks/useBackgroundGeo'
import { shouldSendLocation } from '@/lib/distance'

interface Point { lat: number; lng: number }

export default function MapPage() {
  const [map, setMap] = useState<naver.maps.Map | null>(null)
  const { session, startWalk, endWalk, elapsedSeconds } = useWalkSession()
  const [myRoute, setMyRoute] = useState<Point[]>([])
  const lastSentRef = useRef<Point | null>(null)
  const polylineRef = useRef<naver.maps.Polyline | null>(null)
  const myMarkerRef = useRef<naver.maps.Marker | null>(null)

  function handlePosition(pos: Point) {
    if (!session) return
    if (!shouldSendLocation(lastSentRef.current, pos)) return
    lastSentRef.current = pos

    fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.lat, lng: pos.lng, session_id: session.id }),
    })

    setMyRoute(prev => [...prev, pos])

    // 내 마커 이동
    if (map) {
      const latLng = new naver.maps.LatLng(pos.lat, pos.lng)
      if (!myMarkerRef.current) {
        myMarkerRef.current = new naver.maps.Marker({ position: latLng, map, title: '나' })
      } else {
        myMarkerRef.current.setPosition(latLng)
      }
      map.setCenter(latLng)
    }
  }

  useBackgroundGeo(handlePosition, !!session)

  // 폴리라인 그리기
  useEffect(() => {
    if (!map || myRoute.length < 2) return
    polylineRef.current?.setMap(null)
    polylineRef.current = new naver.maps.Polyline({
      map,
      path: myRoute.map(p => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#6366f1',
      strokeWeight: 4,
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
  }

  return (
    <div className="relative h-screen w-full">
      <NaverMap onMapReady={setMap} className="h-full w-full" />
      <WalkControls
        session={session}
        elapsedSeconds={elapsedSeconds}
        onStart={startWalk}
        onEnd={handleEndWalk}
      />
    </div>
  )
}
