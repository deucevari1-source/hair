'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import UserMenu from './user-menu';

export default function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-charcoal-900">
      <div className="px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-charcoal-900 rotate-45 flex-shrink-0" />
          <span className="font-logo font-light text-lg tracking-[0.08em] uppercase">
            Hair Atelier
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <UserMenu variant="mobile" />
          <a href="tel:+375291234567"
            className="w-9 h-9 border border-cream-200 flex items-center justify-center hover:border-charcoal-900 transition-colors">
            <Phone size={16} strokeWidth={1.5} className="text-charcoal-700" />
          </a>
        </div>
      </div>
    </header>
  );
}
