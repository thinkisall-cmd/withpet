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
import type { LiveLocation } from '@/types'

interface Point { lat: number; lng: number }

export default function MapPage() {
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [myUserId, setMyUserId] = useState('')
  const [myPosition, setMyPosition] = useState<Point | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LiveLocation | null>(null)
  const { session, startWalk, endWalk, elapsedSeconds } = useWalkSession()
  const [myRoute, setMyRoute] = useState<Point[]>([])
  const lastSentRef = useRef<Point | null>(null)
  const polylineRef = useRef<kakao.maps.Polyline | null>(null)
  const myMarkerRef = useRef<kakao.maps.Marker | null>(null)
  const nearbyWalkers = useLiveLocations(myUserId, myPosition)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) setMyUserId(session.user.id)
    })
  }, [])

  function handlePosition(pos: Point) {
    if (!session) return
    if (!shouldSendLocation(lastSentRef.current, pos)) return
    lastSentRef.current = pos
    setMyPosition(pos)

    fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.lat, lng: pos.lng, session_id: session.id }),
    })

    setMyRoute(prev => [...prev, pos])

    if (map) {
      const latLng = new kakao.maps.LatLng(pos.lat, pos.lng)
      if (!myMarkerRef.current) {
        myMarkerRef.current = new kakao.maps.Marker({ position: latLng, map, title: '나' })
      } else {
        myMarkerRef.current.setPosition(latLng)
      }
      map.setCenter(latLng)
    }
  }

  useBackgroundGeo(handlePosition, !!session)

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
