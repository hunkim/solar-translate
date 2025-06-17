// Simple in-memory rate limiter
//
// Environment Variables (optional):
// - TRANSLATE_RATE_LIMIT: Max translations per hour (default: 160)
// - UPLOAD_RATE_LIMIT: Max uploads per hour (default: 40)
//
// Example .env.local:
// TRANSLATE_RATE_LIMIT=500
// UPLOAD_RATE_LIMIT=100
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Rate limits - configurable via environment variables (per hour)
export const RATE_LIMITS = {
  translate: {
    windowMs: 60 * 60 * 1000, // Fixed 1 hour window
    maxRequests: parseInt(process.env.TRANSLATE_RATE_LIMIT || '160') // 160 translations per hour
  },
  upload: {
    windowMs: 60 * 60 * 1000, // Fixed 1 hour window
    maxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT || '40') // 40 uploads per hour
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