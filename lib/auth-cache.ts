/**
 * 简单的内存认证缓存
 * 
 * 用于减少重复的用户认证查询，提升并发性能
 * 缓存时间: 5分钟
 */

interface CacheEntry {
  user: any
  timestamp: number
}

const AUTH_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

export function getCachedUser(authHeader?: string): any | null {
  if (!authHeader) return null
  
  const cached = AUTH_CACHE.get(authHeader)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user
  }
  
  return null
}

export function setCachedUser(authHeader: string, user: any): void {
  AUTH_CACHE.set(authHeader, {
    user,
    timestamp: Date.now()
  })
  
  // 清理过期缓存 (简单策略)
  if (AUTH_CACHE.size > 1000) {
    const now = Date.now()
    for (const [key, entry] of AUTH_CACHE.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        AUTH_CACHE.delete(key)
      }
    }
  }
}

export function clearAuthCache(): void {
  AUTH_CACHE.clear()
}