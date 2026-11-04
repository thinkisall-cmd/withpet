import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dog_ids } = await request.json()

  if (!Array.isArray(dog_ids) || dog_ids.length === 0) {
    return NextResponse.json({ error: 'dog_ids must be a non-empty array' }, { status: 400 })
  }

  // 이미 산책 중인지 확인
  const { data: existing } = await supabase
    .from('walk_sessions')
    .select('id')
    .eq('user_id', session.user.id)
    .is('ended_at', null)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'already walking' }, { status: 400 })
  }

  const { data: walkSession, error } = await supabase
    .from('walk_sessions')
    .insert({ user_id: session.user.id, started_at: new Date().toISOString() })
    .select()
    .single()

  if (error || !walkSession) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create session' }, { status: 500 })
  }

  await supabase.from('walk_session_dogs').insert(
    dog_ids.map((dog_id: string) => ({ walk_session_id: walkSession.id, dog_id }))
  )

  // live_locations는 첫 /api/location 호출 시 최초 upsert
  return NextResponse.json({ session_id: walkSession.id }, { status: 201 })
}
