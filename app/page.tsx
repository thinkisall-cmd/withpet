import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: user } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', session.user.id)
    .single()

  if (!user?.nickname) redirect('/onboarding')

  redirect('/map')
}
