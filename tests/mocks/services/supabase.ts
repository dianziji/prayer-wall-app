// Comprehensive Supabase mock for consistent testing

export const createMockSupabaseClient = (customMocks = {}) => {
  const defaultMocks = {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn()
      }))
    }
  }

  return {
    ...defaultMocks,
    ...customMocks
  }
}

// Mock for server-side Supabase
export const createMockServerSupabase = (queryResults = {}) => {
  const createQueryBuilder = (tableName: string) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: queryResults[tableName] || [],
            error: null
          })
        }),
        order: jest.fn().mockResolvedValue({
          data: queryResults[tableName] || [],
          error: null
        }),
        in: jest.fn().mockResolvedValue({
          count: queryResults[`${tableName}_count`] || 0,
          error: null
        })
      }),
      order: jest.fn().mockResolvedValue({
        data: queryResults[tableName] || [],
        error: null
      })
    }),
    insert: jest.fn().mockResolvedValue({
      data: queryResults[`${tableName}_insert`] || {},
      error: null
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: queryResults[`${tableName}_update`] || {},
        error: null
      })
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: queryResults[`${tableName}_delete`] || {},
        error: null
      })
    })
  })

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: queryResults.user || null },
        error: null
      })
    },
    from: jest.fn().mockImplementation(createQueryBuilder)
  }
}

// Preset configurations for common scenarios
export const mockSupabaseConfigs = {
  authenticatedUser: () => createMockServerSupabase({
    user: { id: 'test-user-id', email: 'test@example.com' }
  }),
  
  unauthenticatedUser: () => createMockServerSupabase({
    user: null
  }),
  
  withPrayers: (prayers: any[]) => createMockServerSupabase({
    prayers,
    user: { id: 'test-user-id' }
  }),
  
  withError: (errorMessage: string) => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: errorMessage }
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: errorMessage }
        })
      })
    })
  })
}