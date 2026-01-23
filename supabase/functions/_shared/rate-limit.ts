/**
 * Simple in-memory rate limiting for edge functions
 * 
 * Note: This is per-isolate rate limiting. In production with high traffic,
 * consider using external storage like Upstash Redis for distributed rate limiting.
 * For most Lovable Cloud use cases, this in-memory approach is sufficient.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - resets when function cold starts
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 100 requests)
let requestCounter = 0;
function cleanupOldEntries(): void {
  requestCounter++;
  if (requestCounter % 100 === 0) {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the window */
  remaining: number;
  /** Maximum requests allowed per window */
  limit: number;
  /** Unix timestamp (seconds) when the window resets */
  resetTime: number;
  /** Milliseconds until the window resets */
  retryAfterMs: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param key - Unique identifier for the rate limit bucket (e.g., userId, IP)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining requests and reset time
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetTime: Math.floor(resetTime / 1000),
      retryAfterMs: 0,
    };
  }
  
  // Check if within limits
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      limit: config.maxRequests,
      resetTime: Math.floor(entry.resetTime / 1000),
      retryAfterMs: 0,
    };
  }
  
  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    limit: config.maxRequests,
    resetTime: Math.floor(entry.resetTime / 1000),
    retryAfterMs: entry.resetTime - now,
  };
}

/**
 * Get rate limit headers for a response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };
  
  if (!result.allowed) {
    headers["Retry-After"] = Math.ceil(result.retryAfterMs / 1000).toString();
  }
  
  return headers;
}

/**
 * Create a rate-limited error response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        ...getRateLimitHeaders(result),
      },
    }
  );
}
