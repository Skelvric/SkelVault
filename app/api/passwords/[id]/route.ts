export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { id } = await params;

    const collection = await getPasswordsCollection();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    const password = await collection.findOne({
      _id: new ObjectId(id),
      userId,
    });

    if (!password) {
      return NextResponse.json({ error: 'Not found!' }, { status: 404 });
    }

    return NextResponse.json({
      ...password,
      _id: password._id.toString(),
      password: decryptPassword(password.password),
    });

  } catch (error) {
    console.error('GET /api/passwords/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch!' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const collection = await getPasswordsCollection();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    if (!body.title || !body.username || !body.password) {
      return NextResponse.json({ error: 'Missing required fields!' }, { status: 400 });
    }

    const updateData = {
      title: body.title,
      username: body.username,
      password: encryptPassword(body.password),
      url: body.url || '',
      notes: body.notes || '',
      category: body.category || 'Other',
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found!' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Updated successfully!',
      ...updateData,
      _id: id,
    });

  } catch (error) {
    console.error('PUT /api/passwords/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update!' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { id } = await params;

    const collection = await getPasswordsCollection();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found!' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Deleted successfully!',
      deletedId: id,
    });

  } catch (error) {
    console.error('DELETE /api/passwords/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete!' }, { status: 500 });
  }
}
