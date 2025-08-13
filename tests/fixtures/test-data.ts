// Static test data for consistent testing scenarios

export const testUsers = {
  authenticatedUser: {
    id: 'user-1',
    username: 'testuser',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  adminUser: {
    id: 'admin-1',
    username: 'admin',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  guestUser: {
    id: 'guest-1',
    username: 'guest',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
}

export const testPrayers = {
  basic: {
    id: 'prayer-1',
    content: 'Test prayer for healing and peace',
    author_name: 'John Doe',
    user_id: 'user-1',
    created_at: '2023-12-01T10:00:00Z',
    color: null,
    font_style: null,
    metadata: null,
    wall_id: 'wall-1',
    guest_id: null
  },
  withLikes: {
    id: 'prayer-2',
    content: 'Prayer with likes and comments',
    author_name: 'Jane Smith',
    user_id: 'user-2',
    created_at: '2023-12-01T11:00:00Z',
    like_count: 5,
    liked_by_me: true,
    color: '#FFE4E1',
    font_style: 'italic',
    metadata: { tags: ['healing', 'family'] },
    wall_id: 'wall-1',
    guest_id: null
  },
  longContent: {
    id: 'prayer-3',
    content: 'This is a very long prayer content that tests the maximum length limits and how the application handles extensive text input from users who want to share detailed prayer requests with the community'.repeat(2),
    author_name: 'Long Prayer Author',
    user_id: 'user-3',
    created_at: '2023-12-01T12:00:00Z',
    color: null,
    font_style: null,
    metadata: null,
    wall_id: 'wall-1',
    guest_id: null
  }
}

export const testComments = {
  basic: {
    id: 'comment-1',
    content: 'Praying for you!',
    user_id: 'user-2',
    prayer_id: 'prayer-1',
    created_at: '2023-12-01T10:30:00Z'
  },
  lengthy: {
    id: 'comment-2',
    content: 'This is a longer comment that provides more detailed support and encouragement for the prayer request.',
    user_id: 'user-3',
    prayer_id: 'prayer-1',
    created_at: '2023-12-01T11:00:00Z'
  }
}

export const testLikes = {
  basic: {
    user_id: 'user-2',
    prayer_id: 'prayer-1',
    created_at: '2023-12-01T10:15:00Z'
  }
}

export const testPrayerWalls = {
  currentWeek: {
    id: 'wall-1',
    week_start: '2023-12-03', // Sunday
    is_active: true,
    created_at: '2023-12-03T00:00:00Z',
    theme: null,
    stats: null
  },
  previousWeek: {
    id: 'wall-2',
    week_start: '2023-11-26', // Previous Sunday
    is_active: false,
    created_at: '2023-11-26T00:00:00Z',
    theme: { primary_color: '#4A90E2' },
    stats: { total_prayers: 25, total_likes: 100 }
  }
}

export const testUserStats = {
  active: {
    totalPrayers: 15,
    totalLikes: 45,
    totalComments: 20,
    mostActiveWeek: '2023-12-03',
    recentActivity: [8, 5, 2, 0] // Last 4 weeks
  },
  newUser: {
    totalPrayers: 0,
    totalLikes: 0,
    totalComments: 0,
    mostActiveWeek: 'N/A',
    recentActivity: [0, 0, 0, 0]
  },
  moderateUser: {
    totalPrayers: 5,
    totalLikes: 12,
    totalComments: 8,
    mostActiveWeek: '2023-11-26',
    recentActivity: [3, 2, 0, 0]
  }
}

// Test scenarios for different app states
export const testScenarios = {
  emptyWall: {
    prayers: [],
    comments: [],
    likes: [],
    user: testUsers.authenticatedUser
  },
  activeWall: {
    prayers: [testPrayers.basic, testPrayers.withLikes],
    comments: [testComments.basic, testComments.lengthy],
    likes: [testLikes.basic],
    user: testUsers.authenticatedUser
  },
  guestUser: {
    prayers: [testPrayers.basic],
    comments: [],
    likes: [],
    user: null
  },
  errorState: {
    prayers: null,
    error: 'Failed to load prayers'
  }
}

// Form validation test data
export const formTestData = {
  validPrayer: {
    content: 'Valid prayer content',
    author_name: 'Test Author'
  },
  emptyContent: {
    content: '',
    author_name: 'Test Author'
  },
  tooLongContent: {
    content: 'a'.repeat(501),
    author_name: 'Test Author'
  },
  tooLongAuthor: {
    content: 'Valid content',
    author_name: 'a'.repeat(26)
  },
  specialCharacters: {
    content: 'Prayer with émojis 🙏 and spëcial characters',
    author_name: 'User with Àccénts'
  }
}

// API response templates
export const apiResponses = {
  success: {
    prayers: { data: [testPrayers.basic], error: null },
    createPrayer: { data: testPrayers.basic, error: null },
    userStats: { data: testUserStats.active, error: null }
  },
  error: {
    unauthorized: { data: null, error: { message: 'Unauthorized' } },
    serverError: { data: null, error: { message: 'Internal server error' } },
    validationError: { data: null, error: { message: 'Validation failed' } }
  }
}