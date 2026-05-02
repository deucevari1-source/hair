import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { CLIENT_COOKIE_NAME, verifyClientToken } from '@/lib/auth';
import { getClientPrompts } from '@/lib/prompts';
import HeroSection from './_components/hero';
import MastersSection from './_components/masters';

const servicePlaceholders = [
  { n: '01', name: 'Стрижки',     desc: 'Авторские стрижки — от классики до авангардных форм' },
  { n: '02', name: 'Окрашивание', desc: 'Балаяж, airtouch, мелирование, сложное окрашивание' },
  { n: '03', name: 'Уход',        desc: 'Кератин, ботокс, восстановление, полировка' },
];

function ServicesPreview() {
  return (
    <section className="section-padding py-20 md:py-28 border-t border-cream-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-500 mb-3">Что мы предлагаем</p>
            <h2 className="heading-lg text-charcoal-900">Услуги</h2>
          </div>
          <Link href="/services"
            className="hidden md:flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-900 transition-colors uppercase tracking-wider">
            Все услуги <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream-200">
          {servicePlaceholders.map((item) => (
            <Link href="/services" key={item.n}
              className="bg-white p-8 md:p-10 group hover:bg-charcoal-900 transition-colors duration-200">
              <span className="font-display font-semibold text-5xl text-cream-200 group-hover:text-charcoal-700 transition-colors block mb-6 leading-none">
                {item.n}
              </span>
              <h3 className="font-display font-semibold text-xl text-charcoal-900 group-hover:text-white mb-3 transition-colors">
                {item.name}
              </h3>
              <div className="w-8 h-px bg-charcoal-200 group-hover:bg-charcoal-600 mb-4 transition-colors" />
              <p className="text-sm text-charcoal-500 group-hover:text-charcoal-400 leading-relaxed transition-colors">
                {item.desc}
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-charcoal-300 group-hover:text-charcoal-500 transition-colors">
                Подробнее <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link href="/services" className="btn-outline w-full text-center">Все услуги</Link>
        </div>
      </div>
    </section>
  );
}

function BookingCTA() {
  return (
    <section className="section-padding py-20 md:py-28 border-t border-cream-200">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-charcoal-900 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark" />
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-6 h-6 border-charcoal-600 ${cls}`} />
          ))}

          <div className="relative z-10 py-20 md:py-24 px-8 md:px-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="h-px w-12 bg-charcoal-600 mb-8" />
              <h2 className="heading-lg text-white mb-4">
                Запишитесь<br />на приём
              </h2>
              <p className="text-sm text-charcoal-400 max-w-sm leading-relaxed">
                Выберите удобное время и мастера — мы позаботимся об остальном.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <Link href="/booking" className="btn-gold px-10">
                Онлайн-запись <ArrowRight size={14} className="ml-2" />
              </Link>
              <a href="tel:+375291234567"
                className="px-10 py-3.5 text-xs tracking-[0.15em] uppercase font-medium text-charcoal-500 hover:text-white transition-colors text-center">
                +375 (29) 123-45-67
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE_NAME)?.value;
  const client = token ? verifyClientToken(token) : null;
  const safeClient = client ? { name: client.name, phone: client.phone } : null;

  let initialPrompts = [];
  let nextAppointment = null;
  if (client?.clientId) {
    try {
      initialPrompts = await getClientPrompts(prisma, client.clientId);
    } catch (e) {
      console.error('getClientPrompts failed:', e);
    }
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const appt = await prisma.appointment.findFirst({
        where: {
          clientId: client.clientId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          date: { gte: todayStart },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        include: {
          master: { select: { name: true, role: true } },
          service: { select: { name: true, durationMin: true } },
        },
      });
      if (appt) {
        nextAppointment = {
          id: appt.id,
          date: appt.date.toISOString(),
          time: appt.time,
          status: appt.status,
          masterName: appt.master?.name || null,
          serviceName: appt.service?.name || null,
          durationMin: appt.service?.durationMin || null,
        };
      }
    } catch (e) {
      console.error('next appointment lookup failed:', e);
    }
  }

  return (
    <>
      <HeroSection
        client={safeClient}
        initialPrompts={initialPrompts}
        nextAppointment={nextAppointment}
      />
      <ServicesPreview />
      <MastersSection />
      <BookingCTA />
    </>
  );
}
