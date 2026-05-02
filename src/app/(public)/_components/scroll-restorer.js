'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollRestorer() {
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

  return null;
}
