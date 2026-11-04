import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, action } = await request.json()

  const { data: walkSession } = await supabase
    .from('walk_sessions')
    .select('id, user_id')
    .eq('id', session_id)
    .single()

  if (!walkSession || walkSession.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (action === 'generate') {
    const token = crypto.randomUUID()
    const { data } = await supabase
      .from('walk_sessions')
      .update({ share_token: token })
      .eq('id', session_id)
      .select()
      .single()
    return NextResponse.json({ share_url: `/walk/share/${data?.share_token}` })
  }

  // revoke
  await supabase
    .from('walk_sessions')
    .update({ share_token: null })
    .eq('id', session_id)
    .select()
    .single()
  return NextResponse.json({ revoked: true })
}
