import type { Appointment, Master, Service } from '@prisma/client';

export type AppointmentFull = Appointment & {
  master: Master | null;
  service: Service | null;
};

const STATUS_EMOJI: Record<string, string> = {
  PENDING: '⏳',
  CONFIRMED: '✅',
  COMPLETED: '✔️',
  CANCELLED: '❌',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

/** HH:MM + durationMin → end time string */
export function calcEndTime(startTime: string, durationMin: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + durationMin;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/** "11:00–11:45" or just "11:00" if no duration */
export function formatTimeRange(a: AppointmentFull): string {
  if (a.service?.durationMin) {
    return `${a.time}–${calcEndTime(a.time, a.service.durationMin)}`;
  }
  return a.time;
}

/** Full detail card (used in notifications and schedule detail view) */
export function formatAppointment(a: AppointmentFull, showStatus = true): string {
  const date = new Date(a.date);
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lines: string[] = [];

  if (showStatus) {
    const emoji = STATUS_EMOJI[a.status] ?? '❓';
    const label = STATUS_LABEL[a.status] ?? a.status;
    lines.push(`${emoji} <b>${label}</b>`);
  }

  lines.push(`👤 <b>${a.clientName}</b>`);
  lines.push(`📞 ${a.clientPhone}`);

  if (a.service) {
    const dur = a.service.durationMin ? ` (${a.service.durationMin} мин)` : '';
    lines.push(`✂️ ${a.service.name}${dur}`);
  }

  const timeRange = formatTimeRange(a);
  lines.push(`📆 ${dateStr}, ${timeRange}`);

  if (a.master) {
    lines.push(`👨‍🎨 ${a.master.name}`);
  } else {
    lines.push(`👨‍🎨 Мастер не назначен`);
  }

  if (a.comment) {
    lines.push(`💬 ${a.comment}`);
  }

  return lines.join('\n');
}

/** Short line for list views */
export function formatAppointmentShort(a: AppointmentFull, index: number): string {
  const date = new Date(a.date);
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const masterName = a.master?.name ?? 'без мастера';
  const serviceName = a.service?.name ?? 'услуга не указана';
  return `${index}. ${dateStr} ${a.time} — ${a.clientName} (${serviceName}, ${masterName})`;
}

/** Format date header for schedule views */
export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Format day button label: "Пн 15 апр" */
export function formatDayButton(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return `${weekday} ${day}`;
}

/** Group YYYY-MM-DD strings by "Месяц YYYY" */
export function groupDatesByMonth(dates: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const d of dates) {
    const date = new Date(d + 'T00:00:00');
    const key = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const arr = groups.get(key) ?? [];
    arr.push(d);
    groups.set(key, arr);
  }
  return groups;
}
