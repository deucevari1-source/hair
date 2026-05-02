import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PromptStack from './prompt-stack';
import NextAppointment from './next-appointment';

function GeometricFrame() {
  return (
    <div className="hidden md:block relative select-none">
      <div className="relative aspect-[4/5] border-2 border-charcoal-900">
        <div className="absolute -bottom-4 -right-4 w-full h-full border border-cream-300" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-charcoal-300 rotate-45 mx-auto mb-4" />
            <p className="text-[10px] text-charcoal-400 uppercase tracking-[0.3em]">Hair Atelier</p>
          </div>
        </div>
        <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-charcoal-900" />
        <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-charcoal-900" />
        <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-charcoal-900" />
        <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-charcoal-900" />
      </div>
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <p className="text-[9px] text-charcoal-400 uppercase tracking-[0.4em] whitespace-nowrap">
          Salon · Minsk · 2024
        </p>
      </div>
    </div>
  );
}

function AnonymousHero() {
  return (
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

      <div className="mt-14 pt-8 border-t border-cream-200 grid grid-cols-3 gap-0">
        {[['10+', 'лет опыта'], ['5000+', 'клиентов'], ['4.9', 'рейтинг']].map(([num, label], i) => (
          <div key={i} className={`${i > 0 ? 'border-l border-cream-200 pl-6' : ''}`}>
            <div className="font-display font-semibold text-3xl text-charcoal-900">{num}</div>
            <div className="text-[10px] text-charcoal-500 uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalizedHero({ name, initialPrompts, nextAppointment }) {
  const firstName = name.split(' ')[0] || name;
  return (
    <div>
      <p className="text-[10px] tracking-[0.35em] uppercase text-charcoal-500 mb-8 font-body hero-rise">
        С возвращением
      </p>

      <h1 className="heading-xl text-charcoal-900 mb-3 hero-rise">
        {firstName}
        <span className="text-charcoal-300">,</span>
      </h1>

      <p className="font-display font-light text-2xl md:text-3xl text-charcoal-500 leading-snug mb-2 hero-rise hero-rise-d1">
        рады Вас видеть в
      </p>
      <p className="font-display font-semibold text-3xl md:text-5xl tracking-tight text-charcoal-400 hero-rise hero-rise-d2">
        HAIR ATELIER
      </p>

      <div className="mt-10 hero-rise hero-rise-d3">
        {nextAppointment ? (
          <NextAppointment appointment={nextAppointment} />
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-charcoal-900" />
            <p className="text-sm text-charcoal-500 font-body leading-relaxed max-w-xs">
              Активных записей пока нет — выберите удобное время и мастера.
            </p>
          </div>
        )}
      </div>

      <PromptStack initialPrompts={initialPrompts} />
    </div>
  );
}

export default function HeroSection({ client, initialPrompts = [], nextAppointment = null }) {
  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-white bg-grid">
      <div className="relative z-10 section-padding w-full max-w-7xl mx-auto py-16 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {client?.name
            ? <PersonalizedHero name={client.name} initialPrompts={initialPrompts} nextAppointment={nextAppointment} />
            : <AnonymousHero />}
          <GeometricFrame />
        </div>
      </div>
    </section>
  );
}
