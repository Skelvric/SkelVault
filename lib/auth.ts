import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSessionsCollection } from './mongodb';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  sid: string;
}

export function generateSessionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function createSession(params: {
  userId: string;
  request: NextRequest;
}): Promise<string> {
  const sessionId = generateSessionId();
  const sessions = await getSessionsCollection();

  const userAgent = params.request.headers.get('user-agent') || 'Unknown device';
  const ip =
    params.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    params.request.headers.get('x-real-ip') ||
    'Unknown';

  const now = new Date();

  await sessions.insertOne({
    sessionId,
    userId: params.userId,
    userAgent,
    ip,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
  });

  return sessionId;
}

export async function getAuthUser(request: NextRequest): Promise<AuthTokenPayload | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('id' in decoded) ||
      !('sid' in decoded)
    ) {
      return null;
    }

    const payload = decoded as AuthTokenPayload;
    const sessions = await getSessionsCollection();
    const session = await sessions.findOne({ sessionId: payload.sid, userId: payload.id });

    if (!session) return null;

    sessions
      .updateOne({ sessionId: payload.sid }, { $set: { lastSeenAt: new Date() } })
      .catch(() => {});

    return payload;
  } catch {
    return null;
  }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getAuthUser(request);
  return user?.id ?? null;
}
