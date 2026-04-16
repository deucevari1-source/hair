import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramNotification, formatEnrollmentNotification } from '@/lib/telegram';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, courseId } = body;

    if (!name || !phone || !courseId) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        name,
        phone,
        email: email || null,
        courseId,
      },
    });

    // Send Telegram notification
    try {
      const message = formatEnrollmentNotification(enrollment, course);
      await sendTelegramNotification(message);
    } catch (e) {
      console.error('Telegram notification failed:', e);
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/enrollments error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
