'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface Props {
  onMapReady: (map: naver.maps.Map) => void
  className?: string
}

export default function NaverMap({ onMapReady, className }: Props) {
  const mapRef = useRef<naver.maps.Map | null>(null)
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

  function initMap() {
    if (mapRef.current) return
    mapRef.current = new naver.maps.Map('naver-map', {
      center: new naver.maps.LatLng(37.5665, 126.9780),
      zoom: 15,
    })
    onMapReady(mapRef.current)
  }

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div id="naver-map" className={className ?? 'w-full h-full'} />
    </>
  )
}
