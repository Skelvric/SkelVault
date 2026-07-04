import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './lib/auth';
import { ensureCsrfCookie } from './lib/csrf';

export const runtime = 'nodejs';

const PROTECTED_ROUTES = ['/dashboard', '/passwords', '/profile'];
const AUTH_PAGES = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  if (url.startsWith('/_next') || url.startsWith('/favicon') || url.includes('.')) {
    return NextResponse.next();
  }

  if (url.startsWith('/api')) {
    const response = NextResponse.next();
    ensureCsrfCookie(request, response);
    return response;
  }

  const isAuthPage = AUTH_PAGES.includes(url);
  const isProtected = PROTECTED_ROUTES.some((route) => url.startsWith(route));

  const user = await getAuthUser(request);

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isProtected) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', url);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  ensureCsrfCookie(request, response);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
