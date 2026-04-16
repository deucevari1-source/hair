'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/* ── Hero ────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-white bg-grid">
      <div className="relative z-10 section-padding w-full max-w-7xl mx-auto py-16 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left — text */}
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-charcoal-500 mb-8 font-body">
              Салон красоты · Минск
            </p>

            <h1 className="heading-xl text-charcoal-900 mb-6">
              HAIR<br />
              <span className="text-charcoal-400">ATELIER</span>
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-12 bg-charcoal-900" />
              <p className="text-sm text-charcoal-500 font-body leading-relaxed max-w-xs">
                Индивидуальный подход, премиальные бренды и мастера с многолетним опытом.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/booking" className="btn-primary">
                Записаться <ArrowRight size={14} className="ml-2" />
              </Link>
              <Link href="/services" className="btn-outline">
                Наши услуги
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 pt-8 border-t border-cream-200 grid grid-cols-3 gap-0">
              {[['10+', 'лет опыта'], ['5000+', 'клиентов'], ['4.9', 'рейтинг']].map(([num, label], i) => (
                <div key={i} className={`${i > 0 ? 'border-l border-cream-200 pl-6' : ''}`}>
                  <div className="font-display font-semibold text-3xl text-charcoal-900">{num}</div>
                  <div className="text-[10px] text-charcoal-500 uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — geometric frame */}
          <div className="hidden md:block relative select-none">
            <div className="relative aspect-[4/5] border-2 border-charcoal-900">
              {/* offset shadow frame */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border border-cream-300" />
              {/* inner grid */}
              <div className="absolute inset-0 bg-grid opacity-60" />
              {/* center mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-charcoal-300 rotate-45 mx-auto mb-4" />
                  <p className="text-[10px] text-charcoal-400 uppercase tracking-[0.3em]">Hair Atelier</p>
                </div>
              </div>
              {/* corner accents */}
              <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-charcoal-900" />
              <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-charcoal-900" />
              <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-charcoal-900" />
              <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-charcoal-900" />
            </div>
            {/* vertical label */}
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
              <p className="text-[9px] text-charcoal-400 uppercase tracking-[0.4em] whitespace-nowrap">
                Salon · Minsk · 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Services preview ────────────────────────────────────────── */
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

/* ── Masters ─────────────────────────────────────────────────── */
function MastersSection() {
  const [masters, setMasters] = useState([]);

  useEffect(() => {
    fetch('/api/masters').then((r) => r.json()).then((d) => setMasters(d.masters || [])).catch(() => {});
  }, []);

  return (
    <section className="section-padding py-20 md:py-28 border-t border-cream-200 bg-charcoal-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-600 mb-3">Команда</p>
            <h2 className="heading-lg text-white">Мастера</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-charcoal-800">
          {masters.length > 0 ? masters.map((m) => (
            <div key={m.id} className="bg-charcoal-900 p-8 group hover:bg-charcoal-800 transition-colors flex flex-col">
              {/* Square avatar */}
              <div className="w-16 h-16 bg-charcoal-800 border border-charcoal-700 flex items-center justify-center mb-6
                              group-hover:border-charcoal-500 transition-colors">
                <span className="font-display font-semibold text-xl text-charcoal-300">
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-1">{m.name}</h3>
              <p className="text-[10px] text-charcoal-500 uppercase tracking-wider mb-3">{m.role}</p>
              {m.bio && <p className="text-sm text-charcoal-500 leading-relaxed line-clamp-2 mb-4">{m.bio}</p>}
              <div className="mt-auto pt-5 border-t border-charcoal-800 group-hover:border-charcoal-700 transition-colors">
                <Link href={`/booking?master=${m.id}`}
                  className="flex items-center justify-between text-[11px] uppercase tracking-wider text-charcoal-500 hover:text-white transition-colors">
                  Записаться <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )) : [1, 2, 3].map((i) => (
            <div key={i} className="bg-charcoal-900 p-8 animate-pulse">
              <div className="w-16 h-16 bg-charcoal-800 mb-6" />
              <div className="h-5 bg-charcoal-800 rounded w-36 mb-2" />
              <div className="h-3 bg-charcoal-800 rounded w-24 mb-3" />
              <div className="h-4 bg-charcoal-800 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────── */
function BookingCTA() {
  return (
    <section className="section-padding py-20 md:py-28 border-t border-cream-200">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-charcoal-900 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark" />
          {/* corner marks */}
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

/* ── Page ────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesPreview />
      <MastersSection />
      <BookingCTA />
    </>
  );
}
