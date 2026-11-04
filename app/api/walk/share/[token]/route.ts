import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// service_role key로 RLS 우회 — 공유 링크는 인증 없이 읽기 허용
// 모듈 로드 시 초기화하면 빌드 시 키 없어서 에러 → 함수 호출 시 지연 초기화
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { data, error } = await getAdminClient()
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
