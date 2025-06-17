// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Default rate limits - adjust these based on your needs
export const RATE_LIMITS = {
  translate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20 // 20 translations per 15 minutes (80 per hour)
  },
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    maxRequests: 5 // 5 uploads per 15 minutes (20 per hour)
  }
} as const

export function rateLimit(options: RateLimitOptions) {
  return function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now()
    const entry = rateLimitStore.get(identifier)

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      rateLimitStore.delete(identifier)
    }

    const currentEntry = rateLimitStore.get(identifier)

    if (!currentEntry) {
      // First request in window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return { 
        allowed: true, 
        remaining: options.maxRequests - 1 
      }
    }

    if (currentEntry.count >= options.maxRequests) {
      return { 
        allowed: false, 
        resetTime: currentEntry.resetTime,
        remaining: 0
      }
    }

    // Increment count
    currentEntry.count++
    rateLimitStore.set(identifier, currentEntry)
    
    return { 
      allowed: true, 
      remaining: options.maxRequests - currentEntry.count 
    }
  }
}

// Helper to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real.trim()
  }
  
  return 'unknown'
} 