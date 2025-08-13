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
export const createMockServerSupabase = (config = {}) => {
  const {
    queryResults = {},
    authUser = null,
    authError = null,
    queryError = null
  } = config

  // Create a fully chainable query builder that supports all Supabase methods
  const createChainableQuery = (tableName: string, options = {}) => {
    // Default data or specific query results
    const baseData = { 
      data: queryResults[tableName] || [], 
      error: queryError 
    }
    
    // Handle count queries
    if (options.count === 'exact' && options.head === true) {
      return Promise.resolve({
        count: Array.isArray(baseData.data) ? baseData.data.length : 0,
        data: null,
        error: baseData.error
      })
    }
    
    const queryBuilder = {
      // Filter methods - all return this for chaining
      eq: jest.fn(() => queryBuilder),
      gte: jest.fn(() => queryBuilder),
      lte: jest.fn(() => queryBuilder),
      gt: jest.fn(() => queryBuilder),
      lt: jest.fn(() => queryBuilder),
      in: jest.fn(() => queryBuilder),
      contains: jest.fn(() => queryBuilder),
      ilike: jest.fn(() => queryBuilder),
      like: jest.fn(() => queryBuilder),
      is: jest.fn(() => queryBuilder),
      not: jest.fn(() => queryBuilder),
      
      // Modifier methods - return new instance for assignment pattern
      order: jest.fn(() => createChainableQuery(tableName, options)),
      limit: jest.fn(() => createChainableQuery(tableName, options)),
      offset: jest.fn(() => createChainableQuery(tableName, options)),
      range: jest.fn(() => createChainableQuery(tableName, options)),
      
      // Terminal methods that return promises
      single: jest.fn(() => Promise.resolve({ 
        data: Array.isArray(baseData.data) ? baseData.data[0] : baseData.data, 
        error: baseData.error 
      })),
      maybeSingle: jest.fn(() => Promise.resolve({
        data: Array.isArray(baseData.data) ? baseData.data[0] : baseData.data, 
        error: baseData.error 
      })),
      
      // Make it awaitable - handle count vs data queries
      then: (resolve, reject) => {
        if (options.count === 'exact' && options.head === true) {
          const countResult = {
            count: Array.isArray(baseData.data) ? baseData.data.length : 0,
            data: null,
            error: baseData.error
          }
          return Promise.resolve(countResult).then(resolve, reject)
        }
        return Promise.resolve(baseData).then(resolve, reject)
      },
      catch: (handler) => {
        return Promise.resolve(baseData).catch(handler)
      }
    }
    
    return queryBuilder
  }
  
  const createQueryBuilder = (tableName: string) => {
    return {
      select: jest.fn((columns, options) => {
        // Always return a chainable query, but mark it as a count query if needed
        return createChainableQuery(tableName, options || {})
      }),
      insert: jest.fn(() => {
        const chainableQuery = createChainableQuery(tableName)
        return {
          ...chainableQuery,
          select: jest.fn(() => chainableQuery) // Special case for insert().select()
        }
      }),
      update: jest.fn(() => createChainableQuery(tableName)),
      delete: jest.fn(() => createChainableQuery(tableName)),
      upsert: jest.fn(() => createChainableQuery(tableName))
    }
  }

  return {
    from: jest.fn((tableName) => createQueryBuilder(tableName)),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: authUser }, 
        error: authError 
      })),
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