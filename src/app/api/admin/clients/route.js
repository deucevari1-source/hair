import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '30');

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        appointments: {
          where: { status: { not: 'CANCELLED' } },
          include: { service: true, payment: true },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  // Aggregate stats per client
  const enriched = clients.map((c) => {
    const visits = c.appointments.filter((a) => a.status === 'COMPLETED');
    const totalSpent = visits.reduce((sum, a) => sum + (a.payment?.amount ?? 0), 0);
    const lastVisit = c.appointments[0]?.date ?? null;
    return { ...c, visitCount: visits.length, totalSpent, lastVisit };
  });

  return NextResponse.json({ clients: enriched, total, page, totalPages: Math.ceil(total / limit) });
}
