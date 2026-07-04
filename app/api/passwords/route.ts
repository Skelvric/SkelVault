export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPasswordsCollection } from '@/lib/mongodb';
import { encryptPassword, decryptPassword, isLegacyCiphertext } from '@/lib/crypto';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';
import { VaultExport, ExportedPasswordEntry } from '@/lib/types';

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
  if (body.title.length > 200 || body.username.length > 200) {
    return 'Title and username must be under 200 characters!';
  }
  if (body.url && typeof body.url === 'string' && body.url.length > 2000) {
    return 'URL is too long!';
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isExport = searchParams.get('export') === 'json';

    const collection = await getPasswordsCollection();
    const passwords = await collection.find({ userId }).toArray();

    const migrations: Promise<unknown>[] = [];

    const decryptedPasswords = passwords.map((pwd: any) => {
      const plaintext = decryptPassword(pwd.password);

      if (isLegacyCiphertext(pwd.password)) {
        migrations.push(
          collection.updateOne(
            { _id: pwd._id },
            { $set: { password: encryptPassword(plaintext) } }
          )
        );
      }

      return { ...pwd, _id: pwd._id.toString(), password: plaintext };
    });

    if (migrations.length > 0) {
      Promise.all(migrations).catch((err) =>
        console.error('🔐 [Crypto] 🟡 Legacy migration failed:', err)
      );
    }

    if (isExport) {
      const entries: ExportedPasswordEntry[] = decryptedPasswords.map((p) => ({
        title: p.title,
        username: p.username,
        password: p.password,
        url: p.url || '',
        notes: p.notes || '',
        category: p.category || 'Other',
      }));

      const exportPayload: VaultExport = {
        format: 'SkelVault-Export',
        version: 1,
        exportedAt: new Date().toISOString(),
        count: entries.length,
        entries,
      };

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="SkelVault-Export-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      });
    }

    return NextResponse.json(decryptedPasswords);
  } catch (error) {
    console.error('GET /api/passwords error:', error);
    return NextResponse.json({ error: 'Failed to fetch passwords!' }, { status: 500 });
  }
}

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
      { name: 'passwords-write', limit: 60, windowSeconds: 60 },
      userId
    );
    if (limitResponse) return limitResponse;

    const body = await request.json().catch(() => null);
    const validationError = validatePasswordBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const collection = await getPasswordsCollection();

    const newPassword = {
      userId,
      title: body.title.trim(),
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
        ...newPassword,
        _id: result.insertedId.toString(),
        password: body.password,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/passwords error:', error);
    return NextResponse.json({ error: 'Failed to create password!' }, { status: 500 });
  }
}
