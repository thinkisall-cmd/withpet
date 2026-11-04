'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { haversineMeters } from '@/lib/distance'
import type { LiveLocation } from '@/types'

interface Point { lat: number; lng: number }

export function useLiveLocations(myUserId: string, myPosition: Point | null) {
  const [locations, setLocations] = useState<LiveLocation[]>([])

  useEffect(() => {
    const supabase = createClient()

    // 초기 로드
    supabase
      .from('live_locations')
      .select('*, users(nickname), walk_sessions(started_at, walk_session_dogs(dogs(*)))')
      .then(({ data }) => {
        if (data) setLocations(data as LiveLocation[])
      })

    const channel = supabase
      .channel('live_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_locations' },
        payload => {
          if (payload.eventType === 'DELETE') {
            setLocations(prev => prev.filter(l => l.user_id !== payload.old.user_id))
          } else {
            // INSERT or UPDATE — re-fetch joined data for this user
            supabase
              .from('live_locations')
              .select('*, users(nickname), walk_sessions(started_at, walk_session_dogs(dogs(*)))')
              .eq('user_id', payload.new.user_id)
              .single()
              .then(({ data }) => {
                if (!data) return
                setLocations(prev => {
                  const idx = prev.findIndex(l => l.user_id === data.user_id)
                  if (idx >= 0) {
                    const next = [...prev]
                    next[idx] = data as LiveLocation
                    return next
                  }
                  return [...prev, data as LiveLocation]
                })
              })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return locations.filter(loc => {
    if (loc.user_id === myUserId) return false
    if (!myPosition) return true
    return haversineMeters(myPosition, { lat: loc.lat, lng: loc.lng }) <= 1000
  })
}
