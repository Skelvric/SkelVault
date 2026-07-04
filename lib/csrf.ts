import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getCsrfCookieOptions() {
  return {
    httpOnly: false as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  };
}

export function ensureCsrfCookie(request: NextRequest, response: NextResponse): string {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = generateCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verifyCsrfToken(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(request.method)) return null;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  return null;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
