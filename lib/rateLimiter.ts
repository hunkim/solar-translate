// Simple in-memory rate limiter
//
// Environment Variables (optional):
// - TRANSLATE_RATE_LIMIT: Max translations per window (default: 40)
// - TRANSLATE_RATE_WINDOW_MS: Translation window in milliseconds (default: 900000 = 15 minutes)
// - UPLOAD_RATE_LIMIT: Max uploads per window (default: 10)
// - UPLOAD_RATE_WINDOW_MS: Upload window in milliseconds (default: 900000 = 15 minutes)
//
// Example .env.local:
// TRANSLATE_RATE_LIMIT=100
// UPLOAD_RATE_LIMIT=20
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Rate limits - configurable via environment variables
export const RATE_LIMITS = {
  translate: {
    windowMs: parseInt(process.env.TRANSLATE_RATE_WINDOW_MS || '900000'), // 15 minutes default
    maxRequests: parseInt(process.env.TRANSLATE_RATE_LIMIT || '40') // 40 translations per 15 minutes (160 per hour)
  },
  upload: {
    windowMs: parseInt(process.env.UPLOAD_RATE_WINDOW_MS || '900000'), // 15 minutes default
    maxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT || '10') // 10 uploads per 15 minutes (40 per hour)
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