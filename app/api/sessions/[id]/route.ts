export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionsCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: Context) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const sessions = await getSessionsCollection();
    const result = await sessions.deleteOne({ sessionId, userId: authUser.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Session not found!' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Session revoked.',
      wasCurrent: sessionId === authUser.sid,
    });
  } catch (error) {
    console.error('DELETE /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to revoke session!' }, { status: 500 });
  }
}
