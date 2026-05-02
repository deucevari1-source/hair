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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  if (clients.length === 0) {
    return NextResponse.json({ clients: [], total, page, totalPages: 0 });
  }

  const clientIds = clients.map((c) => c.id);

  // visit counts (COMPLETED only) and last visit dates — aggregate in DB, not in JS.
  const [visitGroups, lastVisitGroups, paidGroups] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['clientId'],
      where: { clientId: { in: clientIds }, status: 'COMPLETED' },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ['clientId'],
      where: { clientId: { in: clientIds }, status: { not: 'CANCELLED' } },
      _max: { date: true },
    }),
    prisma.payment.groupBy({
      by: ['appointmentId'],
      where: {
        appointment: { clientId: { in: clientIds } },
      },
      _sum: { amount: true },
    }),
  ]);

  const visitMap = new Map(visitGroups.map((g) => [g.clientId, g._count._all]));
  const lastMap = new Map(lastVisitGroups.map((g) => [g.clientId, g._max.date]));

  // For totalSpent we need to map payment.appointmentId → clientId. Fetch the bridge once.
  const paidApptIds = paidGroups.map((g) => g.appointmentId);
  const apptOwners = paidApptIds.length > 0
    ? await prisma.appointment.findMany({
        where: { id: { in: paidApptIds } },
        select: { id: true, clientId: true },
      })
    : [];
  const owner = new Map(apptOwners.map((a) => [a.id, a.clientId]));
  const spentMap = new Map();
  for (const g of paidGroups) {
    const cid = owner.get(g.appointmentId);
    if (!cid) continue;
    spentMap.set(cid, (spentMap.get(cid) ?? 0) + (g._sum.amount ?? 0));
  }

  const enriched = clients.map((c) => ({
    ...c,
    visitCount: visitMap.get(c.id) ?? 0,
    totalSpent: spentMap.get(c.id) ?? 0,
    lastVisit: lastMap.get(c.id) ?? null,
  }));

  return NextResponse.json({ clients: enriched, total, page, totalPages: Math.ceil(total / limit) });
}
