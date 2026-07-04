import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import bcryptjs from 'bcryptjs';
import { enforceRateLimit } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const limitResponse = await enforceRateLimit(request, {
    name: 'register-ip',
    limit: 10,
    windowSeconds: 60 * 60,
  });
  if (limitResponse) return limitResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body!' }, { status: 400 });
    }

    const { name, password } = body;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required!' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a valid name!' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address!' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters!' },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists!' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    try {
      const result = await usersCollection.insertOne({
        name: name.trim(),
        email,
        password: hashedPassword,
        bio: '',
        avatar: null,
        phone: '',
        company: '',
        location: '',
        theme: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json(
        {
          message: 'User created successfully!',
          userId: result.insertedId,
        },
        { status: 201 }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: 'An account with this email already exists!' },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed!' }, { status: 500 });
  }
}
