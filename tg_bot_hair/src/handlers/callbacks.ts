import type { Context } from 'grammy';
import { prisma } from '../db';
import { createInviteToken, setState } from '../state';
import { buildAdminMenuText, buildMasterMenuText } from '../stats';
import {
  appointmentActionKeyboard,
  confirmedAppointmentKeyboard,
  masterSelectKeyboard,
  masterInviteListKeyboard,
  afterGenLinkKeyboard,
  backAdminKeyboard,
  backMasterKeyboard,
  adminMenu,
  masterMenu,
  todaySlotsKeyboard,
  detailFromTodayKeyboard,
  upcomingDaysKeyboard,
  daySlotsKeyboard,
  detailFromDayKeyboard,
} from '../keyboards';
import {
  formatAppointment,
  formatAppointmentShort,
  formatDateHeader,
  type AppointmentFull,
} from '../formatters';

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAdmin(ctx: Context): Promise<boolean> {
  const admin = await prisma.admin.findFirst({
    where: { telegramId: BigInt(ctx.chat!.id) },
  });
  if (!admin) { await ctx.answerCallbackQuery('Только для администраторов'); return false; }
  return true;
}

async function requireMaster(ctx: Context) {
  return prisma.master.findFirst({ where: { telegramId: BigInt(ctx.chat!.id) } });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export async function handleCallback(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data ?? '';

  // Ignore header "label" buttons
  if (data === 'noop') { await ctx.answerCallbackQuery(); return; }

  // Navigation
  if (data === 'menu_admin')  { await onMenuAdmin(ctx); return; }
  if (data === 'menu_master') { await onMenuMaster(ctx); return; }

  // Registration
  if (data === 'reg_admin')  { await onRegAdmin(ctx); return; }
  if (data === 'reg_master') { await onRegMaster(ctx); return; }

  // Admin menu actions
  if (data === 'admin_pending')       { await onAdminPending(ctx); return; }
  if (data === 'admin_today')         { await onAdminToday(ctx); return; }
  if (data === 'admin_upcoming')      { await onAdminUpcoming(ctx); return; }
  if (data === 'admin_invite_master') { await onAdminInviteMaster(ctx); return; }

  // Master menu actions
  if (data === 'master_today')    { await onMasterToday(ctx); return; }
  if (data === 'master_upcoming') { await onMasterUpcoming(ctx); return; }

  // Schedule: back to today grid
  if (data === 'back_sched_admin')  { await onAdminToday(ctx); return; }
  if (data === 'back_sched_master') { await onMasterToday(ctx); return; }

  // Schedule: back to day picker
  if (data === 'back_upd_admin')  { await onAdminUpcoming(ctx); return; }
  if (data === 'back_upd_master') { await onMasterUpcoming(ctx); return; }

  // Today slot tapped: a_today_<id> / m_today_<id>
  if (data.startsWith('a_today_')) { await onScheduleDetail(ctx, data.slice(8), 'today', 'admin'); return; }
  if (data.startsWith('m_today_')) { await onScheduleDetail(ctx, data.slice(8), 'today', 'master'); return; }

  // Upcoming day tapped: a_upd_<date> / m_upd_<date>
  if (data.startsWith('a_upd_')) { await onUpcomingDay(ctx, data.slice(6), 'admin'); return; }
  if (data.startsWith('m_upd_')) { await onUpcomingDay(ctx, data.slice(6), 'master'); return; }

  // Day slot tapped: a_slot_<date>_<id> / m_slot_<date>_<id>
  if (data.startsWith('a_slot_')) { await onDaySlotTapped(ctx, data.slice(7), 'admin'); return; }
  if (data.startsWith('m_slot_')) { await onDaySlotTapped(ctx, data.slice(7), 'master'); return; }

  // Back from day detail to day grid: back_day_<date>_a / back_day_<date>_m
  if (data.startsWith('back_day_')) {
    const parts = data.slice(9).split('_'); // <date-parts>..._a|m
    const role = parts.pop() === 'a' ? 'admin' : 'master';
    const date = parts.join('_'); // reassemble date (YYYY-MM-DD)
    await onUpcomingDay(ctx, date, role);
    return;
  }

  // Appointment actions (from notifications OR schedule detail)
  if (data.startsWith('approve_'))  { await onApprove(ctx, data.slice(8)); return; }
  if (data.startsWith('reject_'))   { await onReject(ctx, data.slice(7)); return; }
  if (data.startsWith('assign_'))   { await onAssignMenu(ctx, data.slice(7)); return; }
  if (data.startsWith('assignto_')) { await onAssignTo(ctx, data.slice(9)); return; }
  if (data.startsWith('back_'))     { await onBackToAppointment(ctx, data.slice(5)); return; }
  if (data.startsWith('gen_link_')) { await onGenLink(ctx, data.slice(9)); return; }

  await ctx.answerCallbackQuery();
}

// ─── Navigation ───────────────────────────────────────────────────────────────

async function onMenuAdmin(ctx: Context) {
  await ctx.answerCallbackQuery();
  const text = await buildAdminMenuText();
  await safeEdit(ctx, text, { parse_mode: 'HTML', reply_markup: adminMenu() });
}

async function onMenuMaster(ctx: Context) {
  await ctx.answerCallbackQuery();
  const master = await requireMaster(ctx);
  const text = master
    ? await buildMasterMenuText(master.id)
    : '<b>Главное меню</b>';
  await safeEdit(ctx, text, { parse_mode: 'HTML', reply_markup: masterMenu() });
}

// ─── Registration ─────────────────────────────────────────────────────────────

async function onRegAdmin(ctx: Context) {
  await ctx.answerCallbackQuery();
  setState(ctx.chat!.id, { step: 'awaiting_admin_secret' });
  await ctx.reply('Введите секретный код администратора:');
}

async function onRegMaster(ctx: Context) {
  await ctx.answerCallbackQuery();
  await ctx.reply('Для подключения как мастер попросите администратора выслать вам персональную ссылку через бот.');
}

// ─── Admin: pending list ──────────────────────────────────────────────────────

async function onAdminPending(ctx: Context) {
  await ctx.answerCallbackQuery();
  if (!(await requireAdmin(ctx))) return;

  const list = await prisma.appointment.findMany({
    where: { status: 'PENDING' },
    include: { master: true, service: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  if (!list.length) {
    await ctx.reply('Нет записей, ожидающих подтверждения ✅', { reply_markup: backAdminKeyboard() });
    return;
  }

  for (const a of list) {
    await ctx.reply(formatAppointment(a), {
      parse_mode: 'HTML',
      reply_markup: appointmentActionKeyboard(a.id),
    });
  }
  await ctx.reply(`Показано: ${list.length}`, { reply_markup: backAdminKeyboard() });
}

// ─── Today schedule ───────────────────────────────────────────────────────────

async function buildTodayList(masterId?: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return prisma.appointment.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      status: { not: 'CANCELLED' },
      ...(masterId ? { masterId } : {}),
    },
    include: { master: true, service: true },
    orderBy: { time: 'asc' },
  });
}

async function onAdminToday(ctx: Context) {
  await ctx.answerCallbackQuery();
  if (!(await requireAdmin(ctx))) return;

  const list = await buildTodayList();
  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long',
  });

  if (!list.length) {
    await safeEdit(ctx,
      `📋 <b>Сегодня, ${today}</b>\n\nЗаписей нет.`,
      { parse_mode: 'HTML', reply_markup: backAdminKeyboard() },
    );
    return;
  }

  await safeEdit(ctx,
    `📋 <b>Сегодня, ${today}</b> — ${list.length} запис${pluralRu(list.length)}\n\nВыберите время:`,
    { parse_mode: 'HTML', reply_markup: todaySlotsKeyboard(list, 'admin') },
  );
}

async function onMasterToday(ctx: Context) {
  await ctx.answerCallbackQuery();
  const master = await requireMaster(ctx);
  if (!master) { await ctx.reply('Вы не зарегистрированы. Используйте /start'); return; }

  const list = await buildTodayList(master.id);
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (!list.length) {
    await safeEdit(ctx,
      `📋 <b>Сегодня, ${today}</b>\n\nЗаписей нет.`,
      { parse_mode: 'HTML', reply_markup: backMasterKeyboard() },
    );
    return;
  }

  await safeEdit(ctx,
    `📋 <b>Сегодня, ${today}</b> — ${list.length} запис${pluralRu(list.length)}\n\nВыберите время:`,
    { parse_mode: 'HTML', reply_markup: todaySlotsKeyboard(list, 'master') },
  );
}

// Tapped a time slot in today view
async function onScheduleDetail(
  ctx: Context,
  appointmentId: string,
  source: 'today',
  role: 'admin' | 'master',
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { master: true, service: true },
  });
  if (!appointment) { await ctx.answerCallbackQuery('Запись не найдена'); return; }

  await ctx.answerCallbackQuery();
  await safeEdit(ctx,
    formatAppointment(appointment),
    {
      parse_mode: 'HTML',
      reply_markup: detailFromTodayKeyboard(appointmentId, appointment.status, role),
    },
  );
}

// ─── Upcoming schedule ────────────────────────────────────────────────────────

async function buildUpcomingDates(masterId?: string): Promise<string[]> {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: tomorrow },
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(masterId ? { masterId } : {}),
    },
    select: { date: true },
    orderBy: { date: 'asc' },
    take: 60,
  });

  // Deduplicate dates as YYYY-MM-DD strings
  const seen = new Set<string>();
  for (const a of appointments) {
    seen.add(a.date.toISOString().slice(0, 10));
  }
  return [...seen];
}

async function onAdminUpcoming(ctx: Context) {
  await ctx.answerCallbackQuery();
  if (!(await requireAdmin(ctx))) return;

  const dates = await buildUpcomingDates();

  if (!dates.length) {
    await safeEdit(ctx,
      '📅 <b>Предстоящие записи</b>\n\nЗаписей нет.',
      { parse_mode: 'HTML', reply_markup: backAdminKeyboard() },
    );
    return;
  }

  await safeEdit(ctx,
    `📅 <b>Предстоящие записи</b>\n\nВыберите день:`,
    { parse_mode: 'HTML', reply_markup: upcomingDaysKeyboard(dates, 'admin') },
  );
}

async function onMasterUpcoming(ctx: Context) {
  await ctx.answerCallbackQuery();
  const master = await requireMaster(ctx);
  if (!master) { await ctx.reply('Вы не зарегистрированы. Используйте /start'); return; }

  const dates = await buildUpcomingDates(master.id);

  if (!dates.length) {
    await safeEdit(ctx,
      '📅 <b>Предстоящие записи</b>\n\nЗаписей нет.',
      { parse_mode: 'HTML', reply_markup: backMasterKeyboard() },
    );
    return;
  }

  await safeEdit(ctx,
    `📅 <b>Предстоящие записи</b>\n\nВыберите день:`,
    { parse_mode: 'HTML', reply_markup: upcomingDaysKeyboard(dates, 'master') },
  );
}

// Tapped a day in upcoming picker
async function onUpcomingDay(ctx: Context, date: string, role: 'admin' | 'master') {
  const master = role === 'master' ? await requireMaster(ctx) : null;
  if (role === 'master' && !master) {
    await ctx.answerCallbackQuery('Ошибка авторизации');
    return;
  }
  if (role === 'admin' && !(await requireAdmin(ctx))) return;

  const dayStart = new Date(date + 'T00:00:00');
  const dayEnd = new Date(date + 'T23:59:59');

  const list = await prisma.appointment.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(master ? { masterId: master.id } : {}),
    },
    include: { master: true, service: true },
    orderBy: { time: 'asc' },
  });

  await ctx.answerCallbackQuery();

  const header = formatDateHeader(date);

  if (!list.length) {
    const backCb = role === 'admin' ? 'back_upd_admin' : 'back_upd_master';
    await safeEdit(ctx,
      `📅 <b>${header}</b>\n\nЗаписей нет.`,
      { parse_mode: 'HTML', reply_markup: new (await import('grammy')).InlineKeyboard().text('◀️ Назад к дням', backCb) },
    );
    return;
  }

  await safeEdit(ctx,
    `📅 <b>${header}</b> — ${list.length} запис${pluralRu(list.length)}\n\nВыберите время:`,
    { parse_mode: 'HTML', reply_markup: daySlotsKeyboard(list, date, role) },
  );
}

// Tapped a time slot in day view: payload = <date>_<appointmentId>
async function onDaySlotTapped(ctx: Context, payload: string, role: 'admin' | 'master') {
  // payload format: YYYY-MM-DD_<cuid>
  const dateMatch = payload.match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!dateMatch) { await ctx.answerCallbackQuery(); return; }

  const [, date, appointmentId] = dateMatch;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { master: true, service: true },
  });
  if (!appointment) { await ctx.answerCallbackQuery('Запись не найдена'); return; }

  await ctx.answerCallbackQuery();
  await safeEdit(ctx,
    formatAppointment(appointment),
    {
      parse_mode: 'HTML',
      reply_markup: detailFromDayKeyboard(appointmentId, appointment.status, date, role),
    },
  );
}

// ─── Appointment actions (notifications + schedule detail) ────────────────────

async function onApprove(ctx: Context, appointmentId: string) {
  if (!(await requireAdmin(ctx))) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { master: true, service: true },
  });
  if (!appointment) { await ctx.answerCallbackQuery('Запись не найдена'); return; }
  if (appointment.status !== 'PENDING') { await ctx.answerCallbackQuery('Уже обработана'); return; }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CONFIRMED' },
    include: { master: true, service: true },
  });

  await ctx.answerCallbackQuery('✅ Подтверждено');
  await ctx.editMessageText(
    `${formatAppointment(updated)}\n\n✅ <i>Подтверждено</i>`,
    { parse_mode: 'HTML', reply_markup: confirmedAppointmentKeyboard(appointmentId) },
  );

  if (updated.master?.telegramId) {
    await notifyMasterAssigned(ctx, updated.master.telegramId, updated);
  }
}

async function onReject(ctx: Context, appointmentId: string) {
  if (!(await requireAdmin(ctx))) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { master: true, service: true },
  });
  if (!appointment) { await ctx.answerCallbackQuery('Запись не найдена'); return; }
  if (appointment.status === 'CANCELLED') { await ctx.answerCallbackQuery('Уже отменена'); return; }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED' },
    include: { master: true, service: true },
  });

  await ctx.answerCallbackQuery('❌ Отменено');
  await ctx.editMessageText(
    `${formatAppointment(updated)}\n\n❌ <i>Отменено</i>`,
    { parse_mode: 'HTML' },
  );

  if (updated.master?.telegramId) {
    await notifyMasterCancelled(ctx, updated.master.telegramId, updated);
  }
}

async function onAssignMenu(ctx: Context, appointmentId: string) {
  if (!(await requireAdmin(ctx))) return;

  const masters = await prisma.master.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (!masters.length) { await ctx.answerCallbackQuery('Нет доступных мастеров'); return; }

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup({
    reply_markup: masterSelectKeyboard(appointmentId, masters),
  });
}

async function onAssignTo(ctx: Context, payload: string) {
  if (!(await requireAdmin(ctx))) return;

  const sepIdx = payload.indexOf('_');
  if (sepIdx === -1) { await ctx.answerCallbackQuery(); return; }

  const appointmentId = payload.slice(0, sepIdx);
  const masterId = payload.slice(sepIdx + 1);

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { masterId },
    include: { master: true, service: true },
  });

  await ctx.answerCallbackQuery(`👨‍🎨 Назначен: ${updated.master?.name}`);
  await ctx.editMessageText(formatAppointment(updated), {
    parse_mode: 'HTML',
    reply_markup: updated.status === 'CONFIRMED'
      ? confirmedAppointmentKeyboard(appointmentId)
      : appointmentActionKeyboard(appointmentId),
  });

  if (updated.status === 'CONFIRMED' && updated.master?.telegramId) {
    await notifyMasterAssigned(ctx, updated.master.telegramId, updated);
  }
}

async function onBackToAppointment(ctx: Context, appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { master: true, service: true },
  });
  await ctx.answerCallbackQuery();
  if (!appointment) return;

  await ctx.editMessageText(formatAppointment(appointment), {
    parse_mode: 'HTML',
    reply_markup: appointment.status === 'CONFIRMED'
      ? confirmedAppointmentKeyboard(appointmentId)
      : appointmentActionKeyboard(appointmentId),
  });
}

// ─── Admin: invite master ─────────────────────────────────────────────────────

async function onAdminInviteMaster(ctx: Context) {
  await ctx.answerCallbackQuery();
  if (!(await requireAdmin(ctx))) return;

  const masters = await prisma.master.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (!masters.length) {
    await ctx.reply('Нет активных мастеров. Добавьте мастеров через панель управления.', {
      reply_markup: backAdminKeyboard(),
    });
    return;
  }

  await ctx.reply(
    'Выберите мастера для генерации ссылки.\n✅ — уже привязан к Telegram:',
    { reply_markup: masterInviteListKeyboard(masters) },
  );
}

async function onGenLink(ctx: Context, masterId: string) {
  await ctx.answerCallbackQuery();
  if (!(await requireAdmin(ctx))) return;

  const master = await prisma.master.findUnique({ where: { id: masterId } });
  if (!master) { await ctx.reply('Мастер не найден.', { reply_markup: backAdminKeyboard() }); return; }

  const token = createInviteToken(masterId);
  const link = `https://t.me/${ctx.me.username}?start=m_${token}`;
  const alreadyLinked = master.telegramId
    ? '\n\n⚠️ Уже привязан — новая ссылка перепривяжет аккаунт.'
    : '';

  await ctx.reply(
    `Ссылка для <b>${master.name}</b>:\n\n<code>${link}</code>\n\nДействительна 24 ч.${alreadyLinked}`,
    { parse_mode: 'HTML', reply_markup: afterGenLinkKeyboard() },
  );
}

// ─── Master notifications ─────────────────────────────────────────────────────

async function notifyMasterAssigned(ctx: Context, telegramId: bigint, a: AppointmentFull) {
  try {
    const date = new Date(a.date);
    const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    await ctx.api.sendMessage(Number(telegramId),
      `📋 <b>Вам назначена запись!</b>\n\n` +
      `👤 ${a.clientName}\n📞 ${a.clientPhone}\n` +
      (a.service ? `✂️ ${a.service.name}\n` : '') +
      `📆 ${dateStr}, ${a.time}` +
      (a.comment ? `\n💬 ${a.comment}` : ''),
      { parse_mode: 'HTML' },
    );
  } catch { /* master hasn't started the bot */ }
}

async function notifyMasterCancelled(ctx: Context, telegramId: bigint, a: AppointmentFull) {
  try {
    const dateStr = new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    await ctx.api.sendMessage(Number(telegramId),
      `❌ <b>Запись отменена</b>\n\n👤 ${a.clientName}\n📆 ${dateStr}, ${a.time}`,
      { parse_mode: 'HTML' },
    );
  } catch { /* master hasn't started the bot */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Edit current message, fallback to reply if not possible */
async function safeEdit(
  ctx: Context,
  text: string,
  extra: Parameters<Context['editMessageText']>[1],
): Promise<void> {
  try {
    await ctx.editMessageText(text, extra);
  } catch {
    await ctx.reply(text, extra);
  }
}

function pluralRu(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'ь';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'и';
  return 'ей';
}
