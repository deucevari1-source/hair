import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const admin = requireAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Whitelist editable fields — never trust client to set clientId/payment links/etc.
    const ALLOWED = ['status', 'comment', 'date', 'time', 'masterId', 'serviceId'];
    const data = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (data.date) data.date = new Date(data.date);

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { service: true, master: true },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('PATCH /api/appointments/[id] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const admin = requireAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/appointments/[id] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
