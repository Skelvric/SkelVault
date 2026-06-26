import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './lib/auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  if (
    url.startsWith('/_next') ||
    url.startsWith('/favicon') ||
    url.includes('.') ||
    url.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const isAuthPage = url === '/auth/login' || url === '/auth/register';
  const protectedRoutes = ['/dashboard', '/passwords'];

  const isProtected = protectedRoutes.some((route) =>
    url.startsWith(route)
  );

  const user = await getAuthUser(request);

  console.log(`🔐 [Auth Middleware]`);
  console.log(`🎯 Path : ${url}`);
  console.log(`🟢 Auth : ${!!user}`);
  if (user) {
    console.log(`👀 User : ${user.email}`);
  }
  console.log('─'.repeat(32));

  if (user && isAuthPage) {
    console.log('🟢 Redirecting from the Auth page to the Dashboard...');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isProtected) {
    console.log('🔴 Token-free access to the Dashboard → Redirecting to Login...');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/passwords/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
