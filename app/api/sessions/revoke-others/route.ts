export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionsCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const csrfError = verifyCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const sessions = await getSessionsCollection();
    const result = await sessions.deleteMany({
      userId: authUser.id,
      sessionId: { $ne: authUser.sid },
    });

    return NextResponse.json({
      message: `Signed out of ${result.deletedCount} other device${result.deletedCount === 1 ? '' : 's'}.`,
      revokedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('POST /api/sessions/revoke-others error:', error);
    return NextResponse.json({ error: 'Failed to revoke sessions!' }, { status: 500 });
  }
}
