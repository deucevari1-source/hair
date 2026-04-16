import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

async function enrichWithMasterPrices(appointments) {
  const pairs = appointments.filter((a) => a.masterId && a.serviceId);
  if (!pairs.length) return appointments;

  const masterServices = await prisma.masterService.findMany({
    where: { OR: pairs.map((a) => ({ masterId: a.masterId, serviceId: a.serviceId })) },
    select: { masterId: true, serviceId: true, priceFrom: true, priceTo: true },
  });

  const priceMap = {};
  masterServices.forEach((ms) => { priceMap[`${ms.masterId}:${ms.serviceId}`] = ms; });

  return appointments.map((a) => ({
    ...a,
    masterPrice: a.masterId && a.serviceId
      ? (priceMap[`${a.masterId}:${a.serviceId}`] ?? null)
      : null,
  }));
}

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to   = searchParams.get('to');   // YYYY-MM-DD
  const masterId = searchParams.get('masterId');

  if (!from || !to) return NextResponse.json({ error: 'from and to required' }, { status: 400 });

  const start = new Date(from + 'T00:00:00.000Z');
  const end   = new Date(to   + 'T23:59:59.999Z');

  const where = {
    date: { gte: start, lte: end },
    ...(masterId ? { masterId } : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      service: { select: { id: true, name: true, durationMin: true, priceFrom: true } },
      master:  { select: { id: true, name: true } },
      client:  { select: { id: true, name: true, phone: true } },
      payment: true,
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const enrichedAppointments = await enrichWithMasterPrices(appointments);

  return NextResponse.json({ appointments: enrichedAppointments });
}

export async function PATCH(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, date, time, masterId } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data = {};
  if (date)     data.date     = new Date(date + 'T00:00:00.000Z');
  if (time)     data.time     = time;
  if (masterId !== undefined) data.masterId = masterId || null;

  const appointment = await prisma.appointment.update({
    where: { id },
    data,
    include: {
      service: { select: { id: true, name: true, durationMin: true } },
      master:  { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ appointment });
}
