import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import HistoryDetail from './HistoryDetail'

export default async function HistoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: walkSession } = await supabase
    .from('walk_sessions')
    .select('*, walk_session_dogs(dogs(*))')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!walkSession) redirect('/history')

  return <HistoryDetail walkSession={walkSession} />
}
