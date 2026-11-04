'use client'

import { useState } from 'react'
import DogSelectModal from './DogSelectModal'

interface Props {
  session: { id: string } | null
  elapsedSeconds: number
  onStart: (dogIds: string[]) => Promise<void>
  onEnd: () => Promise<void>
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}분 ${s}초`
}

export default function WalkControls({ session, elapsedSeconds, onStart, onEnd }: Props) {
  const [showModal, setShowModal] = useState(false)

  async function handleConfirm(dogIds: string[]) {
    setShowModal(false)
    await onStart(dogIds)
  }

  if (session) {
    return (
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 px-6">
        <span className="bg-white rounded-full px-4 py-1 text-sm shadow">{formatTime(elapsedSeconds)}</span>
        <button
          onClick={onEnd}
          className="w-full max-w-sm rounded-xl bg-red-500 py-4 text-white text-lg font-bold shadow-lg"
        >
          산책 종료
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button
          onClick={() => setShowModal(true)}
          className="w-full max-w-sm mx-auto block rounded-xl bg-blue-500 py-4 text-white text-lg font-bold shadow-lg"
        >
          산책 시작
        </button>
      </div>
      {showModal && (
        <DogSelectModal
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}
