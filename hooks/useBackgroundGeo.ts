'use client'

import { useEffect, useRef } from 'react'

interface Position { lat: number; lng: number }

// Capacitor 네이티브 플러그인 — TypeScript는 타입 불일치, any로 처리
async function getBgGeo(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (await import('@capacitor-community/background-geolocation' as any)) as any
}

export function useBackgroundGeo(
  onPosition: (pos: Position) => void,
  active: boolean
) {
  const watchIdRef = useRef<number | null>(null)
  const watcherIdRef = useRef<string | null>(null)
  // stale closure 방지: 항상 최신 콜백 참조
  const onPositionRef = useRef(onPosition)
  onPositionRef.current = onPosition

  useEffect(() => {
    if (!active) {
      if (watcherIdRef.current) {
        getBgGeo().then((mod: any) => {
          ;(mod.default ?? mod).removeWatcher({ id: watcherIdRef.current! })
          watcherIdRef.current = null
        })
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()

    if (isNative) {
      getBgGeo().then((mod: any) => {
        const BgGeo = mod.default ?? mod
        BgGeo.addWatcher(
          { backgroundMessage: '산책 중...', distanceFilter: 10 },
          (pos: any) => {
            if (pos) onPositionRef.current({ lat: pos.latitude, lng: pos.longitude })
          }
        ).then((id: string) => { watcherIdRef.current = id })
      })
    } else {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => onPositionRef.current({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          if (err.code === 1) alert('위치 권한이 거부됐습니다. 브라우저 주소창 옆 자물쇠 아이콘을 눌러 위치 권한을 허용해주세요.')
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
      )
    }

    return () => {
      if (watcherIdRef.current) {
        getBgGeo().then((mod: any) => {
          ;(mod.default ?? mod).removeWatcher({ id: watcherIdRef.current! })
        })
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [active])
}
