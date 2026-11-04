import { redirect } from 'next/navigation'

// onboarding은 (app) 그룹 밖으로 이동 — 무한 리다이렉트 방지
export default function OldOnboarding() {
  redirect('/onboarding')
}
