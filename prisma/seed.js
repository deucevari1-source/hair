const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/* ── helpers ─────────────────────────────────────────────────────────── */
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

/* ── realistic data ──────────────────────────────────────────────────── */
const FIRST_NAMES_F = ['Анна','Мария','Екатерина','Ольга','Наталья','Татьяна','Алина','Юлия','Светлана','Виктория',
  'Дарья','Полина','Кристина','Елена','Ирина','Валерия','Надежда','Вероника','Александра','Людмила',
  'Маргарита','Диана','Жанна','Милена','Лилия','Анастасия','Галина','Инна','Регина','Карина'];
const FIRST_NAMES_M = ['Александр','Андрей','Дмитрий','Михаил','Сергей','Иван','Алексей','Артём','Максим','Никита',
  'Владимир','Денис','Роман','Евгений','Игорь','Павел','Антон','Виктор','Константин','Кирилл'];
const LAST_NAMES_F  = ['Иванова','Петрова','Сидорова','Козлова','Новикова','Морозова','Попова','Соколова',
  'Лебедева','Ковалёва','Зайцева','Семёнова','Гончарова','Королёва','Захарова','Орлова','Воронова',
  'Павлова','Громова','Федорова','Кузьмина','Белова','Крылова','Медведева','Смирнова'];
const LAST_NAMES_M  = ['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Попов','Соколов',
  'Лебедев','Ковалёв','Зайцев','Семёнов','Гончаров','Королёв','Захаров','Орлов','Воронов',
  'Павлов','Громов','Фёдоров','Кузьмин','Белов','Крылов','Медведев','Смирнов'];

const COMMENTS = [
  'Хочу освежить цвет',
  'Просьба не трогать длину',
  'Первый раз в вашем салоне',
  'Постоянная клиентка',
  'Аллергия на аммиак',
  'Свадьба через неделю',
  'Хочу попробовать новый образ',
  'Стандартная стрижка как в прошлый раз',
  null, null, null, null, null,
];

function genPhone() {
  const ops = ['29','33','44','25'];
  const op  = pick(ops);
  const n   = () => rnd(0, 9);
  return `+375${op}${n()}${n()}${n()}${n()}${n()}${n()}${n()}`;
}

function genClient(gender) {
  if (gender === 'M') {
    return { name: `${pick(FIRST_NAMES_M)} ${pick(LAST_NAMES_M)}`, phone: genPhone() };
  }
  return { name: `${pick(FIRST_NAMES_F)} ${pick(LAST_NAMES_F)}`, phone: genPhone() };
}

/* ── main ────────────────────────────────────────────────────────────── */
async function main() {
  console.log('🗑  Clearing existing data...');

  await prisma.payment.deleteMany({});
  await prisma.masterService.deleteMany({});
  await prisma.courseEnrollment.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.blockedSlot.deleteMany({});
  await prisma.masterSchedule.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.master.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.course.deleteMany({});

  /* ── admin ─────────────────────────────────────────────────────────── */
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@hairatelier.com' },
    update: {},
    create: { email: 'admin@hairatelier.com', password: hashedPassword, name: 'Администратор' },
  });

  /* ── settings ──────────────────────────────────────────────────────── */
  await prisma.salonSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      salonName: 'Hair Atelier',
      phone: '+375 (29) 123-45-67',
      email: 'info@hairatelier.com',
      address: 'г. Минск, ул. Богдановича, 14',
      workingHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-20:00',
      aboutText: 'Hair Atelier — пространство, где мастерство встречает стиль.',
    },
  });

  /* ── categories & services ─────────────────────────────────────────── */
  console.log('✂️  Creating services...');

  const catHair  = await prisma.serviceCategory.create({ data: { name: 'Стрижки',      sortOrder: 1 } });
  const catColor = await prisma.serviceCategory.create({ data: { name: 'Окрашивание',  sortOrder: 2 } });
  const catCare  = await prisma.serviceCategory.create({ data: { name: 'Уход',         sortOrder: 3 } });
  const catStyle = await prisma.serviceCategory.create({ data: { name: 'Укладки',      sortOrder: 4 } });

  // prices stored in kopecks (×100 BYN)
  const services = await Promise.all([
    prisma.service.create({ data: { name: 'Женская стрижка',          priceFrom:  8000, priceTo: null, durationMin:  60, categoryId: catHair.id,  sortOrder: 1 } }),
    prisma.service.create({ data: { name: 'Мужская стрижка',          priceFrom:  6000, priceTo: null, durationMin:  45, categoryId: catHair.id,  sortOrder: 2 } }),
    prisma.service.create({ data: { name: 'Детская стрижка',          priceFrom:  3500, priceTo: null, durationMin:  30, categoryId: catHair.id,  sortOrder: 3 } }),
    prisma.service.create({ data: { name: 'Однотонное окрашивание',   priceFrom: 12000, priceTo: null, durationMin: 120, categoryId: catColor.id, sortOrder: 1 } }),
    prisma.service.create({ data: { name: 'Мелирование',              priceFrom: 17000, priceTo: null, durationMin: 150, categoryId: catColor.id, sortOrder: 2 } }),
    prisma.service.create({ data: { name: 'Балаяж / Airtouch',        priceFrom: 22000, priceTo: null, durationMin: 180, categoryId: catColor.id, sortOrder: 3 } }),
    prisma.service.create({ data: { name: 'Кератиновое выпрямление',  priceFrom: 18000, priceTo: null, durationMin: 150, categoryId: catCare.id,  sortOrder: 1 } }),
    prisma.service.create({ data: { name: 'Ботокс для волос',         priceFrom: 13000, priceTo: null, durationMin: 120, categoryId: catCare.id,  sortOrder: 2 } }),
    prisma.service.create({ data: { name: 'Вечерняя укладка',         priceFrom:  7000, priceTo: null, durationMin:  60, categoryId: catStyle.id, sortOrder: 1 } }),
    prisma.service.create({ data: { name: 'Свадебная причёска',       priceFrom: 20000, priceTo: null, durationMin: 120, categoryId: catStyle.id, sortOrder: 2 } }),
  ]);

  // convenience maps
  const svcByName = Object.fromEntries(services.map((s) => [s.name, s]));

  /* ── masters ───────────────────────────────────────────────────────── */
  console.log('💇  Creating masters...');

  const masterData = [
    {
      name: 'Анна Светлова', role: 'Топ-стилист', sortOrder: 1,
      bio: 'Более 10 лет опыта. Специализация — авторские стрижки и сложное окрашивание.',
      serviceNames: ['Женская стрижка','Мужская стрижка','Детская стрижка','Балаяж / Airtouch','Мелирование','Вечерняя укладка','Свадебная причёска'],
      workDays: [1,2,3,4,5],      // Mon–Fri
      satWork: true,
      hours: { start: '09:00', end: '19:00' },
      satHours: { start: '10:00', end: '16:00' },
    },
    {
      name: 'Мария Краснова', role: 'Колорист', sortOrder: 2,
      bio: 'Эксперт по балаяжу и натуральным техникам окрашивания.',
      serviceNames: ['Однотонное окрашивание','Мелирование','Балаяж / Airtouch','Ботокс для волос','Кератиновое выпрямление','Женская стрижка'],
      workDays: [1,2,3,5,6],      // Mon,Tue,Wed,Fri,Sat
      satWork: true,
      hours: { start: '10:00', end: '20:00' },
      satHours: { start: '10:00', end: '18:00' },
    },
    {
      name: 'Дмитрий Орлов', role: 'Стилист', sortOrder: 3,
      bio: 'Мастер мужских и женских стрижек. Призёр конкурсов парикмахерского искусства.',
      serviceNames: ['Мужская стрижка','Женская стрижка','Детская стрижка','Вечерняя укладка'],
      workDays: [2,3,4,5,6],      // Tue–Sat
      satWork: true,
      hours: { start: '09:00', end: '18:00' },
      satHours: { start: '09:00', end: '15:00' },
    },
  ];

  const masters = [];
  for (const md of masterData) {
    const m = await prisma.master.create({
      data: { name: md.name, role: md.role, bio: md.bio, sortOrder: md.sortOrder, isActive: true },
    });
    // link services
    for (const svcName of md.serviceNames) {
      const svc = svcByName[svcName];
      if (svc) await prisma.masterService.create({ data: { masterId: m.id, serviceId: svc.id } });
    }
    masters.push({ ...m, ...md });
  }

  /* ── clients ───────────────────────────────────────────────────────── */
  console.log('👥  Creating clients...');

  const clientRecords = [];
  const usedPhones = new Set();

  // ~25 female, ~15 male
  const clientDefs = [
    ...Array.from({ length: 25 }, () => genClient('F')),
    ...Array.from({ length: 15 }, () => genClient('M')),
  ].filter(({ phone }) => {
    if (usedPhones.has(phone)) return false;
    usedPhones.add(phone);
    return true;
  });

  for (const cd of clientDefs) {
    const c = await prisma.client.create({ data: { name: cd.name, phone: cd.phone } });
    clientRecords.push(c);
  }

  /* ── schedules & appointments ──────────────────────────────────────── */
  console.log('📅  Generating schedules and appointments...');

  const TODAY     = new Date('2026-04-13T00:00:00.000Z');
  const FROM_DATE = addDays(TODAY, -90);  // ~3 months back
  const TO_DATE   = addDays(TODAY, 45);   // 45 days ahead

  let totalAppts = 0;

  for (const master of masters) {
    // iterate every day in range
    let cursor = new Date(FROM_DATE);
    while (cursor <= TO_DATE) {
      const dow      = cursor.getDay(); // 0=Sun, 1=Mon...
      const jsToMon  = dow === 0 ? 7 : dow; // Mon=1...Sun=7
      const isSat    = dow === 6;
      const worksToday = master.workDays.includes(jsToMon);

      if (!worksToday) { cursor = addDays(cursor, 1); continue; }

      const dateStr  = toDateStr(cursor);
      const isPast   = cursor < TODAY;
      const isToday  = toDateStr(cursor) === toDateStr(TODAY);

      // slight 10% chance master is off even on a work day (holidays, sick)
      if (chance(10) && !isToday) { cursor = addDays(cursor, 1); continue; }

      const hours = isSat ? master.satHours : master.hours;

      // create schedule record
      await prisma.masterSchedule.create({
        data: { masterId: master.id, date: dateStr, startTime: hours.start, endTime: hours.end },
      });

      // skip appointments for very old days (> 75 days ago) with some probability
      if (isPast && cursor < addDays(TODAY, -75) && chance(30)) {
        cursor = addDays(cursor, 1);
        continue;
      }

      // how many appointments today
      const startH = parseInt(hours.start.split(':')[0]);
      const endH   = parseInt(hours.end.split(':')[0]);
      const slots  = (endH - startH) * 2; // 30-min slots available
      const maxAppts = isPast ? Math.min(rnd(2, 5), Math.floor(slots * 0.7))
                              : Math.min(rnd(1, 3), Math.floor(slots * 0.5));

      // pick service pool for this master
      const masterSvcs = master.serviceNames.map((n) => svcByName[n]).filter(Boolean);

      // generate appointments greedily filling time slots
      let occupiedMins = [];

      for (let i = 0; i < maxAppts; i++) {
        const service = pick(masterSvcs);
        const dur     = service.durationMin;

        // find a free start time (on 30-min boundary within working hours)
        const freeStarts = [];
        for (let h = startH; h < endH; h++) {
          for (let m = 0; m < 60; m += 30) {
            const startMin = h * 60 + m;
            const endMin   = startMin + dur;
            if (endMin > endH * 60) continue;
            // check no overlap
            const overlap = occupiedMins.some(([s, e]) => startMin < e && endMin > s);
            if (!overlap) freeStarts.push(startMin);
          }
        }
        if (freeStarts.length === 0) break;

        const startMin = pick(freeStarts);
        occupiedMins.push([startMin, startMin + dur]);

        const client  = pick(clientRecords);
        const timeStr = toTimeStr(Math.floor(startMin / 60), startMin % 60);

        // determine status
        let status;
        if (isToday) {
          const nowMin = 13 * 60 + 0; // current time ~13:00 on seed date
          status = startMin < nowMin ? (chance(85) ? 'COMPLETED' : 'CANCELLED') : (chance(70) ? 'CONFIRMED' : 'PENDING');
        } else if (isPast) {
          status = chance(88) ? 'COMPLETED' : chance(60) ? 'CANCELLED' : 'PENDING';
        } else {
          // future
          const daysAhead = Math.round((cursor - TODAY) / 86400000);
          if (daysAhead <= 3) {
            status = chance(80) ? 'CONFIRMED' : 'PENDING';
          } else if (daysAhead <= 14) {
            status = chance(50) ? 'CONFIRMED' : 'PENDING';
          } else {
            status = 'PENDING';
          }
        }

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
            comment:     chance(25) ? pick(COMMENTS) : null,
          },
        });
        totalAppts++;

        // create payment for completed appointments
        if (status === 'COMPLETED') {
          // price between priceFrom and priceTo
          const lo  = service.priceFrom;
          const hi  = service.priceTo ?? service.priceFrom;
          // random amount within range, rounded to 50 kopecks
          const raw = rnd(lo, hi);
          const amount = Math.round(raw / 50) * 50;

          await prisma.payment.create({
            data: {
              appointmentId: appt.id,
              amount,
              method: pick(['CASH','CASH','CASH','CARD','CARD','ONLINE']),
              paidAt: new Date(`${dateStr}T${timeStr}:00.000Z`),
            },
          });
        }
      }

      // blocked slots: lunch break on some days
      if (chance(60) && !isSat) {
        const lunchH = rnd(12, 13);
        const slotOccupied = occupiedMins.some(([s, e]) => s < lunchH * 60 + 30 && e > lunchH * 60);
        if (!slotOccupied) {
          try {
            await prisma.blockedSlot.create({
              data: { masterId: master.id, date: dateStr, time: toTimeStr(lunchH, 0), comment: 'Обед' },
            });
          } catch {} // ignore unique conflicts
        }
      }

      cursor = addDays(cursor, 1);
    }
  }

  /* ── products ──────────────────────────────────────────────────────── */
  console.log('🛍  Creating products...');
  await Promise.all([
    prisma.product.create({ data: { name: 'Шампунь восстанавливающий', brand: 'Olaplex',     price:  45, description: 'Для повреждённых волос. Восстанавливает структуру изнутри.',           sortOrder: 1 } }),
    prisma.product.create({ data: { name: 'Маска для волос',           brand: 'Kerastase',   price:  65, description: 'Глубокое питание и увлажнение для всех типов волос.',                  sortOrder: 2 } }),
    prisma.product.create({ data: { name: 'Масло для кончиков',        brand: 'Moroccanoil', price:  48, description: 'Аргановое масло для блеска и защиты.',                                sortOrder: 3 } }),
    prisma.product.create({ data: { name: 'Термозащитный спрей',       brand: 'GHD',         price:  35, description: 'Защита при укладке до 220°C.',                                        sortOrder: 4 } }),
    prisma.product.create({ data: { name: 'Сухой шампунь',             brand: 'Batiste',     price:  18, description: 'Мгновенная свежесть без мытья.',                                      sortOrder: 5 } }),
    prisma.product.create({ data: { name: 'Текстурирующий спрей',      brand: 'Oribe',       price:  55, description: 'Создаёт естественный объём и текстуру.',                              sortOrder: 6 } }),
    prisma.product.create({ data: { name: 'Кондиционер питательный',   brand: 'Redken',      price:  38, description: 'Интенсивное питание и смягчение для сухих волос.',                    sortOrder: 7 } }),
    prisma.product.create({ data: { name: 'Лак для волос сильной фиксации', brand: 'Schwarzkopf', price: 22, description: 'Стойкая фиксация, не склеивает волосы.',                        sortOrder: 8 } }),
  ]);

  /* ── courses ───────────────────────────────────────────────────────── */
  console.log('🎓  Creating courses...');
  const courses = await Promise.all([
    prisma.course.create({ data: { title: 'Основы женской стрижки',          instructor: 'Анна Светлова',  price:  290, durationDays: 5, startDate: new Date('2026-05-15'), endDate: new Date('2026-05-19'), maxStudents: 8,  isActive: true, description: 'Базовый курс для начинающих мастеров. Техники, инструменты, работа с клиентом.' } }),
    prisma.course.create({ data: { title: 'Балаяж & Airtouch',               instructor: 'Мария Краснова', price:  410, durationDays: 3, startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'), maxStudents: 6,  isActive: true, description: 'Продвинутый курс по современным техникам окрашивания.' } }),
    prisma.course.create({ data: { title: 'Мужские стрижки: от классики до барбершопа', instructor: 'Дмитрий Орлов', price: 240, durationDays: 3, startDate: new Date('2026-06-10'), endDate: new Date('2026-06-12'), maxStudents: 10, isActive: true, description: 'Все техники мужских стрижек: фейд, кроп, классика, текстура.' } }),
    prisma.course.create({ data: { title: 'Кератин и ботокс для волос',       instructor: 'Анна Светлова',  price:  190, durationDays: 2, startDate: new Date('2026-07-05'), endDate: new Date('2026-07-06'), maxStudents: 8,  isActive: true, description: 'Технология применения кератина и ботокса. Работа с разными типами волос.' } }),
  ]);

  // course enrollments (some existing)
  const enrollNames = [
    ['Кристина Волкова','+375291234567'],['Марина Лукьянова','+375331234568'],
    ['Ольга Тимошенко','+375441234569'],['Светлана Борисова','+375291234570'],
    ['Татьяна Фролова','+375331234571'],['Алина Дорохова','+375291234572'],
    ['Виктория Нечаева','+375441234573'],['Наталья Власова','+375251234574'],
  ];
  for (let i = 0; i < enrollNames.length; i++) {
    const [name, phone] = enrollNames[i];
    await prisma.courseEnrollment.create({
      data: { name, phone, courseId: courses[i % courses.length].id },
    });
  }

  console.log(`\n✅ Done!`);
  console.log(`   Clients:      ${clientRecords.length}`);
  console.log(`   Masters:      ${masters.length}`);
  console.log(`   Appointments: ~${totalAppts}`);
  console.log(`   Services:     ${services.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
