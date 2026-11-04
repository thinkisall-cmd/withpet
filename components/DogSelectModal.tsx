'use client'

import { useState, useEffect } from 'react'
import type { Dog } from '@/types'

interface Props {
  onConfirm: (dogIds: string[]) => void
  onCancel: () => void
}

export default function DogSelectModal({ onConfirm, onCancel }: Props) {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dogs')
      .then(r => r.json())
      .then(data => { setDogs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">오늘 나온 강아지를 선택하세요</h2>

        {loading ? (
          <p className="text-gray-400 text-center py-4">불러오는 중...</p>
        ) : dogs.length === 0 ? (
          <p className="text-gray-400 text-center py-4">등록된 강아지가 없습니다</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-4">
            {dogs.map(dog => (
              <li key={dog.id}>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(dog.id)}
                    onChange={() => toggle(dog.id)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{dog.name}</span>
                  {dog.breed && <span className="text-sm text-gray-400">{dog.breed}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border py-2">취소</button>
          <button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selected.size === 0}
            className="flex-1 rounded-lg bg-blue-500 py-2 text-white disabled:opacity-50"
          >
            산책 시작
          </button>
        </div>
      </div>
    </div>
  )
}
