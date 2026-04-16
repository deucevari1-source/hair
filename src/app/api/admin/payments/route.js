import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { appointmentId, amount, method, note } = body;

  if (!appointmentId || amount == null) {
    return NextResponse.json({ error: 'appointmentId and amount required' }, { status: 400 });
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        amount: Math.round(Number(amount)),
        method: method || 'CASH',
        note: note || null,
      },
    });

    // Auto-complete the appointment when payment is recorded
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Payment already recorded for this appointment' }, { status: 409 });
    }
    console.error('POST /api/admin/payments error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('appointmentId');
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });

  await prisma.payment.delete({ where: { appointmentId } });
  return NextResponse.json({ success: true });
}
