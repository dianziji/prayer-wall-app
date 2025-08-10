import { http, HttpResponse } from 'msw'
import type { Prayer } from '@/types/models'

// Mock data
const mockPrayers: Prayer[] = [
  {
    id: 'prayer-1',
    content: 'Test prayer content',
    author_name: 'Test User',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    like_count: 5,
    liked_by_me: false,
  },
  {
    id: 'prayer-2', 
    content: 'Another prayer',
    author_name: 'Another User',
    user_id: 'user-2',
    created_at: new Date().toISOString(),
    like_count: 3,
    liked_by_me: true,
  }
]

export const handlers = [
  // GET /api/prayers
  http.get('/api/prayers', () => {
    return HttpResponse.json(mockPrayers)
  }),

  // POST /api/prayers
  http.post('/api/prayers', async ({ request }) => {
    const body = await request.json() as { content: string; author_name: string }
    return HttpResponse.json({ success: true })
  }),

  // PATCH /api/prayers
  http.patch('/api/prayers', async ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const body = await request.json() as { content: string; author_name: string }

    if (!id) {
      return HttpResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Mock authentication check
    if (id === 'prayer-unauthorized') {
      return HttpResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Mock week check
    if (id === 'prayer-old') {
      return HttpResponse.json({ error: 'Can only edit current week prayers' }, { status: 400 })
    }

    return HttpResponse.json({ success: true })
  }),

  // DELETE /api/prayers
  http.delete('/api/prayers', async ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return HttpResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Mock authentication check
    if (id === 'prayer-unauthorized') {
      return HttpResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Mock week check
    if (id === 'prayer-old') {
      return HttpResponse.json({ error: 'Can only delete current week prayers' }, { status: 400 })
    }

    return HttpResponse.json({ success: true })
  }),
]