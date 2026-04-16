import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = await params;
  if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const schedule = await prisma.masterSchedule.findMany({
      where: { masterId: id },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ schedule });
  } catch (e) {
    console.error('GET schedule error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;
  if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { schedule } = await req.json();
    await prisma.masterSchedule.deleteMany({ where: { masterId: id } });
    if (schedule.length > 0) {
      await prisma.masterSchedule.createMany({
        data: schedule.map((s) => ({
          masterId: id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT schedule error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
