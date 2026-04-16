import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          ...(limit ? { take: parseInt(limit) } : {}),
        },
      },
    });

    // Also return flat list for booking form
    const allServices = categories.flatMap((c) => c.services);

    return NextResponse.json({ categories, services: allServices });
  } catch (error) {
    console.error('GET /api/services error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
