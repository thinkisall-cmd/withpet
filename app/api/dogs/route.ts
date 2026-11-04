import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Temperament } from '@/types'

const VALID_TEMPERAMENTS: Temperament[] = ['gentle', 'normal', 'caution']

export async function GET() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!VALID_TEMPERAMENTS.includes(body.temperament)) {
    return NextResponse.json({ error: 'invalid temperament' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('dogs')
    .insert({
      user_id: session.user.id,
      name: body.name.trim(),
      breed: body.breed?.trim() || null,
      temperament: body.temperament,
      photo_url: body.photo_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
