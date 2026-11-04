interface Point { lat: number; lng: number }

const R = 6371000 // Earth radius in meters

export function haversineMeters(a: Point, b: Point): number {
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const c = sinDLat * sinDLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

export function shouldSendLocation(prev: Point | null, curr: Point): boolean {
  if (!prev) return true
  return haversineMeters(prev, curr) >= 5
}
