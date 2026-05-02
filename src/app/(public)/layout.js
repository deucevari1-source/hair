import Link from 'next/link';
import { MapPin, Phone, Clock, Instagram } from 'lucide-react';
import DesktopHeader from './_components/desktop-header';
import MobileHeader from './_components/mobile-header';
import MobileBottomNav from './_components/mobile-bottom-nav';
import ScrollRestorer from './_components/scroll-restorer';
import PullToRefresh from './_components/pull-to-refresh';

const footerNav = [
  { href: '/',         label: 'Главная' },
  { href: '/services', label: 'Услуги' },
  { href: '/booking',  label: 'Запись' },
  { href: '/shop',     label: 'Магазин' },
  { href: '/school',   label: 'Школа' },
];

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
              {footerNav.map((item) => (
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
  return (
    <>
      <DesktopHeader />
      <MobileHeader />
      <ScrollRestorer />
      <PullToRefresh>
        <main className="pt-14 md:pt-16 pb-nav md:pb-0">
          {children}
        </main>
      </PullToRefresh>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
