import { rest } from 'msw'
import { 
  createMockPrayer, 
  createMockPrayers, 
  createMockUserStats,
  createMockComment,
  createMockUser
} from '../../utils/factories'

// Define API handlers for MSW v1.3.0
export const handlers = [
  // Prayers API
  rest.get('/api/prayers', (req, res, ctx) => {
    const url = new URL(req.url)
    const week = url.searchParams.get('week')
    
    // Return mock prayers for the requested week
    const prayers = createMockPrayers(5, {
      created_at: week ? `${week}T10:00:00Z` : new Date().toISOString()
    })
    
    return res(ctx.json(prayers))
  }),

  rest.post('/api/prayers', async (req, res, ctx) => {
    const body = await req.json()
    
    // Validate required fields
    if (!body.content || body.content.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Content is required' })
      )
    }
    
    if (body.content.length > 500) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Content too long' })
      )
    }
    
    // Return created prayer
    const newPrayer = createMockPrayer({
      content: body.content,
      author_name: body.author_name || 'Anonymous'
    })
    
    return res(ctx.status(201), ctx.json(newPrayer))
  }),

  rest.patch('/api/prayers', async (req, res, ctx) => {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const body = await req.json()
    
    if (!id) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Prayer ID is required' })
      )
    }
    
    // Return updated prayer
    const updatedPrayer = createMockPrayer({
      id,
      content: body.content,
      author_name: body.author_name
    })
    
    return res(ctx.json(updatedPrayer))
  }),

  rest.delete('/api/prayers', (req, res, ctx) => {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Prayer ID is required' })
      )
    }
    
    return res(ctx.json({ success: true }))
  }),

  // User Stats API
  rest.get('/api/user/stats', (_req, res, ctx) => {
    const stats = createMockUserStats()
    return res(ctx.json(stats))
  }),

  // User Prayers API
  rest.get('/api/user/prayers', (_req, res, ctx) => {
    const prayers = createMockPrayers(10)
    return res(ctx.json(prayers))
  }),

  // Likes API
  rest.post('/api/likes', async (req, res, ctx) => {
    const body = await req.json()
    
    if (!body.prayer_id) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Prayer ID is required' })
      )
    }
    
    return res(ctx.json({ success: true }))
  }),

  rest.delete('/api/likes', (req, res, ctx) => {
    const url = new URL(req.url)
    const prayerId = url.searchParams.get('prayer_id')
    
    if (!prayerId) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Prayer ID is required' })
      )
    }
    
    return res(ctx.json({ success: true }))
  }),

  // Comments API
  rest.get('/api/comments', (req, res, ctx) => {
    const url = new URL(req.url)
    const prayerId = url.searchParams.get('prayer_id')
    
    if (!prayerId) {
      return res(ctx.json([]))
    }
    
    const comments = Array.from({ length: 3 }, (_, i) => 
      createMockComment({
        id: `comment-${i}`,
        prayer_id: prayerId,
        content: `Test comment ${i + 1}`
      })
    )
    
    return res(ctx.json(comments))
  }),

  rest.post('/api/comments', async (req, res, ctx) => {
    const body = await req.json()
    
    if (!body.content || !body.prayer_id) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Content and prayer ID are required' })
      )
    }
    
    const newComment = createMockComment({
      content: body.content,
      prayer_id: body.prayer_id
    })
    
    return res(ctx.status(201), ctx.json(newComment))
  }),

  // Auth endpoints
  rest.get('/api/auth/user', (_req, res, ctx) => {
    const user = createMockUser()
    return res(ctx.json({ user }))
  }),

  // Error handlers for testing error states
  rest.get('/api/prayers/error', (_req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    )
  }),

  rest.post('/api/prayers/unauthorized', (_req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({ error: 'Unauthorized' })
    )
  })
]