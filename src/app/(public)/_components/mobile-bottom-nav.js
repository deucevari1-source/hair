'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Scissors, CalendarPlus, ShoppingBag, GraduationCap } from 'lucide-react';

const navItems = [
  { href: '/',         label: 'Главная', icon: Home },
  { href: '/services', label: 'Услуги',  icon: Scissors },
  { href: '/booking',  label: 'Запись',  icon: CalendarPlus, accent: true },
  { href: '/shop',     label: 'Магазин', icon: ShoppingBag },
  { href: '/school',   label: 'Школа',   icon: GraduationCap },
];

export default function MobileBottomNav() {
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
