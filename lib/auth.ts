import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    return user;
  } catch (err) {
    return null;
  }
}
