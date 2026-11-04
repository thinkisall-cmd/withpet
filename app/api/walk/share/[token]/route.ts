import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// service_role key로 RLS 우회 — 공유 링크는 인증 없이 읽기 허용
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { data, error } = await adminClient
    .from('walk_sessions')
    .select('*, walk_session_dogs(dogs(*))')
    .eq('share_token', params.token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const dogs = data.walk_session_dogs?.map((wsd: any) => wsd.dogs) ?? []
  return NextResponse.json({ session: data, dogs })
}
