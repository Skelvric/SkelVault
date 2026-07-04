import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection, getSessionsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcryptjs from 'bcryptjs';
import { getUserIdFromRequest, getAuthUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid session!' }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: 'User not found!' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile!' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }
    const userId = authUser.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid session!' }, { status: 401 });
    }

    const limitResponse = await enforceRateLimit(
      request,
      { name: 'profile-update', limit: 20, windowSeconds: 60 * 15 },
      userId
    );
    if (limitResponse) return limitResponse;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body!' }, { status: 400 });
    }

    const { name, bio, phone, company, location, theme, currentPassword, newPassword } = body;

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: 'User not found!' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    let passwordChanged = false;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty!' }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (bio !== undefined) updateData.bio = typeof bio === 'string' ? bio.slice(0, 500) : '';
    if (phone !== undefined) updateData.phone = typeof phone === 'string' ? phone.slice(0, 50) : '';
    if (company !== undefined) updateData.company = typeof company === 'string' ? company.slice(0, 100) : '';
    if (location !== undefined) updateData.location = typeof location === 'string' ? location.slice(0, 100) : '';
    if (theme !== undefined && ['light', 'dark', 'system'].includes(theme)) {
      updateData.theme = theme;
    }

    if (newPassword) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json({ error: 'Current password required!' }, { status: 400 });
      }

      const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect!' }, { status: 400 });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters!' },
          { status: 400 }
        );
      }

      if (newPassword === currentPassword) {
        return NextResponse.json(
          { error: 'New password must be different from the current password!' },
          { status: 400 }
        );
      }

      updateData.password = await bcryptjs.hash(newPassword, 12);
      passwordChanged = true;
    }

    await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

    if (passwordChanged) {
      const sessions = await getSessionsCollection();
      await sessions.deleteMany({ userId, sessionId: { $ne: authUser.sid } });
    }

    const { password: _pw, ...safeUpdateData } = updateData as any;

    return NextResponse.json({
      message: passwordChanged
        ? 'Profile updated. You have been signed out of your other devices.'
        : 'Profile updated successfully!',
      ...safeUpdateData,
      _id: userId,
    });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile!' }, { status: 500 });
  }
}
