'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Scissors, CreditCard, Banknote, Wifi, RefreshCw } from 'lucide-react';

function formatAmount(kopecks) {
  return (kopecks / 100).toLocaleString('ru', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' BYN';
}

function pad(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PRESETS = [
  { label: 'Сегодня',    days: 0 },
  { label: '7 дней',     days: 7 },
  { label: '30 дней',    days: 30 },
  { label: '90 дней',    days: 90 },
];

const METHOD_LABEL = { CASH: 'Наличные', CARD: 'Карта', ONLINE: 'Онлайн' };
const METHOD_ICON  = { CASH: Banknote, CARD: CreditCard, ONLINE: Wifi };
const METHOD_COLOR = { CASH: 'text-green-700 bg-green-50 border-green-200',
                       CARD: 'text-blue-700 bg-blue-50 border-blue-200',
                       ONLINE: 'text-purple-700 bg-purple-50 border-purple-200' };

export default function FinancePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset]   = useState(1); // 7 days default
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [token, setToken]     = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);

  // On preset change set from/to
  useEffect(() => {
    const now = new Date();
    const t   = toDateStr(now);
    const days = PRESETS[preset]?.days ?? 7;
    const f = days === 0 ? t : toDateStr(new Date(now.getTime() - days * 86400000));
    setFrom(f);
    setTo(t);
  }, [preset]);

  const fetchReport = useCallback(async () => {
    if (!token || !from || !to) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/report?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Bar chart helper
  function maxVal(arr, key) { return Math.max(...arr.map((r) => r[key]), 1); }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-500 mb-1">Аналитика</p>
          <h1 className="font-display font-semibold text-3xl text-charcoal-900">Финансы</h1>
        </div>
        {loading && <RefreshCw size={16} className="animate-spin text-charcoal-400" />}
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => setPreset(i)}
            className={`px-3 py-1.5 text-xs border uppercase tracking-wider transition-colors
              ${preset === i ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-charcoal-200 hover:bg-cream-50'}`}>
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
            className="border border-charcoal-200 px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal-900" />
          <span className="text-charcoal-400 text-xs">—</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
            className="border border-charcoal-200 px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal-900" />
        </div>
      </div>

      {!data && !loading && (
        <div className="text-center text-charcoal-400 py-20">Выберите период</div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border-2 border-charcoal-900 p-5">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 mb-2">Выручка</div>
              <div className="font-display font-semibold text-2xl text-charcoal-900">
                {formatAmount(data.totalRevenue)}
              </div>
            </div>
            <div className="border border-cream-200 p-5">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 mb-2">Транзакций</div>
              <div className="font-display font-semibold text-2xl text-charcoal-900">{data.count}</div>
            </div>
            <div className="border border-cream-200 p-5">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 mb-2">Средний чек</div>
              <div className="font-display font-semibold text-2xl text-charcoal-900">
                {data.count > 0 ? formatAmount(Math.round(data.totalRevenue / data.count)) : '—'}
              </div>
            </div>
            <div className="border border-cream-200 p-5">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 mb-2">Мастеров</div>
              <div className="font-display font-semibold text-2xl text-charcoal-900">{data.byMaster.length}</div>
            </div>
          </div>

          {/* Method breakdown */}
          {Object.keys(data.byMethod).length > 0 && (
            <div className="mb-8">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-charcoal-500 mb-3">Способ оплаты</h2>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(data.byMethod).map(([method, amount]) => {
                  const Icon = METHOD_ICON[method] || CreditCard;
                  return (
                    <div key={method} className={`flex items-center gap-3 px-4 py-3 border ${METHOD_COLOR[method] || ''}`}>
                      <Icon size={16} />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider">{METHOD_LABEL[method] || method}</div>
                        <div className="font-medium text-sm">{formatAmount(amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* By master */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-charcoal-500 mb-3">По мастерам</h2>
              <div className="border border-charcoal-200">
                {data.byMaster.length === 0 ? (
                  <div className="p-4 text-sm text-charcoal-400">Нет данных</div>
                ) : data.byMaster.map((m, i) => {
                  const pct = Math.round((m.total / maxVal(data.byMaster, 'total')) * 100);
                  return (
                    <div key={m.id} className={`p-3 ${i > 0 ? 'border-t border-cream-200' : ''}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-charcoal-900">{m.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-charcoal-900">{formatAmount(m.total)}</span>
                          <span className="text-[10px] text-charcoal-400 ml-2">{m.count} визитов</span>
                        </div>
                      </div>
                      <div className="h-1 bg-cream-200 w-full">
                        <div className="h-1 bg-charcoal-900 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By service */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-charcoal-500 mb-3">По услугам</h2>
              <div className="border border-charcoal-200">
                {data.byService.length === 0 ? (
                  <div className="p-4 text-sm text-charcoal-400">Нет данных</div>
                ) : data.byService.map((s, i) => {
                  const pct = Math.round((s.total / maxVal(data.byService, 'total')) * 100);
                  return (
                    <div key={s.id} className={`p-3 ${i > 0 ? 'border-t border-cream-200' : ''}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-charcoal-900 truncate max-w-[160px]">{s.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-charcoal-900">{formatAmount(s.total)}</span>
                          <span className="text-[10px] text-charcoal-400 ml-2">{s.count}×</span>
                        </div>
                      </div>
                      <div className="h-1 bg-cream-200 w-full">
                        <div className="h-1 bg-charcoal-900 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily breakdown */}
          {data.daily.length > 1 && (
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-charcoal-500 mb-3">По дням</h2>
              <div className="border border-charcoal-200">
                <div className="grid grid-cols-12 bg-charcoal-900 text-white">
                  <div className="col-span-4 px-4 py-2 text-[10px] uppercase tracking-wider">Дата</div>
                  <div className="col-span-4 px-4 py-2 text-[10px] uppercase tracking-wider text-center">Транзакций</div>
                  <div className="col-span-4 px-4 py-2 text-[10px] uppercase tracking-wider text-right">Выручка</div>
                </div>
                {data.daily.map((d, i) => (
                  <div key={d.date} className={`grid grid-cols-12 items-center border-t border-cream-200 ${i === 0 ? 'border-t-0' : ''}`}>
                    <div className="col-span-4 px-4 py-3 text-sm text-charcoal-700">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </div>
                    <div className="col-span-4 px-4 py-3 text-center text-sm text-charcoal-700">{d.count}</div>
                    <div className="col-span-4 px-4 py-3 text-right text-sm font-medium text-charcoal-900">
                      {formatAmount(d.total)}
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div className="grid grid-cols-12 items-center border-t-2 border-charcoal-900 bg-cream-50">
                  <div className="col-span-4 px-4 py-3 text-xs font-medium text-charcoal-900 uppercase tracking-wider">Итого</div>
                  <div className="col-span-4 px-4 py-3 text-center text-sm font-medium text-charcoal-900">{data.count}</div>
                  <div className="col-span-4 px-4 py-3 text-right text-sm font-semibold text-charcoal-900">
                    {formatAmount(data.totalRevenue)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
