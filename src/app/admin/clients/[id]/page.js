'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit2, Save, X, User, Phone, Mail, Calendar, DollarSign } from 'lucide-react';

const STATUS_META = {
  PENDING:   { label: 'Ожидает',     dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Подтверждена', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Завершена',   dot: 'bg-green-500' },
  CANCELLED: { label: 'Отменена',    dot: 'bg-gray-300' },
};

function formatAmount(kopecks) {
  return (kopecks / 100).toLocaleString('ru', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' BYN';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ notes: '', preferences: '' });
  const [token, setToken]     = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/clients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setClient(d.client);
        setForm({ notes: d.client.notes || '', preferences: d.client.preferences || '' });
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setClient((prev) => ({ ...prev, ...data.client }));
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cream-200 w-48" />
          <div className="h-4 bg-cream-200 w-32" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-charcoal-500">
        Клиент не найден. <Link href="/admin/clients" className="underline">Вернуться</Link>
      </div>
    );
  }

  const completed = client.appointments.filter((a) => a.status === 'COMPLETED');
  const totalSpent = completed.reduce((s, a) => s + (a.payment?.amount ?? 0), 0);
  const avgCheck = completed.length ? Math.round(totalSpent / completed.length) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-900 uppercase tracking-wider mb-6">
        <ChevronLeft size={14} /> Клиентская база
      </Link>

      {/* Client header */}
      <div className="border-2 border-charcoal-900 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-charcoal-900 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-semibold text-xl text-white">
                {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display font-semibold text-2xl text-charcoal-900">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-charcoal-500">
                  <Phone size={12} /> {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1.5 text-sm text-charcoal-500">
                    <Mail size={12} /> {client.email}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-charcoal-400 mt-1 uppercase tracking-wider">
                Клиент с {fmtDate(client.createdAt)}
              </p>
            </div>
          </div>

          <button onClick={() => setEditing(!editing)}
            className={`self-start flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors ${editing ? 'border-charcoal-900 bg-charcoal-900 text-white' : 'border-charcoal-200 text-charcoal-600 hover:border-charcoal-900'}`}>
            {editing ? <><X size={12} /> Отмена</> : <><Edit2 size={12} /> Редактировать</>}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-5 border-t border-cream-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['Всего визитов', client.appointments.filter((a) => a.status !== 'CANCELLED').length],
            ['Завершено', completed.length],
            ['Потрачено', totalSpent > 0 ? formatAmount(totalSpent) : '—'],
            ['Средний чек', avgCheck > 0 ? formatAmount(avgCheck) : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="font-display font-semibold text-xl text-charcoal-900">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes / preferences edit */}
      {editing && (
        <div className="border border-charcoal-200 p-5 mb-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-charcoal-500 mb-1.5">
              Заметки мастера
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:border-charcoal-900 resize-none"
              placeholder="Особенности, замечания..."
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-charcoal-500 mb-1.5">
              Предпочтения
            </label>
            <textarea
              value={form.preferences}
              onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
              rows={3}
              className="w-full border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:border-charcoal-900 resize-none"
              placeholder="Любимые процедуры, аллергии, цветовые предпочтения..."
            />
          </div>
          <button onClick={save} disabled={saving}
            className="btn-primary text-xs py-2 disabled:opacity-50 flex items-center gap-1.5">
            <Save size={12} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}

      {/* Notes display (if not editing) */}
      {!editing && (client.notes || client.preferences) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {client.notes && (
            <div className="border border-cream-200 p-4">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-400 mb-2">Заметки</div>
              <p className="text-sm text-charcoal-700 leading-relaxed">{client.notes}</p>
            </div>
          )}
          {client.preferences && (
            <div className="border border-cream-200 p-4">
              <div className="text-[10px] uppercase tracking-wider text-charcoal-400 mb-2">Предпочтения</div>
              <p className="text-sm text-charcoal-700 leading-relaxed">{client.preferences}</p>
            </div>
          )}
        </div>
      )}

      {/* Visit history */}
      <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-4">История визитов</h2>

      {client.appointments.length === 0 ? (
        <div className="border border-cream-200 py-12 text-center text-charcoal-400 text-sm">
          Визитов пока нет
        </div>
      ) : (
        <div className="border border-charcoal-200 divide-y divide-cream-200">
          {client.appointments.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.PENDING;
            return (
              <div key={a.id} className={`p-4 flex items-center gap-4 ${a.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-charcoal-900">
                      {fmtDate(a.date)}
                    </span>
                    <span className="text-sm text-charcoal-500">{a.time}</span>
                    {a.master && (
                      <span className="text-[10px] text-charcoal-400 uppercase tracking-wider">
                        · {a.master.name}
                      </span>
                    )}
                  </div>
                  {a.service && (
                    <div className="text-sm text-charcoal-600 mt-0.5">{a.service.name}</div>
                  )}
                  {a.comment && (
                    <div className="text-xs text-charcoal-400 mt-0.5 italic">{a.comment}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {a.payment ? (
                    <div>
                      <div className="text-sm font-medium text-charcoal-900">{formatAmount(a.payment.amount)}</div>
                      <div className="text-[10px] text-charcoal-400 uppercase">{a.payment.method}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-charcoal-300 uppercase tracking-wider">{meta.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
