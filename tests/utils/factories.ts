// Data factories for consistent test data generation

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user-id',
  username: 'testuser',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockPrayer = (overrides = {}) => ({
  id: 'test-prayer-id',
  content: 'Test prayer content',
  author_name: 'Test Author',
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  color: null,
  font_style: null,
  metadata: null,
  wall_id: 'test-wall-id',
  guest_id: null,
  ...overrides
})

export const createMockPrayerWithLikes = (overrides = {}) => ({
  ...createMockPrayer(),
  like_count: 5,
  liked_by_me: false,
  ...overrides
})

export const createMockComment = (overrides = {}) => ({
  id: 'test-comment-id',
  content: 'Test comment content',
  user_id: 'test-user-id',
  prayer_id: 'test-prayer-id',
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockLike = (overrides = {}) => ({
  user_id: 'test-user-id',
  prayer_id: 'test-prayer-id',
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockPrayerWall = (overrides = {}) => ({
  id: 'test-wall-id',
  week_start: '2023-12-03', // Sunday
  is_active: true,
  created_at: new Date().toISOString(),
  theme: null,
  stats: null,
  ...overrides
})

export const createMockUserStats = (overrides = {}) => ({
  totalPrayers: 10,
  totalLikes: 25,
  totalComments: 15,
  mostActiveWeek: '2023-12-03',
  recentActivity: [5, 3, 7, 2], // Last 4 weeks
  ...overrides
})

// Factory for creating multiple items
export const createMockPrayers = (count: number, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockPrayer({
      id: `test-prayer-${index}`,
      content: `Test prayer content ${index}`,
      ...baseOverrides
    })
  )
}

export const createMockComments = (count: number, prayerId: string, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockComment({
      id: `test-comment-${index}`,
      prayer_id: prayerId,
      content: `Test comment content ${index}`,
      ...baseOverrides
    })
  )
}

// Week utilities for testing
export const getTestWeekStart = (offsetWeeks = 0) => {
  const now = new Date()
  const sunday = new Date(now.setDate(now.getDate() - now.getDay() + (offsetWeeks * 7)))
  return sunday.toISOString().split('T')[0]
}

export const createMockWeekData = (weekOffset = 0) => ({
  weekStart: getTestWeekStart(weekOffset),
  prayers: createMockPrayers(5, {
    created_at: new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000).toISOString()
  })
})