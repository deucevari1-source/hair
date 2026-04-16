import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to');     // YYYY-MM-DD

  const dateFilter = {};
  if (from) dateFilter.gte = new Date(from + 'T00:00:00.000Z');
  if (to)   dateFilter.lte = new Date(to   + 'T23:59:59.999Z');

  const payments = await prisma.payment.findMany({
    where: Object.keys(dateFilter).length ? { paidAt: dateFilter } : {},
    include: {
      appointment: {
        include: {
          service: { select: { id: true, name: true, categoryId: true } },
          master:  { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { paidAt: 'asc' },
  });

  // Totals
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  // By master
  const masterMap = {};
  for (const p of payments) {
    const m = p.appointment.master;
    if (!m) continue;
    if (!masterMap[m.id]) masterMap[m.id] = { id: m.id, name: m.name, total: 0, count: 0 };
    masterMap[m.id].total += p.amount;
    masterMap[m.id].count += 1;
  }
  const byMaster = Object.values(masterMap).sort((a, b) => b.total - a.total);

  // By service
  const serviceMap = {};
  for (const p of payments) {
    const s = p.appointment.service;
    if (!s) continue;
    if (!serviceMap[s.id]) serviceMap[s.id] = { id: s.id, name: s.name, total: 0, count: 0 };
    serviceMap[s.id].total += p.amount;
    serviceMap[s.id].count += 1;
  }
  const byService = Object.values(serviceMap).sort((a, b) => b.total - a.total);

  // Daily breakdown
  const dailyMap = {};
  for (const p of payments) {
    const day = p.paidAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, total: 0, count: 0 };
    dailyMap[day].total += p.amount;
    dailyMap[day].count += 1;
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ totalRevenue, byMethod, byMaster, byService, daily, count: payments.length });
}
