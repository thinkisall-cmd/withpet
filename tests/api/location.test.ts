import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

const mockUpsert = vi.fn()
const mockRpc = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getSession: mockGetSession },
    from: () => ({ upsert: mockUpsert }),
    rpc: mockRpc,
  }),
}))

describe('POST /api/location', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
    mockRpc.mockResolvedValue({ error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { POST } = await import('@/app/api/location/route')
    const req = { json: async () => ({ lat: 37.5, lng: 127.0, session_id: 's1' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 and upserts live_location on valid request', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
    const { POST } = await import('@/app/api/location/route')
    const req = { json: async () => ({ lat: 37.5, lng: 127.0, session_id: 's1' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('append_route_point', expect.objectContaining({
      session_id: 's1',
      uid: 'user-1',
    }))
  })
})
