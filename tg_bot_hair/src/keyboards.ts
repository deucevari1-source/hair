import { InlineKeyboard } from 'grammy';
import type { Master } from '@prisma/client';
import { formatTimeRange, formatDayButton, groupDatesByMonth, type AppointmentFull } from './formatters';

// ─── Main menus ───────────────────────────────────────────────────────────────

export function adminMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('⏳ Ожидают подтверждения', 'admin_pending').row()
    .text('📋 Записи на сегодня', 'admin_today').row()
    .text('📅 Предстоящие записи', 'admin_upcoming').row()
    .text('🔗 Пригласить мастера', 'admin_invite_master');
}

export function masterMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📅 Предстоящие записи', 'master_upcoming').row()
    .text('📋 Записи на сегодня', 'master_today');
}

// ─── Back buttons ─────────────────────────────────────────────────────────────

export function backAdminKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('◀️ Главное меню', 'menu_admin');
}

export function backMasterKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('◀️ Главное меню', 'menu_master');
}

// ─── Today schedule ───────────────────────────────────────────────────────────

/** One button per appointment: "11:00–11:45 · Мастер" (admin) or "11:00–11:45 · Клиент" (master) */
export function todaySlotsKeyboard(
  appointments: AppointmentFull[],
  role: 'admin' | 'master',
): InlineKeyboard {
  const prefix = role === 'admin' ? 'a_today_' : 'm_today_';
  const backCb = role === 'admin' ? 'menu_admin' : 'menu_master';
  const kb = new InlineKeyboard();

  for (const a of appointments) {
    const time = formatTimeRange(a);
    const label = role === 'admin'
      ? `${time} · ${a.master?.name ?? 'без мастера'}`
      : `${time} · ${a.clientName}`;
    kb.text(label, `${prefix}${a.id}`).row();
  }

  kb.text('◀️ Главное меню', backCb);
  return kb;
}

/** Detail view keyboard with back to today */
export function detailFromTodayKeyboard(
  appointmentId: string,
  status: string,
  role: 'admin' | 'master',
): InlineKeyboard {
  const backCb = role === 'admin' ? 'back_sched_admin' : 'back_sched_master';
  const kb = new InlineKeyboard();

  if (role === 'admin') {
    if (status === 'PENDING') {
      kb.text('✅ Подтвердить', `approve_${appointmentId}`)
        .text('❌ Отклонить', `reject_${appointmentId}`).row()
        .text('👨‍🎨 Назначить мастера', `assign_${appointmentId}`).row();
    } else if (status === 'CONFIRMED') {
      kb.text('❌ Отменить', `reject_${appointmentId}`)
        .text('👨‍🎨 Сменить мастера', `assign_${appointmentId}`).row();
    }
  }

  kb.text('◀️ Назад к расписанию', backCb);
  return kb;
}

// ─── Upcoming schedule ────────────────────────────────────────────────────────

/** Day picker: groups dates by month, 3 per row */
export function upcomingDaysKeyboard(
  dates: string[],
  role: 'admin' | 'master',
): InlineKeyboard {
  const prefix = role === 'admin' ? 'a_upd_' : 'm_upd_';
  const backCb = role === 'admin' ? 'menu_admin' : 'menu_master';
  const groups = groupDatesByMonth(dates);
  const kb = new InlineKeyboard();

  for (const [month, ds] of groups) {
    kb.text(`── ${month} ──`, 'noop').row();
    ds.forEach((d, i) => {
      kb.text(formatDayButton(d), `${prefix}${d}`);
      if (i % 3 === 2) kb.row();
    });
    if (ds.length % 3 !== 0) kb.row();
  }

  kb.text('◀️ Главное меню', backCb);
  return kb;
}

/** Time slots for a specific day: "11:00–11:45 · Мастер" or "11:00–11:45 · Клиент" */
export function daySlotsKeyboard(
  appointments: AppointmentFull[],
  date: string,
  role: 'admin' | 'master',
): InlineKeyboard {
  const prefix = role === 'admin' ? `a_slot_${date}_` : `m_slot_${date}_`;
  const backCb = role === 'admin' ? 'back_upd_admin' : 'back_upd_master';
  const kb = new InlineKeyboard();

  for (const a of appointments) {
    const time = formatTimeRange(a);
    const label = role === 'admin'
      ? `${time} · ${a.master?.name ?? 'без мастера'}`
      : `${time} · ${a.clientName}`;
    kb.text(label, `${prefix}${a.id}`).row();
  }

  kb.text('◀️ Назад к дням', backCb);
  return kb;
}

/** Detail view keyboard with back to specific day */
export function detailFromDayKeyboard(
  appointmentId: string,
  status: string,
  date: string,
  role: 'admin' | 'master',
): InlineKeyboard {
  // back_day_<date>_a or back_day_<date>_m
  const backCb = `back_day_${date}_${role === 'admin' ? 'a' : 'm'}`;
  const kb = new InlineKeyboard();

  if (role === 'admin') {
    if (status === 'PENDING') {
      kb.text('✅ Подтвердить', `approve_${appointmentId}`)
        .text('❌ Отклонить', `reject_${appointmentId}`).row()
        .text('👨‍🎨 Назначить мастера', `assign_${appointmentId}`).row();
    } else if (status === 'CONFIRMED') {
      kb.text('❌ Отменить', `reject_${appointmentId}`)
        .text('👨‍🎨 Сменить мастера', `assign_${appointmentId}`).row();
    }
  }

  kb.text('◀️ Назад к дню', backCb);
  return kb;
}

// ─── Notification keyboards (used by poller — standalone messages) ─────────────

export function appointmentActionKeyboard(appointmentId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Подтвердить', `approve_${appointmentId}`)
    .text('❌ Отклонить', `reject_${appointmentId}`)
    .row()
    .text('👨‍🎨 Назначить мастера', `assign_${appointmentId}`);
}

export function confirmedAppointmentKeyboard(appointmentId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('❌ Отменить', `reject_${appointmentId}`)
    .text('👨‍🎨 Сменить мастера', `assign_${appointmentId}`);
}

// ─── Master assignment ────────────────────────────────────────────────────────

export function masterSelectKeyboard(
  appointmentId: string,
  masters: Master[],
): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const m of masters) {
    kb.text(m.name, `assignto_${appointmentId}_${m.id}`).row();
  }
  kb.text('◀️ Назад к записи', `back_${appointmentId}`);
  return kb;
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export function masterInviteListKeyboard(masters: Master[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const m of masters) {
    const linked = m.telegramId ? '✅ ' : '';
    kb.text(`${linked}${m.name}`, `gen_link_${m.id}`).row();
  }
  kb.text('◀️ Главное меню', 'menu_admin');
  return kb;
}

export function afterGenLinkKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('◀️ К списку мастеров', 'admin_invite_master').row()
    .text('🏠 Главное меню', 'menu_admin');
}

// ─── Role selection ───────────────────────────────────────────────────────────

export function roleSelectKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('👑 Администратор', 'reg_admin')
    .text('👨‍🎨 Мастер', 'reg_master');
}
