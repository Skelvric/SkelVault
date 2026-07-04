import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSession } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rateLimit';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password!';

export async function POST(request: NextRequest) {
  const ipLimitResponse = await enforceRateLimit(request, {
    name: 'login-ip',
    limit: 20,
    windowSeconds: 15 * 60,
  });
  if (ipLimitResponse) return ipLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body!' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required!' },
        { status: 400 }
      );
    }

    const emailLimitResponse = await enforceRateLimit(
      request,
      { name: 'login-email', limit: 8, windowSeconds: 15 * 60 },
      email
    );
    if (emailLimitResponse) return emailLimitResponse;

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email });

    if (!user) {
      await bcryptjs.compare(password, '$2a$12$invalidsaltinvalidsaltinvalidsaltinva');
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const userId = user._id.toString();
    const sessionId = await createSession({ userId, request });

    const token = jwt.sign(
      {
        id: userId,
        email: user.email,
        name: user.name,
        sid: sessionId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      {
        message: 'Login successful!',
        user: {
          id: userId,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed!' }, { status: 500 });
  }
}
