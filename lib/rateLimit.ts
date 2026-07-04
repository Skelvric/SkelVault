import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitsCollection } from './mongodb';

interface RateLimitConfig {
  name: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const collection = await getRateLimitsCollection();

  const windowStart = Math.floor(Date.now() / 1000 / config.windowSeconds) * config.windowSeconds;
  const key = `${config.name}:${identifier}:${windowStart}`;
  const expiresAt = new Date((windowStart + config.windowSeconds) * 1000);

  const result = await collection.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { key, expiresAt },
    },
    { upsert: true, returnDocument: 'after' }
  );

  const count = result?.count ?? 1;
  const allowed = count <= config.limit;
  const remaining = Math.max(0, config.limit - count);

  return { allowed, remaining, resetAt: expiresAt };
}

export async function enforceRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifierOverride?: string
): Promise<NextResponse | null> {
  const identifier = identifierOverride || getClientIp(request);

  try {
    const { allowed, remaining, resetAt } = await checkRateLimit(identifier, config);

    if (!allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.error('🚦 [RateLimit] 🟡 Rate limit check failed, allowing request:', error);
    return null;
  }
}
