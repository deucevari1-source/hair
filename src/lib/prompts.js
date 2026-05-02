// Settings & helpers for the client prompt system

import petrovich from 'petrovich';

// How many days after an appointment a "Repeat visit" prompt is auto-generated.
// 0 = immediate (testing). Bump to 10 for production.
export const REPEAT_BOOKING_DELAY_DAYS = 0;

// expiresAt column is required in DB but we no longer auto-expire prompts.
// Use a far-future date so the field stays valid without affecting visibility.
export function makeExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 100);
  return d;
}

// Russian male names ending in -а/-я (would otherwise be misclassified as female)
const MALE_NAMES_VOWEL_ENDING = new Set([
  'Илья', 'Никита', 'Лука', 'Фома', 'Кузьма', 'Савва', 'Иона', 'Иосия',
  'Ваня', 'Саша', 'Миша', 'Гоша', 'Дима', 'Витя', 'Петя', 'Сережа',
  'Леша', 'Юра', 'Слава', 'Вася', 'Гена', 'Боря', 'Сеня', 'Ваня',
  'Жора', 'Толя', 'Коля', 'Веня', 'Леня', 'Сема', 'Стёпа', 'Степа',
]);

function detectGender({ first, last }) {
  if (last) {
    const l = last.toLowerCase();
    if (l.endsWith('ова') || l.endsWith('ева') || l.endsWith('ёва') ||
        l.endsWith('ина') || l.endsWith('ына') ||
        l.endsWith('ская') || l.endsWith('цкая') || l.endsWith('ая')) return 'female';
    if (l.endsWith('ов') || l.endsWith('ев') || l.endsWith('ёв') ||
        l.endsWith('ин') || l.endsWith('ын') ||
        l.endsWith('ский') || l.endsWith('цкий') || l.endsWith('ой') || l.endsWith('ий')) return 'male';
  }
  if (first) {
    if (MALE_NAMES_VOWEL_ENDING.has(first)) return 'male';
    const f = first.toLowerCase();
    if (f.endsWith('а') || f.endsWith('я')) return 'female';
  }
  return 'male'; // sensible default — matches more of our actual masters
}

function splitFullName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { first: parts[0] };
  if (parts.length === 2) return { first: parts[0], last: parts[1] };
  // 3+ words: assume "Имя Отчество Фамилия" (Russian convention)
  return { first: parts[0], middle: parts[1], last: parts.slice(2).join(' ') };
}

export function declineToDative(fullName) {
  if (!fullName) return fullName;
  try {
    const parts = splitFullName(fullName);
    if (!parts) return fullName;
    const gender = detectGender(parts);
    const result = petrovich({ ...parts, gender }, 'dative');
    return [result.first, result.middle, result.last].filter(Boolean).join(' ');
  } catch {
    return fullName;
  }
}

export function buildRepeatBookingPrompt(appointment) {
  const masterName = appointment.master?.name
    ? declineToDative(appointment.master.name)
    : 'мастеру';
  const serviceName = appointment.service?.name || 'услугу';
  return {
    question: `Повторить запись к ${masterName} на «${serviceName}»?`,
    options: [
      {
        label: 'Да',
        action: 'BOOK',
        payload: {
          masterId: appointment.masterId,
          serviceId: appointment.serviceId,
        },
      },
      { label: 'Нет, спасибо', action: 'ACK' },
    ],
  };
}

export async function maybeCreateRepeatBookingPrompt(prisma, clientId) {
  // Only one PENDING system repeat-booking prompt per client at a time.
  const activeSystem = await prisma.clientPrompt.findFirst({
    where: { clientId, source: 'SYSTEM', status: 'PENDING' },
  });
  if (activeSystem) return;

  const last = await prisma.appointment.findFirst({
    where: {
      clientId,
      status: { not: 'CANCELLED' },
      masterId: { not: null },
      serviceId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: { master: true, service: true },
  });
  if (!last) return;

  const ageDays = (Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < REPEAT_BOOKING_DELAY_DAYS) return;

  // Don't re-offer the same appointment after it was previously answered/expired.
  const everCreated = await prisma.clientPrompt.findFirst({
    where: { appointmentId: last.id, source: 'SYSTEM' },
  });
  if (everCreated) return;

  const { question, options } = buildRepeatBookingPrompt(last);
  await prisma.clientPrompt.create({
    data: {
      clientId,
      question,
      options,
      source: 'SYSTEM',
      appointmentId: last.id,
      expiresAt: makeExpiry(),
    },
  });
}

export async function getClientPrompts(prisma, clientId) {
  await maybeCreateRepeatBookingPrompt(prisma, clientId);
  return prisma.clientPrompt.findMany({
    where: { clientId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
}
