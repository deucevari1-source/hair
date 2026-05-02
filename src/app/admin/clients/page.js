'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, User, Phone, Calendar, TrendingUp, ChevronRight, RefreshCw } from 'lucide-react';

function formatAmount(kopecks) {
  return (kopecks / 100).toLocaleString('ru', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' BYN';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientsPage() {
  const [clients, setClients]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [loading, setLoading]   = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/clients?${params}`);
      const data = await res.json();
      setClients(data.clients || []);
      setTotal(data.total || 0);
      setPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-500 mb-1">CRM</p>
          <h1 className="font-display font-semibold text-3xl text-charcoal-900">Клиентская база</h1>
        </div>
        <div className="text-sm text-charcoal-500">{total} клиентов</div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="w-full border border-charcoal-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-charcoal-900 transition-colors"
        />
        {loading && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 animate-spin" />}
      </div>

      {/* Table */}
      <div className="border border-charcoal-200">
        {/* Head — desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-0 bg-charcoal-900 text-white">
          <div className="col-span-4 px-4 py-3 text-[10px] uppercase tracking-wider">Клиент</div>
          <div className="col-span-2 px-4 py-3 text-[10px] uppercase tracking-wider">Телефон</div>
          <div className="col-span-2 px-4 py-3 text-[10px] uppercase tracking-wider text-center">Визиты</div>
          <div className="col-span-2 px-4 py-3 text-[10px] uppercase tracking-wider text-right">Потрачено</div>
          <div className="col-span-2 px-4 py-3 text-[10px] uppercase tracking-wider text-right">Последний визит</div>
        </div>

        {clients.length === 0 && !loading && (
          <div className="py-16 text-center text-charcoal-400 text-sm">
            {debouncedSearch ? 'Ничего не найдено' : 'Клиентов пока нет'}
          </div>
        )}

        {clients.map((c, i) => (
          <Link key={c.id} href={`/admin/clients/${c.id}`}
            className={`block hover:bg-cream-50 transition-colors border-t border-cream-200 ${i === 0 ? 'border-t-0' : ''}`}>

            {/* Mobile layout */}
            <div className="flex items-center gap-3 px-4 py-3 md:hidden">
              <div className="w-9 h-9 bg-charcoal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-charcoal-600">
                  {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-charcoal-900 truncate">{c.name}</span>
                  <span className="text-xs text-charcoal-500 flex-shrink-0">{c.visitCount} визит.</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-charcoal-500">{c.phone}</span>
                  <span className="text-xs text-charcoal-400 flex-shrink-0">{fmtDate(c.lastVisit)}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-charcoal-300 flex-shrink-0" />
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-12 gap-0 items-center">
              <div className="col-span-4 px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-charcoal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-charcoal-600">
                    {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-charcoal-900">{c.name}</div>
                  {c.notes && (
                    <div className="text-[10px] text-charcoal-400 truncate max-w-[160px]">{c.notes}</div>
                  )}
                </div>
              </div>
              <div className="col-span-2 px-4 py-3.5 text-sm text-charcoal-600">{c.phone}</div>
              <div className="col-span-2 px-4 py-3.5 text-center">
                <span className="text-sm font-medium text-charcoal-900">{c.visitCount}</span>
              </div>
              <div className="col-span-2 px-4 py-3.5 text-right">
                <span className="text-sm text-charcoal-700">{c.totalSpent > 0 ? formatAmount(c.totalSpent) : '—'}</span>
              </div>
              <div className="col-span-2 px-4 py-3.5 text-right flex items-center justify-end gap-2">
                <span className="text-sm text-charcoal-500">{fmtDate(c.lastVisit)}</span>
                <ChevronRight size={14} className="text-charcoal-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-charcoal-200 disabled:opacity-40 hover:bg-cream-50">
            ←
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1.5 text-xs border transition-colors
                ${p === page ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-charcoal-200 hover:bg-cream-50'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 text-xs border border-charcoal-200 disabled:opacity-40 hover:bg-cream-50">
            →
          </button>
        </div>
      )}
    </div>
  );
}
