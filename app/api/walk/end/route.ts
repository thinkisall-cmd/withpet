import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id } = await request.json()

  await supabase
    .from('walk_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', session_id)
    .eq('user_id', session.user.id)
    .is('ended_at', null)

  await supabase
    .from('live_locations')
    .delete()
    .eq('user_id', session.user.id)

  return NextResponse.json({ ok: true })
}
