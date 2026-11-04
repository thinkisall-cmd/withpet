'use client'

import { useRef } from 'react'
import Script from 'next/script'

interface Props {
  onMapReady: (map: kakao.maps.Map) => void
  className?: string
}

export default function KakaoMap({ onMapReady, className }: Props) {
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY

  function handleLoad() {
    kakao.maps.load(() => {
      if (mapRef.current || !containerRef.current) return
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 3,
      })
      onMapReady(mapRef.current)
    })
  }

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleLoad}
      />
      <div ref={containerRef} className={className ?? 'w-full h-full'} />
    </>
  )
}
