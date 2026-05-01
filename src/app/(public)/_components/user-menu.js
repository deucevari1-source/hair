'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';

export default function UserMenu({ variant = 'desktop' }) {
  const pathname = usePathname();
  const [client, setClient] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/client/me')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setClient(d.client); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  if (!client) return null;

  const firstName = (client.name || '').split(' ')[0];

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/client/logout', { method: 'POST' });
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const trigger =
    variant === 'mobile' ? (
      <button
        onClick={() => setConfirmOpen(true)}
        aria-label="Выйти"
        className="w-9 h-9 border border-cream-200 flex items-center justify-center hover:border-charcoal-900 transition-colors"
      >
        <LogOut size={15} strokeWidth={1.5} className="text-charcoal-700" />
      </button>
    ) : (
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border border-cream-200 hover:border-charcoal-900 transition-colors group"
        title="Выйти"
      >
        <span className="font-body text-xs tracking-[0.12em] uppercase text-charcoal-700 group-hover:text-charcoal-900">
          {firstName}
        </span>
        <LogOut size={13} strokeWidth={1.5} className="text-charcoal-400 group-hover:text-charcoal-900" />
      </button>
    );

  return (
    <>
      {trigger}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] bg-charcoal-900/40 flex items-center justify-center px-5"
          onClick={() => !loading && setConfirmOpen(false)}
        >
          <div
            className="bg-white border border-cream-200 max-w-sm w-full p-6 md:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !loading && setConfirmOpen(false)}
              className="absolute top-3 right-3 text-charcoal-400 hover:text-charcoal-900 transition-colors"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
            <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-500 mb-3">Выход</p>
            <h3 className="font-display font-semibold text-2xl text-charcoal-900 mb-3">
              Выйти из аккаунта?
            </h3>
            <p className="text-sm text-charcoal-500 leading-relaxed mb-6">
              После выхода главная страница вернётся к стандартному виду. Чтобы снова войти,
              просто оставьте новую запись с тем же телефоном.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="btn-outline flex-1 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Выходим...' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
