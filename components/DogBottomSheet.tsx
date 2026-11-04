'use client'

import type { LiveLocation, Temperament } from '@/types'

const TEMPERAMENT_STYLE: Record<Temperament, { label: string; bg: string; color: string }> = {
  gentle: { label: '온순', bg: '#dcfce7', color: '#22c55e' },
  normal: { label: '보통', bg: '#fef9c3', color: '#eab308' },
  caution: { label: '주의필요', bg: '#fee2e2', color: '#ef4444' },
}

interface Props {
  location: LiveLocation | null
  onClose: () => void
}

export default function DogBottomSheet({ location, onClose }: Props) {
  if (!location) return null

  const dogs = location.walk_sessions?.walk_session_dogs?.map(wsd => wsd.dogs) ?? []
  const startedAt = location.walk_sessions?.started_at
  const minutesWalking = startedAt
    ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
    : 0

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 shadow-2xl z-40 max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{location.users?.nickname ?? '산책러'}</h2>
        <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
      </div>

      <p className="text-sm text-gray-500 mb-4">산책 {minutesWalking}분째</p>

      {dogs.length === 0 ? (
        <p className="text-gray-400">강아지 정보 없음</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {dogs.map(dog => {
            const tStyle = TEMPERAMENT_STYLE[dog.temperament]
            return (
              <li key={dog.id} className="flex items-center gap-3">
                {dog.photo_url ? (
                  <img src={dog.photo_url} alt={dog.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🐶</div>
                )}
                <div>
                  <p className="font-medium">{dog.name}</p>
                  {dog.breed && <p className="text-sm text-gray-500">{dog.breed}</p>}
                  <span
                    className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: tStyle.bg, color: tStyle.color }}
                  >
                    {tStyle.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
