import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

function uniqueKey() {
  return `test-rate-${Date.now()}-${Math.random()}`;
}

describe('checkRateLimit', () => {
  it('first request returns success', () => {
    const key = uniqueKey();
    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60000 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetTime).toBeGreaterThan(Date.now() - 1000);
  });

  it('under limit returns success', () => {
    const key = uniqueKey();
    checkRateLimit(key, { maxRequests: 5, windowMs: 60000 });
    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60000 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it('above limit returns blocked', () => {
    const key = uniqueKey();
    const opts = { maxRequests: 5, windowMs: 60000 };

    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, opts);
    }

    const result = checkRateLimit(key, opts);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('after window expires resets', async () => {
    const key = uniqueKey();

    // Exhaust the limit with a tiny window
    checkRateLimit(key, { maxRequests: 1, windowMs: 1 });

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = checkRateLimit(key, { maxRequests: 1, windowMs: 60000 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('different identifiers are independent', () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();
    const opts = { maxRequests: 1, windowMs: 60000 };

    const resultA = checkRateLimit(keyA, opts);
    const resultB = checkRateLimit(keyB, opts);

    expect(resultA.success).toBe(true);
    expect(resultB.success).toBe(true);
  });
});

describe('getClientIP', () => {
  it('reads x-forwarded-for first IP', () => {
    const req = {
      headers: {
        get: (name: string) =>
          name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null,
      },
    } as unknown as Request;

    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = {
      headers: {
        get: (name: string) =>
          name === 'x-real-ip' ? '9.8.7.6' : null,
      },
    } as unknown as Request;

    expect(getClientIP(req)).toBe('9.8.7.6');
  });

  it('returns unknown if no headers', () => {
    const req = {
      headers: {
        get: () => null,
      },
    } as unknown as Request;

    expect(getClientIP(req)).toBe('unknown');
  });
});
