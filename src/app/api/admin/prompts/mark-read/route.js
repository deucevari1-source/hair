import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.clientPrompt.updateMany({
    where: { status: 'ANSWERED', adminReadAt: null, source: 'ADMIN' },
    data: { adminReadAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
