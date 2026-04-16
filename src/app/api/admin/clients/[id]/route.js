import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { service: true, master: true, payment: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const visits = client.appointments.filter((a) => a.status === 'COMPLETED');
  const totalSpent = visits.reduce((sum, a) => sum + (a.payment?.amount ?? 0), 0);
  return NextResponse.json({ client: { ...client, visitCount: visits.length, totalSpent } });
}

export async function PUT(request, { params }) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { notes, preferences, name, email } = body;

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(notes !== undefined && { notes }),
      ...(preferences !== undefined && { preferences }),
    },
  });

  return NextResponse.json({ client });
}
