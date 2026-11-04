import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: sessions } = await supabase
    .from('walk_sessions')
    .select('*, walk_session_dogs(dogs(name))')
    .eq('user_id', session.user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">산책 기록</h1>

      {!sessions || sessions.length === 0 ? (
        <p className="text-gray-400 text-center py-16">아직 완료된 산책이 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s: any) => {
            const started = new Date(s.started_at)
            const ended = new Date(s.ended_at)
            const minutes = Math.round((ended.getTime() - started.getTime()) / 60000)
            const dogs: string[] = s.walk_session_dogs?.map((wsd: any) => wsd.dogs?.name).filter(Boolean) ?? []

            return (
              <li key={s.id}>
                <Link
                  href={`/history/${s.id}`}
                  className="block rounded-xl border p-4 hover:bg-gray-50"
                >
                  <p className="font-medium">{started.toLocaleDateString('ko-KR')}</p>
                  <p className="text-sm text-gray-500">
                    {started.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · {minutes}분
                  </p>
                  {dogs.length > 0 && (
                    <p className="text-sm text-gray-400 mt-1">🐾 {dogs.join(', ')}</p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
