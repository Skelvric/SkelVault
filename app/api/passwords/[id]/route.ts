export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getPasswordsCollection } from '@/lib/mongodb';
import { encryptPassword, decryptPassword } from '@/lib/crypto';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';

type Context = {
  params: Promise<{
    id: string;
  }>;
};

function validatePasswordBody(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body!';
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'Title is required!';
  }
  if (!body.username || typeof body.username !== 'string') {
    return 'Username is required!';
  }
  if (!body.password || typeof body.password !== 'string') {
    return 'Password is required!';
  }
  return null;
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    const collection = await getPasswordsCollection();
    const password = await collection.findOne({ _id: new ObjectId(id), userId });

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

export async function PUT(request: NextRequest, { params }: Context) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const limitResponse = await enforceRateLimit(
      request,
      { name: 'passwords-write', limit: 60, windowSeconds: 60 },
      userId
    );
    if (limitResponse) return limitResponse;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const validationError = validatePasswordBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const collection = await getPasswordsCollection();

    const updateData = {
      title: body.title.trim(),
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
      password: body.password,
    });
  } catch (error) {
    console.error('PUT /api/passwords/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update!' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const limitResponse = await enforceRateLimit(
      request,
      { name: 'passwords-write', limit: 60, windowSeconds: 60 },
      userId
    );
    if (limitResponse) return limitResponse;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID!' }, { status: 400 });
    }

    const collection = await getPasswordsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found!' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully!', deletedId: id });
  } catch (error) {
    console.error('DELETE /api/passwords/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete!' }, { status: 500 });
  }
}
