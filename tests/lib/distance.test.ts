import { describe, it, expect } from 'vitest'
import { haversineMeters, shouldSendLocation } from '@/lib/distance'

describe('haversineMeters', () => {
  it('returns <1 for same point', () => {
    expect(haversineMeters({ lat: 37.5, lng: 127.0 }, { lat: 37.5, lng: 127.0 })).toBeLessThan(1)
  })

  it('returns 900~1100 for ~1km apart', () => {
    const dist = haversineMeters({ lat: 37.5, lng: 127.0 }, { lat: 37.509, lng: 127.0 })
    expect(dist).toBeGreaterThan(900)
    expect(dist).toBeLessThan(1100)
  })
})

describe('shouldSendLocation', () => {
  it('returns true when prev is null', () => {
    expect(shouldSendLocation(null, { lat: 37.5, lng: 127.0 })).toBe(true)
  })

  it('returns false when distance < 5m', () => {
    expect(shouldSendLocation({ lat: 37.5, lng: 127.0 }, { lat: 37.500001, lng: 127.0 })).toBe(false)
  })

  it('returns true at exactly 5m boundary', () => {
    // 5m north ≈ 0.000045 degrees latitude
    expect(shouldSendLocation({ lat: 37.5, lng: 127.0 }, { lat: 37.500045, lng: 127.0 })).toBe(true)
  })
})
