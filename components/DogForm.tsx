'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Dog, Temperament } from '@/types'

const TEMPERAMENT_LABELS: Record<Temperament, { label: string; color: string }> = {
  gentle: { label: '온순', color: '#22c55e' },
  normal: { label: '보통', color: '#eab308' },
  caution: { label: '주의필요', color: '#ef4444' },
}

interface Props {
  onSaved: (dog: Dog) => void
  initialDog?: Dog
}

export default function DogForm({ onSaved, initialDog }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(initialDog?.name ?? '')
  const [breed, setBreed] = useState(initialDog?.breed ?? '')
  const [temperament, setTemperament] = useState<Temperament>(initialDog?.temperament ?? 'normal')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('강아지 이름을 입력해주세요'); return }
    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('로그인이 필요합니다')

      let photo_url = initialDog?.photo_url ?? null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const dogId = initialDog?.id ?? crypto.randomUUID()
        const path = `${session.user.id}/${dogId}.${ext}`
        await supabase.storage.from('dog-photos').upload(path, photoFile, { upsert: true })
        photo_url = supabase.storage.from('dog-photos').getPublicUrl(path).data.publicUrl
      }

      const res = await fetch('/api/dogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), breed: breed.trim() || null, temperament, photo_url }),
      })
      if (!res.ok) throw new Error(await res.text())
      const dog: Dog = await res.json()
      onSaved(dog)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1">강아지 이름 *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          maxLength={30}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">견종</label>
        <input
          type="text"
          value={breed}
          onChange={e => setBreed(e.target.value)}
          placeholder="예: 말티즈, 포메라니안"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">성격</label>
        <div className="flex gap-2">
          {(Object.keys(TEMPERAMENT_LABELS) as Temperament[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTemperament(t)}
              className="flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors"
              style={temperament === t ? { borderColor: TEMPERAMENT_LABELS[t].color, color: TEMPERAMENT_LABELS[t].color } : {}}
            >
              {TEMPERAMENT_LABELS[t].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">사진</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white font-medium disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
