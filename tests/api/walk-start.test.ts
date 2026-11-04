import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getSession: mockGetSession },
    from: (table: string) => ({
      select: mockSelect,
      insert: mockInsert,
    }),
  }),
}))

describe('POST /api/walk/start', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  })

  it('returns 400 when dog_ids is empty array', async () => {
    const { POST } = await import('@/app/api/walk/start/route')
    const req = { json: async () => ({ dog_ids: [] }) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when already walking', async () => {
    // existing active session
    mockSelect.mockReturnValue({
      eq: () => ({ is: () => ({ data: [{ id: 'existing-session' }], error: null }) }),
    })
    const { POST } = await import('@/app/api/walk/start/route')
    const req = { json: async () => ({ dog_ids: ['dog-1'] }) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 with session_id on success', async () => {
    // no existing active session
    mockSelect.mockReturnValue({
      eq: () => ({ is: () => ({ data: [], error: null }) }),
    })
    mockInsert.mockReturnValue({
      select: () => ({ single: () => ({ data: { id: 'new-session' }, error: null }) }),
    })
    const { POST } = await import('@/app/api/walk/start/route')
    const req = { json: async () => ({ dog_ids: ['dog-1'] }) } as any
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
