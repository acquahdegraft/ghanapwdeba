/**
 * Shared CORS configuration for edge functions
 * Implements origin validation instead of wildcard CORS
 */

// Allowed origins - production, preview, and development
const ALLOWED_ORIGINS = [
  "https://ghanapwdeba.lovable.app",
  "https://id-preview--6940d0c8-bce2-4820-a035-0a76f9318ba8.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

// Pattern for dynamic Lovable preview URLs
const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/;

/**
 * Check if an origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check static allowed origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check dynamic Lovable preview pattern
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) {
    return true;
  }
  
  return false;
}

/**
 * Get CORS headers for a request
 * Returns origin-specific headers instead of wildcard
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  
  // Default to first allowed origin if request origin is not allowed
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Create a preflight response for OPTIONS requests
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/**
 * Add CORS headers to an existing response
 */
export function addCorsHeaders(req: Request, response: Response): Response {
  const corsHeaders = getCorsHeaders(req);
  const newHeaders = new Headers(response.headers);
  
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
