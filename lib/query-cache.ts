/**
 * Query Cache Utility
 * Task 20.1: Implement query caching for database optimization
 * 
 * Provides in-memory caching for frequently accessed database queries
 * with TTL (time-to-live) and cache invalidation support.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>>
  private stats: { hits: number; misses: number }
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 60000) {
    this.cache = new Map()
    this.stats = { hits: 0, misses: 0 }
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL // Default 60 seconds
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      // Expired - remove from cache
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size - remove oldest entries if needed
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * Execute query with caching
   */
  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Execute query
    const result = await queryFn()

    // Cache result
    this.set(key, result, ttl)

    return result
  }

  /**
   * Execute query with automatic key generation
   */
  async queryWithParams<T>(
    prefix: string,
    params: Record<string, any>,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(prefix, params)
    return this.query(key, queryFn, ttl)
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Singleton instance
const queryCache = new QueryCache()

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup()
  }, 5 * 60 * 1000)
}

export default queryCache

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 30 * 1000,      // 30 seconds - for frequently changing data
  MEDIUM: 60 * 1000,     // 1 minute - default
  LONG: 5 * 60 * 1000,   // 5 minutes - for relatively stable data
  VERY_LONG: 15 * 60 * 1000, // 15 minutes - for rarely changing data
}

/**
 * Cache key prefixes for different query types
 */
export const CachePrefix = {
  ESCROW_LIST: 'escrow:list',
  ESCROW_DETAIL: 'escrow:detail',
  ESCROW_MILESTONES: 'escrow:milestones',
  ESCROW_ACTIONS: 'escrow:actions',
  ESCROW_DEPOSITS: 'escrow:deposits',
  DISPUTE_LIST: 'dispute:list',
  DISPUTE_DETAIL: 'dispute:detail',
  EVIDENCE_LIST: 'evidence:list',
  NOTIFICATION_LIST: 'notification:list',
  ADMIN_QUEUE: 'admin:queue',
  ADMIN_STATS: 'admin:stats',
}

/**
 * Helper function to invalidate escrow-related caches
 */
export function invalidateEscrowCache(escrowId: string): void {
  queryCache.invalidatePattern(new RegExp(`escrow:.*:.*escrow_id:.*${escrowId}`))
  queryCache.invalidatePrefix(`${CachePrefix.ESCROW_DETAIL}:`)
  queryCache.invalidatePrefix(`${CachePrefix.ESCROW_LIST}:`)
  queryCache.invalidatePrefix(`${CachePrefix.ADMIN_QUEUE}:`)
}

/**
 * Helper function to invalidate dispute-related caches
 */
export function invalidateDisputeCache(disputeId?: string): void {
  if (disputeId) {
    queryCache.invalidatePattern(new RegExp(`dispute:.*:.*dispute_id:.*${disputeId}`))
  }
  queryCache.invalidatePrefix(`${CachePrefix.DISPUTE_LIST}:`)
  queryCache.invalidatePrefix(`${CachePrefix.ADMIN_QUEUE}:`)
  queryCache.invalidatePrefix(`${CachePrefix.ADMIN_STATS}:`)
}

/**
 * Helper function to invalidate notification caches
 */
export function invalidateNotificationCache(walletAddress: string): void {
  queryCache.invalidatePattern(new RegExp(`notification:.*:.*wallet:.*${walletAddress}`))
}
