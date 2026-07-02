export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPasswordsCollection } from '@/lib/mongodb';
import { encryptPassword } from '@/lib/crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_AUTH_SECRET!;

function getUserIdFromToken(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.id;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized!' }, { status: 401 });
        }

        const body = await request.json();

        if (!Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: 'Invalid import data!' }, { status: 400 });
        }

        const collection = await getPasswordsCollection();

        const backup = await collection.find({ userId }).toArray();

        const formatted = body.map((item: any) => ({
            userId,
            title: item.title || '',
            username: item.username || '',
            password: encryptPassword(item.password || ''),
            url: item.url || '',
            notes: item.notes || '',
            category: item.category || 'Other',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await collection.deleteMany({ userId });
        await collection.insertMany(formatted);

        return NextResponse.json({
            success: true,
            imported: formatted.length,
            backedUp: backup.length,
        });

    } catch (err) {
        console.error('Import Error:', err);
        return NextResponse.json(
            { error: 'Import failed!' },
            { status: 500 }
        );
    }
}
