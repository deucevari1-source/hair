/**
 * Adds more COMPLETED and CONFIRMED appointments for the last 2 months
 * without touching existing data or products/courses.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rnd    = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (pct) => Math.random() * 100 < pct;
const pad    = (n) => String(n).padStart(2, '0');

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeStr(h, m) {
  return `${pad(h)}:${pad(m)}`;
}

const COMMENTS = [
  'Хочу освежить цвет',
  'Просьба не трогать длину',
  'Постоянная клиентка',
  'Аллергия на аммиак',
  'Хочу попробовать новый образ',
  'Стандартная стрижка как в прошлый раз',
  'Готовлюсь к мероприятию',
  null, null, null, null,
];

async function main() {
  const TODAY    = new Date('2026-04-13T00:00:00.000Z');
  const FROM     = addDays(TODAY, -60); // 2 months back
  const TO_PAST  = addDays(TODAY, -1);  // yesterday

  // Load masters with their services
  const masters = await prisma.master.findMany({
    where: { isActive: true },
    include: { services: { include: { service: true } } },
  });

  // Load all clients
  const clients = await prisma.client.findMany();

  if (clients.length === 0) {
    console.error('No clients found — run seed first');
    process.exit(1);
  }

  // Master working hours (mirrors seed data)
  const masterHours = {
    'Анна Светлова':   { workDays: [1,2,3,4,5,6], start: 9,  end: 19, satStart: 10, satEnd: 16 },
    'Мария Краснова':  { workDays: [1,2,3,5,6],   start: 10, end: 20, satStart: 10, satEnd: 18 },
    'Дмитрий Орлов':   { workDays: [2,3,4,5,6],   start: 9,  end: 18, satStart: 9,  satEnd: 15 },
  };

  let created = 0;

  for (const master of masters) {
    const hours = masterHours[master.name];
    if (!hours) continue;

    const masterSvcs = master.services.map((ms) => ms.service).filter(Boolean);
    if (masterSvcs.length === 0) continue;

    let cursor = new Date(FROM);
    while (cursor <= TO_PAST) {
      const dow     = cursor.getDay();
      const jsToMon = dow === 0 ? 7 : dow;
      const isSat   = dow === 6;

      if (!hours.workDays.includes(jsToMon)) {
        cursor = addDays(cursor, 1);
        continue;
      }

      const dateStr  = toDateStr(cursor);
      const startH   = isSat ? hours.satStart : hours.start;
      const endH     = isSat ? hours.satEnd   : hours.end;

      // Check existing appointments on this day for this master
      const existing = await prisma.appointment.findMany({
        where: { masterId: master.id, date: new Date(`${dateStr}T00:00:00.000Z`) },
        select: { time: true, service: { select: { durationMin: true } } },
      });

      const occupiedMins = existing.map(({ time, service }) => {
        const [h, m] = time.split(':').map(Number);
        const start  = h * 60 + m;
        return [start, start + (service?.durationMin ?? 60)];
      });

      // Add 3–6 completed appointments per day
      const target = rnd(3, 6);

      for (let i = 0; i < target; i++) {
        const service = pick(masterSvcs);
        const dur     = service.durationMin;

        const freeStarts = [];
        for (let h = startH; h < endH; h++) {
          for (let m = 0; m < 60; m += 30) {
            const s = h * 60 + m;
            const e = s + dur;
            if (e > endH * 60) continue;
            if (!occupiedMins.some(([os, oe]) => s < oe && e > os)) {
              freeStarts.push(s);
            }
          }
        }
        if (freeStarts.length === 0) break;

        const startMin = pick(freeStarts);
        occupiedMins.push([startMin, startMin + dur]);

        const client  = pick(clients);
        const timeStr = toTimeStr(Math.floor(startMin / 60), startMin % 60);

        // Last 2 months: mostly COMPLETED, a few CANCELLED
        const status = chance(92) ? 'COMPLETED' : 'CANCELLED';

        const appt = await prisma.appointment.create({
          data: {
            clientName:  client.name,
            clientPhone: client.phone,
            date:        new Date(`${dateStr}T00:00:00.000Z`),
            time:        timeStr,
            status,
            masterId:    master.id,
            serviceId:   service.id,
            clientId:    client.id,
            comment:     chance(20) ? pick(COMMENTS.filter(Boolean)) : null,
          },
        });
        created++;

        if (status === 'COMPLETED') {
          await prisma.payment.create({
            data: {
              appointmentId: appt.id,
              amount:        service.priceFrom,
              method:        pick(['CASH','CASH','CARD','CARD','ONLINE']),
              paidAt:        new Date(`${dateStr}T${timeStr}:00.000Z`),
            },
          });
        }
      }

      cursor = addDays(cursor, 1);
    }

    // Add CONFIRMED appointments for the next 14 days
    cursor = new Date(TODAY);
    while (cursor <= addDays(TODAY, 14)) {
      const dow     = cursor.getDay();
      const jsToMon = dow === 0 ? 7 : dow;
      const isSat   = dow === 6;

      if (!hours.workDays.includes(jsToMon)) {
        cursor = addDays(cursor, 1);
        continue;
      }

      const dateStr = toDateStr(cursor);
      const startH  = isSat ? hours.satStart : hours.start;
      const endH    = isSat ? hours.satEnd   : hours.end;

      const existing = await prisma.appointment.findMany({
        where: { masterId: master.id, date: new Date(`${dateStr}T00:00:00.000Z`) },
        select: { time: true, service: { select: { durationMin: true } } },
      });

      const occupiedMins = existing.map(({ time, service }) => {
        const [h, m] = time.split(':').map(Number);
        const s = h * 60 + m;
        return [s, s + (service?.durationMin ?? 60)];
      });

      const target = rnd(2, 4);

      for (let i = 0; i < target; i++) {
        const service = pick(masterSvcs);
        const dur     = service.durationMin;

        const freeStarts = [];
        for (let h = startH; h < endH; h++) {
          for (let m = 0; m < 60; m += 30) {
            const s = h * 60 + m;
            const e = s + dur;
            if (e > endH * 60) continue;
            if (!occupiedMins.some(([os, oe]) => s < oe && e > os)) {
              freeStarts.push(s);
            }
          }
        }
        if (freeStarts.length === 0) break;

        const startMin = pick(freeStarts);
        occupiedMins.push([startMin, startMin + dur]);

        const client  = pick(clients);
        const timeStr = toTimeStr(Math.floor(startMin / 60), startMin % 60);

        await prisma.appointment.create({
          data: {
            clientName:  client.name,
            clientPhone: client.phone,
            date:        new Date(`${dateStr}T00:00:00.000Z`),
            time:        timeStr,
            status:      'CONFIRMED',
            masterId:    master.id,
            serviceId:   service.id,
            clientId:    client.id,
            comment:     chance(15) ? pick(COMMENTS.filter(Boolean)) : null,
          },
        });
        created++;
      }

      cursor = addDays(cursor, 1);
    }
  }

  console.log(`✅ Done — added ${created} appointments`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
