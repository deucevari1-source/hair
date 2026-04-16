import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramNotification, formatAppointmentNotification } from '@/lib/telegram';
import { requireAuth } from '@/lib/auth';

// POST - create appointment (public)
export async function POST(request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, date, time, serviceId, masterId, comment } = body;

    if (!clientName || !clientPhone || !date || !time) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }

    // Check slot availability if master + service specified
    if (masterId && serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { durationMin: true } });
      const duration = service?.durationMin ?? 60;

      const [hNew, mNew] = time.split(':').map(Number);
      const newStart = hNew * 60 + mNew;
      const newEnd   = newStart + duration;

      const dateStart = new Date(date + 'T00:00:00.000Z');
      dateStart.setUTCDate(dateStart.getUTCDate() - 1);
      const dateEnd = new Date(date + 'T23:59:59.999Z');
      dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

      const existing = await prisma.appointment.findMany({
        where: {
          masterId,
          date: { gte: dateStart, lte: dateEnd },
          status: { not: 'CANCELLED' },
        },
        include: { service: { select: { durationMin: true } } },
      });

      const dateStr = new Date(date).toISOString().slice(0, 10);
      const conflict = existing.some((a) => {
        const d = new Date(a.date);
        const utc = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
        if (utc !== dateStr) return false;
        const [hEx, mEx] = a.time.split(':').map(Number);
        const exStart = hEx * 60 + mEx;
        const exEnd   = exStart + (a.service?.durationMin ?? 60);
        return newStart < exEnd && newEnd > exStart;
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'Это время уже занято. Пожалуйста, выберите другое.', code: 'SLOT_TAKEN' },
          { status: 409 }
        );
      }
    }

    // Upsert client by phone
    const client = await prisma.client.upsert({
      where: { phone: clientPhone },
      update: { name: clientName, ...(clientEmail ? { email: clientEmail } : {}) },
      create: { name: clientName, phone: clientPhone, email: clientEmail || null },
    });

    const appointment = await prisma.appointment.create({
      data: {
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        date: new Date(date),
        time,
        comment: comment || null,
        serviceId: serviceId || null,
        masterId: masterId || null,
        clientId: client.id,
      },
      include: {
        service: true,
        master: true,
      },
    });

    // Send Telegram notification
    try {
      const message = formatAppointmentNotification(appointment, appointment.service, appointment.master);
      await sendTelegramNotification(message);
    } catch (e) {
      console.error('Telegram notification failed:', e);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/appointments error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET - list appointments (admin only)
export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const period = searchParams.get('period'); // 'upcoming' | 'past'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = {};
    if (status) where.status = status;
    if (period === 'upcoming') where.date = { gte: new Date() };
    if (period === 'past') where.date = { lt: new Date() };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: { service: true, master: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/appointments error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
