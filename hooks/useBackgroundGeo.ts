'use client'

import { useEffect, useRef } from 'react'

interface Position { lat: number; lng: number }

export function useBackgroundGeo(
  onPosition: (pos: Position) => void,
  active: boolean
) {
  const watchIdRef = useRef<number | null>(null)
  const watcherIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!active) {
      // 감시 중단
      if (watcherIdRef.current) {
        import('@capacitor-community/background-geolocation').then(({ BackgroundGeolocation }) => {
          BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current! })
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
      import('@capacitor-community/background-geolocation').then(({ BackgroundGeolocation }) => {
        BackgroundGeolocation.addWatcher(
          { backgroundMessage: '산책 중...', distanceFilter: 10 },
          (pos, err) => {
            if (pos) onPosition({ lat: pos.latitude, lng: pos.longitude })
          }
        ).then(id => { watcherIdRef.current = id })
      })
    } else {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => onPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watcherIdRef.current) {
        import('@capacitor-community/background-geolocation').then(({ BackgroundGeolocation }) => {
          BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current! })
        })
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [active])
}
