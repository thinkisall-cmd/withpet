import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }),
  },
}))

const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getSession: mockGetSession },
    from: () => ({ select: mockSelect, update: mockUpdate }),
  }),
}))

describe('POST /api/walk/share', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  })

  it('returns 403 when session belongs to another user', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({ single: () => ({ data: { id: 's1', user_id: 'other-user' }, error: null }) }),
    })
    const { POST } = await import('@/app/api/walk/share/route')
    const req = { json: async () => ({ session_id: 's1', action: 'generate' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('generates share_token for own session', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({ single: () => ({ data: { id: 's1', user_id: 'user-1' }, error: null }) }),
    })
    mockUpdate.mockReturnValue({
      eq: () => ({ select: () => ({ single: () => ({ data: { share_token: 'tok-123' }, error: null }) }) }),
    })
    const { POST } = await import('@/app/api/walk/share/route')
    const req = { json: async () => ({ session_id: 's1', action: 'generate' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((res.body as any).share_url).toContain('/walk/share/')
  })

  it('revokes share_token when action=revoke', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({ single: () => ({ data: { id: 's1', user_id: 'user-1' }, error: null }) }),
    })
    mockUpdate.mockReturnValue({
      eq: () => ({ select: () => ({ single: () => ({ data: { share_token: null }, error: null }) }) }),
    })
    const { POST } = await import('@/app/api/walk/share/route')
    const req = { json: async () => ({ session_id: 's1', action: 'revoke' }) } as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((res.body as any).revoked).toBe(true)
  })
})
