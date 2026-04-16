import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const { id } = await params;
  const schedule = await prisma.masterSchedule.findMany({
    where: { masterId: id },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ schedule });
}
