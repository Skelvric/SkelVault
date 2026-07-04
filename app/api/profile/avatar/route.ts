import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const limitResponse = await enforceRateLimit(
      request,
      { name: 'avatar-upload', limit: 10, windowSeconds: 60 * 15 },
      userId
    );
    if (limitResponse) return limitResponse;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid session!' }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided!' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, WebP, or GIF image!' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB!' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { avatar: dataUrl, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found!' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Avatar updated successfully!', avatar: dataUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar!' }, { status: 500 });
  }
}
