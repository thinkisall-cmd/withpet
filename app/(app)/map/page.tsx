'use client'

import { useState } from 'react'
import NaverMap from '@/components/NaverMap'

export default function MapPage() {
  const [map, setMap] = useState<naver.maps.Map | null>(null)

  return (
    <div className="relative h-screen w-full">
      <NaverMap onMapReady={setMap} className="h-full w-full" />
    </div>
  )
}
