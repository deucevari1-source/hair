import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const masters = await prisma.master.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { appointments: true } } },
  });
  return NextResponse.json({ masters });
}

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const master = await prisma.master.create({ data: body });
    return NextResponse.json({ master }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}
