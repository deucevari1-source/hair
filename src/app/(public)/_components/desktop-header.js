'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './user-menu';

const navItems = [
  { href: '/',         label: 'Главная' },
  { href: '/services', label: 'Услуги' },
  { href: '/shop',     label: 'Магазин' },
  { href: '/school',   label: 'Школа' },
];

export default function DesktopHeader() {
  const pathname = usePathname();
  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-charcoal-900">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-charcoal-900 rotate-45 flex-shrink-0" />
          <span className="font-logo font-light text-xl tracking-[0.08em] uppercase">
            Hair Atelier
          </span>
        </Link>

        <nav className="flex items-center">
          {navItems.map((item) => {
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
          <div className="ml-3">
            <UserMenu variant="desktop" />
          </div>
        </nav>
      </div>
    </header>
  );
}
