import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DogWalk',
  description: '동네 강아지 산책 실시간 위치 공유',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
