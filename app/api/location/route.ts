import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lat, lng, session_id } = await request.json()
  const now = new Date().toISOString()

  await supabase.from('live_locations').upsert({
    user_id: session.user.id,
    lat,
    lng,
    updated_at: now,
    walk_session_id: session_id,
  })

  // append_route_point: DB 함수로 레이스 컨디션 없이 원자적 append
  await supabase.rpc('append_route_point', {
    session_id,
    uid: session.user.id,
    point: { lat, lng, time: now },
  })

  return NextResponse.json({ ok: true })
}
