import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      pendingAppointments,
      totalMasters,
      totalProducts,
      totalCourses,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { date: { gte: today, lt: weekFromNow } } }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.master.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { service: true, master: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        pendingAppointments,
        totalMasters,
        totalProducts,
        totalCourses,
      },
      recentAppointments,
    });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
