import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const count = await prisma.clientPrompt.count({
    where: { status: 'ANSWERED', adminReadAt: null, source: 'ADMIN' },
  });
  return NextResponse.json({ count });
}
