import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSessionsCollection } from '@/lib/mongodb';
import { AuthTokenPayload } from '@/lib/auth';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;

export async function POST(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      if (decoded?.sid) {
        const sessions = await getSessionsCollection();
        await sessions.deleteOne({ sessionId: decoded.sid });
      }
    } catch {}
  }

  const response = NextResponse.json({ message: 'Logout successful!' }, { status: 200 });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}
