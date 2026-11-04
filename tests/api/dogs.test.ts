import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server and supabase before importing the route
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getSession: mockGetSession },
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
    }),
  }),
}))

mockSelect.mockReturnValue({ eq: mockEq })
mockEq.mockReturnValue({ data: [], error: null })

describe('POST /api/dogs', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  })

  it('returns 400 when name is empty', async () => {
    const { POST } = await import('@/app/api/dogs/route')
    const req = { json: async () => ({ name: '', temperament: 'gentle' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when temperament is invalid', async () => {
    const { POST } = await import('@/app/api/dogs/route')
    const req = { json: async () => ({ name: '멍멍이', temperament: 'unknown' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
