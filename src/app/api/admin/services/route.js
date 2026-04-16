import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      services: { orderBy: { sortOrder: 'asc' } },
    },
  });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    
    if (body.type === 'category') {
      const category = await prisma.serviceCategory.create({
        data: { name: body.name, sortOrder: body.sortOrder || 0 },
      });
      return NextResponse.json({ category }, { status: 201 });
    }

    const service = await prisma.service.create({ data: body });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
