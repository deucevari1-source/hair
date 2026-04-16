import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
