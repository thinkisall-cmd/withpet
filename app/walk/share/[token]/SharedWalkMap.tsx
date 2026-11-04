'use client'

import KakaoMap from '@/components/KakaoMap'

interface Props {
  route: Array<{ lat: number; lng: number }>
}

export default function SharedWalkMap({ route }: Props) {
  function handleMapReady(map: kakao.maps.Map) {
    if (route.length < 2) return
    new kakao.maps.Polyline({
      map,
      path: route.map(p => new kakao.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#6366f1',
      strokeWeight: 4,
      strokeOpacity: 0.8,
    })
    map.setCenter(new kakao.maps.LatLng(route[0].lat, route[0].lng))
  }

  return <KakaoMap onMapReady={handleMapReady} className="h-64 w-full" />
}
