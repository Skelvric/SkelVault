'use client';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();

  if (SAFE_METHODS.has(method)) {
    return fetch(input, init);
  }

  const token = readCookie(CSRF_COOKIE_NAME);
  const headers = new Headers(init.headers);
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(input, { ...init, headers });
}
