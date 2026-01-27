import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

interface RateLimitOptions {
  maxRequests: number;  // Nombre max de requêtes
  windowMs: number;     // Fenêtre de temps en ms
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { maxRequests, windowMs } = options;
  const now = Date.now();
  const key = identifier;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Nouvelle entrée ou entrée expirée
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Limite atteinte
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Incrémenter le compteur
  entry.count++;
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetTime),
      },
    }
  );
}

// Configurations prédéfinies
export const RATE_LIMITS = {
  // Auth: 5 tentatives par minute
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  // API standard: 30 requêtes par minute
  standard: { maxRequests: 30, windowMs: 60 * 1000 },
  // API admin: 60 requêtes par minute (pour les requêtes fréquentes comme auto-save)
  api: { maxRequests: 60, windowMs: 60 * 1000 },
  // Création de compte: 3 par heure
  signup: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  // Contact: 5 par heure
  contact: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
};
