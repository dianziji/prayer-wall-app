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

// Mock for server-side Supabase with complete query chain
export const createMockServerSupabase = (queryResults = {}) => {
  // Create a fully chainable query builder that supports all Supabase methods
  const createChainableQuery = (tableName: string) => {
    const baseData = { data: queryResults[tableName] || [], error: null }
    
    const queryBuilder = {
      // Filter methods
      eq: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      gt: jest.fn(),
      lt: jest.fn(),
      in: jest.fn(),
      contains: jest.fn(),
      ilike: jest.fn(),
      like: jest.fn(),
      is: jest.fn(),
      not: jest.fn(),
      
      // Modifier methods
      order: jest.fn(),
      limit: jest.fn(),
      offset: jest.fn(),
      range: jest.fn(),
      
      // Terminal methods
      single: jest.fn().mockResolvedValue(baseData),
      maybeSingle: jest.fn().mockResolvedValue(baseData),
      
      // Promise interface
      then: jest.fn().mockImplementation((resolve) => resolve(baseData)),
      catch: jest.fn().mockImplementation((reject) => Promise.resolve(baseData))
    }
    
    // Make all chainable methods return the same queryBuilder for fluent API
    Object.keys(queryBuilder).forEach(key => {
      if (typeof queryBuilder[key] === 'function' && 
          !['single', 'maybeSingle', 'then', 'catch'].includes(key)) {
        queryBuilder[key].mockReturnValue(queryBuilder)
      }
    })
    
    // Ensure each method call returns a fresh mock to support multiple calls
    queryBuilder.eq.mockImplementation(() => queryBuilder)
    queryBuilder.gte.mockImplementation(() => queryBuilder)
    queryBuilder.order.mockImplementation(() => queryBuilder)
    
    return queryBuilder
  }
  
  const createQueryBuilder = (tableName: string) => ({
    select: jest.fn().mockReturnValue(createChainableQuery(tableName)),
    insert: jest.fn().mockReturnValue(createChainableQuery(tableName)),
    update: jest.fn().mockReturnValue(createChainableQuery(tableName)),
    delete: jest.fn().mockReturnValue(createChainableQuery(tableName)),
    upsert: jest.fn().mockReturnValue(createChainableQuery(tableName))
  })

  return {
    from: jest.fn().mockImplementation(createQueryBuilder),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn()
      }))
    }
  }
}

// Utility mock creators
export const mockSupabaseSuccess = (data: any) => ({
  data,
  error: null
})

export const mockSupabaseError = (message: string, code?: string) => ({
  data: null,
  error: { message, code: code || 'test_error' }
})