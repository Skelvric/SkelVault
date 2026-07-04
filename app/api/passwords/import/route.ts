export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPasswordsCollection } from '@/lib/mongodb';
import { encryptPassword } from '@/lib/crypto';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { enforceRateLimit } from '@/lib/rateLimit';
import { ImportMode } from '@/lib/types';

interface RawEntry {
  title?: unknown;
  username?: unknown;
  password?: unknown;
  url?: unknown;
  notes?: unknown;
  category?: unknown;
}

function normalizeEntries(raw: unknown): { entries: RawEntry[] | null; error: string | null } {
  let list: unknown;

  if (Array.isArray(raw)) {
    list = raw;
  } else if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as any).entries)
  ) {
    list = (raw as any).entries;
  } else {
    return { entries: null, error: 'Unrecognized file format. Expected a SkelVault export or an array of entries.' };
  }

  if (!Array.isArray(list) || list.length === 0) {
    return { entries: null, error: 'No entries found in the file!' };
  }

  if (list.length > 5000) {
    return { entries: null, error: 'Too many entries in a single import (max 5000).' };
  }

  return { entries: list as RawEntry[], error: null };
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
      { name: 'passwords-import', limit: 5, windowSeconds: 60 * 60 },
      userId
    );
    if (limitResponse) return limitResponse;

    const { searchParams } = new URL(request.url);
    const mode: ImportMode = searchParams.get('mode') === 'Replace' ? 'Replace' : 'Merge';

    const body = await request.json().catch(() => null);
    const { entries, error } = normalizeEntries(body);
    if (error || !entries) {
      return NextResponse.json({ error: error || 'Invalid import data!' }, { status: 400 });
    }

    const collection = await getPasswordsCollection();

    const skipped: number[] = [];
    const formatted = entries
      .map((item, index) => {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        const username = typeof item.username === 'string' ? item.username : '';
        const password = typeof item.password === 'string' ? item.password : '';

        if (!title || !password) {
          skipped.push(index);
          return null;
        }

        return {
          userId,
          title,
          username,
          password: encryptPassword(password),
          url: typeof item.url === 'string' ? item.url : '',
          notes: typeof item.notes === 'string' ? item.notes : '',
          category: typeof item.category === 'string' ? item.category : 'Other',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (formatted.length === 0) {
      return NextResponse.json(
        { error: 'No valid entries to import (each entry needs at least a title and password).' },
        { status: 400 }
      );
    }

    if (mode === 'Replace') {
      await collection.deleteMany({ userId });
    }

    await collection.insertMany(formatted);

    return NextResponse.json({
      success: true,
      mode,
      imported: formatted.length,
      skipped: skipped.length,
    });
  } catch (err) {
    console.error('Import Error:', err);
    return NextResponse.json({ error: 'Import failed!' }, { status: 500 });
  }
}
