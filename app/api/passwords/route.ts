export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPasswordsCollection } from '@/lib/mongodb';
import { encryptPassword, decryptPassword } from '@/lib/crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;

function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const collection = await getPasswordsCollection();
    const passwords = await collection.find({ userId }).toArray();

    const decryptedPasswords = passwords.map((pwd: any) => ({
      ...pwd,
      _id: pwd._id.toString(),
      password: decryptPassword(pwd.password),
    }));

    return NextResponse.json(decryptedPasswords);
  } catch (error) {
    console.error('GET /api/passwords error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passwords!' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'Title, username, and password are required!' },
        { status: 400 }
      );
    }

    const collection = await getPasswordsCollection();

    const newPassword = {
      userId,
      title: body.title,
      username: body.username,
      password: encryptPassword(body.password),
      url: body.url || '',
      notes: body.notes || '',
      category: body.category || 'Other',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newPassword);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...newPassword,
        password: body.password,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/passwords error:', error);
    return NextResponse.json(
      { error: 'Failed to create password!' },
      { status: 500 }
    );
  }
}
