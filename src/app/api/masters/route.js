import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const masters = await prisma.master.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          include: { service: true },
        },
      },
    });

    return NextResponse.json({ masters });
  } catch (error) {
    console.error('GET /api/masters error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
