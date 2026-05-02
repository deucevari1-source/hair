'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, CalendarDays, Users, Scissors, ShoppingBag,
  GraduationCap, TrendingUp, LogOut, Menu, X, ChevronRight, Lock, MessageSquare,
} from 'lucide-react';

// Финансовый «пароль» был косметическим (хранился в JS бандле, легко обходился).
// Если нужна реальная защита раздела — реализовать серверный gate с env-переменной
// и httpOnly cookie. Сейчас доступ к /admin/finance защищён только обычным admin-токеном.
const FINANCE_PASSWORD_ENABLED = false;
const FINANCE_PASSWORD = ''; // unused while gate disabled

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const menuItems = [
  { href: '/admin',              label: 'Дашборд',           icon: LayoutDashboard },
  { href: '/admin/calendar',     label: 'Журнал записей',    icon: CalendarDays },
  { href: '/admin/clients',      label: 'Клиенты',           icon: Users },
  { href: '/admin/messages',     label: 'Сообщения',         icon: MessageSquare, badge: true },
  { href: '/admin/finance',      label: 'Финансы',           icon: TrendingUp },
  { href: '/admin/masters',      label: 'Мастера',           icon: Users },
  { href: '/admin/services',     label: 'Услуги',            icon: Scissors },
  { href: '/admin/products',     label: 'Товары',            icon: ShoppingBag },
  { href: '/admin/courses',      label: 'Курсы',             icon: GraduationCap },
];

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [financeInput, setFinanceInput] = useState('');
  const [financeError, setFinanceError] = useState(false);
  const [financeUnlocked, setFinanceUnlocked] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const financeInputRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (admin) { setLoading(false); return; }
    if (pathname === '/admin/login') { setLoading(false); return; }

    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => { setAdmin(data.admin); setLoading(false); })
      .catch(() => {
        if (pathname !== '/admin/login') router.push('/admin/login');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    setAdmin(null);
    router.push('/admin/login');
  };

  const handleFinanceClick = (e) => {
    if (FINANCE_PASSWORD_ENABLED && !financeUnlocked) {
      e.preventDefault();
      setFinanceInput('');
      setFinanceError(false);
      setFinanceModalOpen(true);
      setTimeout(() => financeInputRef.current?.focus(), 50);
    }
  };

  const submitFinancePassword = () => {
    if (financeInput === FINANCE_PASSWORD) {
      setFinanceUnlocked(true);
      setFinanceModalOpen(false);
      router.push('/admin/finance');
    } else {
      setFinanceError(true);
      setFinanceInput('');
      financeInputRef.current?.focus();
    }
  };

  const authFetch = async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Poll unread messages counter every 60s while admin is logged in.
  // Skip when tab is hidden to save battery + bandwidth.
  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const fetchCount = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await authFetch('/api/admin/prompts/unread-count');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadMessages(data.count || 0);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCount(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, pathname]);

  if (pathname === '/admin/login') {
    return <AuthContext.Provider value={{ admin, authFetch, logout }}>{children}</AuthContext.Provider>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal-300 border-t-charcoal-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <AuthContext.Provider value={{ admin, authFetch, logout }}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden"
               onMouseDown={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transition-transform duration-200 ease-out lg:transition-none lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
              <Link href="/admin" className="font-display text-lg tracking-[0.1em] text-charcoal-900">
                HAIR ATELIER
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isFinance = item.href === '/admin/finance';
                return (
                  <Link key={item.href} href={item.href}
                    onClick={(e) => {
                      setSidebarOpen(false);
                      if (isFinance) handleFinanceClick(e);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-charcoal-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && unreadMessages > 0 && (
                      <span className={`text-[10px] font-semibold px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full ${isActive ? 'bg-white text-charcoal-900' : 'bg-red-500 text-white'}`}>
                        {unreadMessages}
                      </span>
                    )}
                    {isFinance && FINANCE_PASSWORD_ENABLED && !financeUnlocked && (
                      <Lock size={13} className="opacity-40 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-gold-700">
                    {admin.name?.[0] || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                  <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                </div>
              </div>
              <button onClick={logout}
                className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-500 hover:text-red-600 
                           hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} />
                Выйти
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 gap-4">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900">
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span>Админ</span>
              <ChevronRight size={14} />
              <span className="text-gray-900">
                {menuItems.find((m) => m.href === pathname)?.label || 'Панель'}
              </span>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      {/* Finance password modal */}
      {financeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                <Lock size={18} className="text-charcoal-700" />
              </div>
              <div>
                <p className="font-medium text-charcoal-900 text-sm">Раздел защищён</p>
                <p className="text-xs text-gray-500">Введите пароль для доступа к Финансам</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Финансы доступны по дополнительному паролю. Эту функцию можно отключить. Сейчас пароль 1234
            </p>
            <input
              ref={financeInputRef}
              type="password"
              value={financeInput}
              onChange={(e) => { setFinanceInput(e.target.value); setFinanceError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && submitFinancePassword()}
              placeholder="Пароль"
              className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors mb-1
                ${financeError
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-gray-200 focus:border-charcoal-400'}`}
            />
            {financeError && (
              <p className="text-xs text-red-500 mb-3">Неверный пароль</p>
            )}
            {!financeError && <div className="mb-3" />}
            <div className="flex gap-2">
              <button
                onClick={() => setFinanceModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Отмена
              </button>
              <button
                onClick={submitFinancePassword}
                className="flex-1 px-4 py-2.5 rounded-lg bg-charcoal-900 text-white text-sm hover:bg-charcoal-800 transition-colors">
                Войти
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
