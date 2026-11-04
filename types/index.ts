export type Temperament = 'gentle' | 'normal' | 'caution'

export interface Dog {
  id: string
  user_id: string
  name: string
  breed: string | null
  temperament: Temperament
  photo_url: string | null
  created_at: string
}

export interface WalkSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  route: Array<{ lat: number; lng: number; time: string }>
  share_token: string | null
}

export interface LiveLocation {
  user_id: string
  lat: number
  lng: number
  updated_at: string
  walk_session_id: string
  users?: { nickname: string }
  walk_sessions?: {
    started_at: string
    walk_session_dogs: Array<{ dogs: Dog }>
  }
}
