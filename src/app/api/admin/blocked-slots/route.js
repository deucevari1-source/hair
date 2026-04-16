import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { masterId, date, time, comment } = await request.json();
    if (!masterId || !date || !time) {
      return NextResponse.json({ error: 'masterId, date, time required' }, { status: 400 });
    }
    const slot = await prisma.blockedSlot.create({
      data: { masterId, date, time, comment: comment || null },
    });
    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slot already blocked' }, { status: 409 });
    }
    console.error('POST /api/admin/blocked-slots error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
