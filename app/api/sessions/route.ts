export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionsCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const sessions = await getSessionsCollection();
    const docs = await sessions
      .find({ userId: authUser.id })
      .sort({ lastSeenAt: -1 })
      .toArray();

    const result = docs.map((doc) => ({
      sessionId: doc.sessionId,
      userAgent: doc.userAgent,
      ip: doc.ip,
      createdAt: doc.createdAt,
      lastSeenAt: doc.lastSeenAt,
      isCurrent: doc.sessionId === authUser.sid,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions!' }, { status: 500 });
  }
}
