import SharedWalkMap from './SharedWalkMap'

interface Props {
  params: { token: string }
}

async function getSharedWalk(token: string) {
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

  return (
    <main className="min-h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">공유된 산책 기록</h1>
        <p className="text-sm text-gray-500">{started.toLocaleDateString('ko-KR')} · {minutes}분</p>
        <p className="text-sm text-gray-400 mt-1">🐾 {dogs.map((d: any) => d.name).join(', ')}</p>
      </div>

      <div className="h-64">
        <SharedWalkMap route={session.route ?? []} />
      </div>
    </main>
  )
}
