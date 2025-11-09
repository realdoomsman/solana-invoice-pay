// Simple in-memory rate limiter
// For production, use Redis or similar

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = store[identifier]

  // Clean up old entries
  if (record && now > record.resetTime) {
    delete store[identifier]
  }

  // Initialize or get current record
  if (!store[identifier]) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return { success: true, remaining: limit - 1 }
  }

  // Check if limit exceeded
  if (store[identifier].count >= limit) {
    return { success: false, remaining: 0 }
  }

  // Increment count
  store[identifier].count++
  return { success: true, remaining: limit - store[identifier].count }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (now > store[key].resetTime) {
      delete store[key]
    }
  })
}, 60000) // Clean every minute
