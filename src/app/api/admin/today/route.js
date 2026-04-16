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
  const date = searchParams.get('date'); // "YYYY-MM-DD"
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const [masters, appointments, blockedSlots] = await Promise.all([
    prisma.master.findMany({
      where: { isActive: true },
      include: { schedules: { where: { date } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { not: 'CANCELLED' },
      },
      include: { service: true, master: true, payment: true },
      orderBy: { time: 'asc' },
    }),
    prisma.blockedSlot.findMany({
      where: { date },
      orderBy: { time: 'asc' },
    }),
  ]);

  const enrichedAppointments = await enrichWithMasterPrices(appointments);

  return NextResponse.json({ masters, appointments: enrichedAppointments, blockedSlots });
}
