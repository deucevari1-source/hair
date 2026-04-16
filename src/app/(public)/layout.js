'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Scissors, CalendarPlus, ShoppingBag, GraduationCap, Phone, MapPin, Clock, Instagram } from 'lucide-react';

const navItems = [
  { href: '/',         label: 'Главная', icon: Home },
  { href: '/services', label: 'Услуги',  icon: Scissors },
  { href: '/booking',  label: 'Запись',  icon: CalendarPlus, accent: true },
  { href: '/shop',     label: 'Магазин', icon: ShoppingBag },
  { href: '/school',   label: 'Школа',   icon: GraduationCap },
];

function DesktopHeader() {
  const pathname = usePathname();
  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-charcoal-900">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-charcoal-900 rotate-45 flex-shrink-0" />
          <span className="font-logo font-light text-base tracking-[0.08em] uppercase">
            Hair Atelier
          </span>
        </Link>

        <nav className="flex items-center">
          {navItems.filter((n) => !n.accent).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`relative px-5 py-1 font-body text-xs tracking-[0.12em] uppercase transition-colors
                  ${isActive ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'}`}>
                {item.label}
                {isActive && <span className="absolute bottom-0 left-5 right-5 h-0.5 bg-charcoal-900" />}
              </Link>
            );
          })}
          <Link href="/booking"
            className="ml-6 px-6 py-2.5 bg-charcoal-900 text-white font-body text-xs tracking-[0.12em] uppercase font-medium hover:bg-charcoal-700 transition-colors">
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-charcoal-900">
      <div className="px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-charcoal-900 rotate-45 flex-shrink-0" />
          <span className="font-logo font-light text-sm tracking-[0.08em] uppercase">
            Hair Atelier
          </span>
        </Link>
        <a href="tel:+375291234567"
          className="w-9 h-9 border border-cream-200 flex items-center justify-center hover:border-charcoal-900 transition-colors">
          <Phone size={16} strokeWidth={1.5} className="text-charcoal-700" />
        </a>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  const saveScrollAndMark = () => {
    const existing = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    existing[pathname] = window.scrollY;
    sessionStorage.setItem('scrollPositions', JSON.stringify(existing));
    sessionStorage.setItem('navScroll', JSON.stringify(existing));
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-charcoal-900"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          if (item.accent) {
            return (
              <Link key={item.href} href={item.href} onClick={saveScrollAndMark}
                className="flex flex-col items-center -mt-5">
                <div className={`w-14 h-14 flex items-center justify-center transition-colors
                  ${isActive ? 'bg-charcoal-700' : 'bg-charcoal-900'}`}>
                  <Icon size={20} className="text-white" strokeWidth={1.5} />
                </div>
                <span className={`text-[10px] mt-1 uppercase tracking-wide font-medium
                  ${isActive ? 'text-charcoal-900' : 'text-charcoal-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href} onClick={saveScrollAndMark}
              className="flex flex-col items-center py-1.5 px-3 min-w-[4rem]">
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? 'text-charcoal-900' : 'text-charcoal-400'} />
              <span className={`text-[10px] mt-0.5 uppercase tracking-wide transition-colors
                ${isActive ? 'text-charcoal-900 font-semibold' : 'text-charcoal-400'}`}>
                {item.label}
              </span>
              {isActive && <span className="w-4 h-0.5 bg-charcoal-900 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white section-padding py-16 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-5 border-2 border-white rotate-45 flex-shrink-0" />
              <span className="font-logo font-light text-xl tracking-[0.08em] uppercase">
                Hair Atelier
              </span>
            </div>
            <p className="text-sm text-charcoal-400 leading-relaxed max-w-sm">
              Пространство, где мастерство встречает стиль.
              Мы создаём образы, которые подчёркивают вашу индивидуальность.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-charcoal-500 mb-5">Контакты</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-charcoal-400">
                <MapPin size={14} className="mt-0.5 text-charcoal-600 shrink-0" />
                <span>г. Минск, ул. Богдановича, 14</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-charcoal-400">
                <Phone size={14} className="mt-0.5 text-charcoal-600 shrink-0" />
                <a href="tel:+375291234567" className="hover:text-white transition-colors">
                  +375 (29) 123-45-67
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm text-charcoal-400">
                <Clock size={14} className="mt-0.5 text-charcoal-600 shrink-0" />
                <span>Пн–Пт: 9:00–21:00<br />Сб–Вс: 10:00–20:00</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-charcoal-500 mb-5">Навигация</h4>
            <div className="grid grid-cols-2 gap-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className="text-[11px] text-charcoal-400 hover:text-white transition-colors uppercase tracking-wider">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-charcoal-800 flex items-center justify-between">
          <p className="text-[11px] text-charcoal-600 uppercase tracking-wider">
            © {new Date().getFullYear()} Hair Atelier
          </p>
          <a href="https://www.instagram.com/Hair___atelier" target="_blank" rel="noopener noreferrer"
            className="text-charcoal-600 hover:text-white transition-colors">
            <Instagram size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    const fromNav = sessionStorage.getItem('navScroll');
    if (fromNav) {
      const saved = JSON.parse(fromNav);
      sessionStorage.removeItem('navScroll');
      window.scrollTo(0, saved[pathname] ?? 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <>
      <DesktopHeader />
      <MobileHeader />
      <main className="pt-14 md:pt-16 pb-nav md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
