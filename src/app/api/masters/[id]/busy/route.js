import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); // "YYYY-MM-DD"

  if (!date) return NextResponse.json({ busy: [] });

  // Widen range by ±1 day to handle any server timezone offset,
  // then filter by exact UTC date string to get only the requested day.
  const start = new Date(date + 'T00:00:00.000Z');
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(date + 'T23:59:59.999Z');
  end.setUTCDate(end.getUTCDate() + 1);

  const [appointments, blockedSlots] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        masterId: id,
        date: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      include: { service: { select: { durationMin: true } } },
    }),
    prisma.blockedSlot.findMany({
      where: { masterId: id, date },
    }),
  ]);

  // Filter to exact date by comparing UTC date string
  const busy = [
    ...appointments
      .filter((a) => {
        const d = new Date(a.date);
        const utcDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        return utcDate === date;
      })
      .map((a) => ({ time: a.time, duration: a.service?.durationMin ?? 60 })),
    ...blockedSlots.map((b) => ({ time: b.time, duration: 30 })),
  ];

  return NextResponse.json({ busy });
}
