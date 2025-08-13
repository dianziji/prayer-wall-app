import { http, HttpResponse } from 'msw'
import { 
  createMockPrayer, 
  createMockPrayers, 
  createMockUserStats,
  createMockComment,
  createMockUser
} from '../../utils/factories'

// Define API handlers for MSW
export const handlers = [
  // Prayers API
  http.get('/api/prayers', ({ request }) => {
    const url = new URL(request.url)
    const week = url.searchParams.get('week')
    
    // Return mock prayers for the requested week
    const prayers = createMockPrayers(5, {
      created_at: week ? `${week}T10:00:00Z` : new Date().toISOString()
    })
    
    return HttpResponse.json(prayers)
  }),

  http.post('/api/prayers', async ({ request }) => {
    const body = await request.json() as any
    
    // Validate required fields
    if (!body.content || body.content.trim() === '') {
      return new HttpResponse(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400 }
      )
    }
    
    if (body.content.length > 500) {
      return new HttpResponse(
        JSON.stringify({ error: 'Content too long' }),
        { status: 400 }
      )
    }
    
    // Return created prayer
    const newPrayer = createMockPrayer({
      content: body.content,
      author_name: body.author_name || 'Anonymous'
    })
    
    return HttpResponse.json(newPrayer, { status: 201 })
  }),

  http.patch('/api/prayers', async ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const body = await request.json() as any
    
    if (!id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Prayer ID is required' }),
        { status: 400 }
      )
    }
    
    // Return updated prayer
    const updatedPrayer = createMockPrayer({
      id,
      content: body.content,
      author_name: body.author_name
    })
    
    return HttpResponse.json(updatedPrayer)
  }),

  http.delete('/api/prayers', ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Prayer ID is required' }),
        { status: 400 }
      )
    }
    
    return HttpResponse.json({ success: true })
  }),

  // User Stats API
  http.get('/api/user/stats', () => {
    const stats = createMockUserStats()
    return HttpResponse.json(stats)
  }),

  // User Prayers API
  http.get('/api/user/prayers', () => {
    const prayers = createMockPrayers(10)
    return HttpResponse.json(prayers)
  }),

  // Likes API
  http.post('/api/likes', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body.prayer_id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Prayer ID is required' }),
        { status: 400 }
      )
    }
    
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/likes', ({ request }) => {
    const url = new URL(request.url)
    const prayerId = url.searchParams.get('prayer_id')
    
    if (!prayerId) {
      return new HttpResponse(
        JSON.stringify({ error: 'Prayer ID is required' }),
        { status: 400 }
      )
    }
    
    return HttpResponse.json({ success: true })
  }),

  // Comments API
  http.get('/api/comments', ({ request }) => {
    const url = new URL(request.url)
    const prayerId = url.searchParams.get('prayer_id')
    
    if (!prayerId) {
      return HttpResponse.json([])
    }
    
    const comments = Array.from({ length: 3 }, (_, i) => 
      createMockComment({
        id: `comment-${i}`,
        prayer_id: prayerId,
        content: `Test comment ${i + 1}`
      })
    )
    
    return HttpResponse.json(comments)
  }),

  http.post('/api/comments', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body.content || !body.prayer_id) {
      return new HttpResponse(
        JSON.stringify({ error: 'Content and prayer ID are required' }),
        { status: 400 }
      )
    }
    
    const newComment = createMockComment({
      content: body.content,
      prayer_id: body.prayer_id
    })
    
    return HttpResponse.json(newComment, { status: 201 })
  }),

  // Auth endpoints
  http.get('/api/auth/user', () => {
    const user = createMockUser()
    return HttpResponse.json({ user })
  }),

  // Error handlers for testing error states
  http.get('/api/prayers/error', () => {
    return new HttpResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }),

  http.post('/api/prayers/unauthorized', () => {
    return new HttpResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    )
  })
]