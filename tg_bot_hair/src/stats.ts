import { prisma } from './db';

function weekBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function buildAdminMenuText(): Promise<string> {
  const { start: todayStart, end: todayEnd } = todayBounds();
  const { start: weekStart, end: weekEnd } = weekBounds();

  const [pending, today, week] = await Promise.all([
    prisma.appointment.count({
      where: { status: 'PENDING' },
    }),
    prisma.appointment.count({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.appointment.count({
      where: {
        date: { gte: weekStart, lte: weekEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),
  ]);

  const lines = [
    '<b>Главное меню</b>',
    '',
    `⏳ Ожидают подтверждения: <b>${pending}</b>`,
    `📋 Сегодня: <b>${today}</b>`,
    `📅 На этой неделе: <b>${week}</b>`,
  ];

  return lines.join('\n');
}

export async function buildMasterMenuText(masterId: string): Promise<string> {
  const { start: todayStart, end: todayEnd } = todayBounds();
  const { start: weekStart, end: weekEnd } = weekBounds();

  const [today, week] = await Promise.all([
    prisma.appointment.count({
      where: {
        masterId,
        date: { gte: todayStart, lte: todayEnd },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.appointment.count({
      where: {
        masterId,
        date: { gte: weekStart, lte: weekEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),
  ]);

  const lines = [
    '<b>Главное меню</b>',
    '',
    `📋 Сегодня: <b>${today}</b>`,
    `📅 На этой неделе: <b>${week}</b>`,
  ];

  return lines.join('\n');
}
