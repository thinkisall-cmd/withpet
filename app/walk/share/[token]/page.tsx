import NaverMap from '@/components/NaverMap'

interface Props {
  params: { token: string }
}

async function getSharedWalk(token: string) {
  // 절대 URL — 서버 컴포넌트에서 relative fetch는 불가
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/walk/share/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function SharedWalkPage({ params }: Props) {
  const data = await getSharedWalk(params.token)

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-400">링크가 유효하지 않습니다.</p>
      </main>
    )
  }

  const { session, dogs } = data
  const started = new Date(session.started_at)
  const ended = session.ended_at ? new Date(session.ended_at) : null
  const minutes = ended ? Math.round((ended.getTime() - started.getTime()) / 60000) : 0
  const route: Array<{ lat: number; lng: number }> = session.route ?? []

  function handleMapReady(map: naver.maps.Map) {
    if (route.length < 2) return
    new naver.maps.Polyline({
      map,
      path: route.map(p => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#6366f1',
      strokeWeight: 4,
    })
    map.setCenter(new naver.maps.LatLng(route[0].lat, route[0].lng))
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">공유된 산책 기록</h1>
        <p className="text-sm text-gray-500">{started.toLocaleDateString('ko-KR')} · {minutes}분</p>
        <p className="text-sm text-gray-400 mt-1">🐾 {dogs.map((d: any) => d.name).join(', ')}</p>
      </div>

      <div className="h-64">
        <NaverMap onMapReady={handleMapReady} className="h-64 w-full" />
      </div>
    </main>
  )
}
