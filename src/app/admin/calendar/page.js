'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Lock, Phone,
} from 'lucide-react';

/* ── constants ────────────────────────────────────────────────── */
const STATUS_META = {
  PENDING:   { label: 'Ожидает',      color: 'bg-amber-100 text-amber-800 border-amber-200',  dot: 'bg-amber-400',  bar: 'bg-amber-400',  borderL: 'border-l-amber-400'  },
  CONFIRMED: { label: 'Подтверждена', color: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-500',   bar: 'bg-blue-500',   borderL: 'border-l-blue-500'   },
  COMPLETED: { label: 'Завершена',    color: 'bg-green-100 text-green-800 border-green-200',  dot: 'bg-green-500',  bar: 'bg-green-500',  borderL: 'border-l-green-500'  },
  CANCELLED: { label: 'Отменена',     color: 'bg-gray-100 text-gray-400 border-gray-200',     dot: 'bg-gray-300',   bar: 'bg-gray-300',   borderL: 'border-l-gray-300'   },
};

const SLOT_H = 36; // px per 30 min

/* ── helpers ──────────────────────────────────────────────────── */
const pad     = (n) => String(n).padStart(2, '0');
const toMin   = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime  = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

function startOfWeek(d) {
  const r = new Date(d);
  const day = r.getDay() === 0 ? 6 : r.getDay() - 1;
  r.setDate(r.getDate() - day);
  return r;
}

const MONTH_RU  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAY_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

/* ── AppointmentModal ─────────────────────────────────────────── */
function AppointmentModal({ appt, token, onClose, onStatusChange, onPaymentDone }) {
  const meta = STATUS_META[appt.status] || STATUS_META.PENDING;
  const [loading, setLoading] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  // Используем цену мастера если задана, иначе базовую цену услуги
  const effectivePrice = appt.masterPrice?.priceFrom ?? appt.service?.priceFrom ?? null;
  const [payForm, setPayForm] = useState({
    amount: effectivePrice ? String(effectivePrice / 100) : '',
    method: 'CASH',
  });
  const [paySaving, setPaySaving] = useState(false);

  async function changeStatus(status) {
    setLoading(true);
    await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    onStatusChange(appt.id, status);
    onClose();
  }

  async function handlePayment() {
    if (!payForm.amount) return;
    setPaySaving(true);
    await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        appointmentId: appt.id,
        amount: Math.round(parseFloat(payForm.amount) * 100),
        method: payForm.method,
      }),
    });
    setPaySaving(false);
    onPaymentDone(appt.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-sm mx-4 border-2 border-charcoal-900" onClick={(e) => e.stopPropagation()}>
        <div className={`h-1 w-full ${meta.bar}`} />
        <div className="p-6">
          {!showPay ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display font-semibold text-lg text-charcoal-900">{appt.clientName}</p>
                  <p className="flex items-center gap-1.5 text-sm text-charcoal-500 mt-0.5">
                    <Phone size={12} />
                    <a href={`tel:${appt.clientPhone}`} className="hover:underline">{appt.clientPhone}</a>
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 border uppercase tracking-wider flex-shrink-0 ${meta.color}`}>
                  {meta.label}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-charcoal-700 mb-5">
                {appt.service && (
                  <div className="flex gap-2">
                    <span className="text-charcoal-400 w-20 flex-shrink-0">Услуга</span>
                    <span>{appt.service.name}{appt.service.durationMin ? ` · ${appt.service.durationMin} мин` : ''}</span>
                  </div>
                )}
                {appt.master && (
                  <div className="flex gap-2">
                    <span className="text-charcoal-400 w-20 flex-shrink-0">Мастер</span>
                    <span>{appt.master.name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-charcoal-400 w-20 flex-shrink-0">Время</span>
                  <span>{appt.time}{appt.service?.durationMin ? `–${toTime(toMin(appt.time) + appt.service.durationMin)}` : ''}</span>
                </div>
                {appt.comment && (
                  <div className="flex gap-2">
                    <span className="text-charcoal-400 w-20 flex-shrink-0">Комментарий</span>
                    <span className="italic text-charcoal-500">{appt.comment}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {appt.status === 'PENDING' && (
                  <button onClick={() => changeStatus('CONFIRMED')} disabled={loading}
                    className="w-full py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors">
                    <CheckCircle size={13} /> Подтвердить
                  </button>
                )}
                {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                  <button onClick={() => setShowPay(true)}
                    className="w-full py-2 text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1.5 transition-colors">
                    <CheckCircle size={13} /> Принять оплату
                  </button>
                )}
                {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                  confirmingCancel ? (
                    <div className="border border-red-200 bg-red-50 p-2.5 space-y-2">
                      <p className="text-xs text-red-700 text-center">Отменить запись?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmingCancel(false)}
                          className="flex-1 py-1.5 text-xs border border-charcoal-200 hover:bg-cream-50 transition-colors">
                          Нет
                        </button>
                        <button onClick={() => changeStatus('CANCELLED')} disabled={loading}
                          className="flex-1 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors">
                          Да, отменить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmingCancel(true)} disabled={loading}
                      className="w-full py-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors">
                      <XCircle size={13} /> Отменить
                    </button>
                  )
                )}
              </div>

              {appt.clientId && (
                <div className="mt-4 pt-4 border-t border-cream-200">
                  <Link href={`/admin/clients/${appt.clientId}`} onClick={onClose}
                    className="text-xs text-charcoal-500 hover:text-charcoal-900 uppercase tracking-wider">
                    Карточка клиента →
                  </Link>
                </div>
              )}

              <button onClick={onClose} className="mt-3 w-full py-2 text-xs text-charcoal-400 hover:bg-cream-50 transition-colors">
                Закрыть
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-charcoal-900 mb-1">Оплата</p>
              <p className="text-sm text-charcoal-500 mb-4">{appt.clientName} · {appt.service?.name || '—'}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-charcoal-500 mb-1.5">Сумма (BYN)</label>
                  <input type="number" min="0" step="0.01" value={payForm.amount}
                    onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:border-charcoal-900"
                    autoFocus placeholder="0.00" />
                  {effectivePrice && (
                    <p className="text-[10px] text-charcoal-400 mt-1">
                      {appt.masterPrice?.priceFrom
                        ? `Цена мастера: ${effectivePrice / 100} BYN`
                        : `Базовая цена услуги: ${effectivePrice / 100} BYN`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-charcoal-500 mb-1.5">Способ</label>
                  <div className="flex gap-1">
                    {[['CASH','Наличные'],['CARD','Карта'],['ONLINE','Онлайн']].map(([val, label]) => (
                      <button key={val} onClick={() => setPayForm((f) => ({ ...f, method: val }))}
                        className={`flex-1 py-2 text-xs border transition-colors
                          ${payForm.method === val ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-charcoal-200 hover:bg-cream-50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowPay(false)} className="flex-1 py-2 text-xs border border-charcoal-200 hover:bg-cream-50">
                  Назад
                </button>
                <button onClick={handlePayment} disabled={paySaving || !payForm.amount}
                  className="flex-1 py-2 text-xs bg-charcoal-900 text-white hover:bg-charcoal-700 disabled:opacity-50 transition-colors">
                  {paySaving ? 'Сохранение…' : 'Принять'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── BlockModal ───────────────────────────────────────────────── */
function BlockModal({ data, token, onClose, onDone }) {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/admin/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ masterId: data.masterId, date: data.date, time: data.time, comment: comment || null }),
    });
    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-sm mx-4 border-2 border-charcoal-900 p-6" onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold text-charcoal-900 mb-1">Закрыть время</p>
        <p className="text-sm text-charcoal-500 mb-4">{data.masterName} · {data.time}</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Причина (необязательно)" rows={2} autoFocus
          className="w-full border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:border-charcoal-900 resize-none" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 text-xs border border-charcoal-200 hover:bg-cream-50">Отмена</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 text-xs bg-charcoal-900 text-white hover:bg-charcoal-700 disabled:opacity-50 transition-colors">
            {saving ? 'Сохранение…' : 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── UnblockModal ─────────────────────────────────────────────── */
function UnblockModal({ slot, token, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  async function unblock() {
    setLoading(true);
    await fetch(`/api/admin/blocked-slots/${slot.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setLoading(false);
    onDone();
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-sm mx-4 border-2 border-charcoal-900 p-6" onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold text-charcoal-900 mb-1">Разблокировать время?</p>
        <p className="text-sm text-charcoal-500 mb-4">{slot.time}{slot.comment ? ` · ${slot.comment}` : ''}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-xs border border-charcoal-200 hover:bg-cream-50">Отмена</button>
          <button onClick={unblock} disabled={loading}
            className="flex-1 py-2 text-xs bg-charcoal-900 text-white hover:bg-charcoal-700 disabled:opacity-50 transition-colors">
            {loading ? '…' : 'Открыть'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── DayView ──────────────────────────────────────────────────── */
function DayView({ dateStr, dayData, nowTime, onApptClick, onBlock, onUnblock }) {
  const nowLineRef = useRef(null);

  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  const { masters = [], appointments = [], blockedSlots = [] } = dayData || {};
  const activeMasters = masters.filter((m) => m.schedules?.[0]);

  if (!dayData) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-charcoal-200 border-t-charcoal-900 rounded-full animate-spin" /></div>;
  }
  if (activeMasters.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-sm text-charcoal-400">Сегодня выходной — расписание не задано</div>;
  }

  const allStarts = activeMasters.map((m) => toMin(m.schedules[0].startTime));
  const allEnds   = activeMasters.map((m) => toMin(m.schedules[0].endTime));
  const gridStart = Math.min(...allStarts);
  const gridEnd   = Math.max(...allEnds);
  const totalMins = gridEnd - gridStart;

  const ticks = [];
  for (let m = gridStart; m <= gridEnd; m += 30) ticks.push(m);

  const nowMin     = toMin(nowTime);
  const nowOffset  = Math.max(0, Math.min(nowMin - gridStart, totalMins));
  const nowTopPx   = nowOffset * (SLOT_H / 30);
  const todayStr   = toDateStr(new Date());
  const showNow    = dateStr === todayStr && nowMin >= gridStart && nowMin <= gridEnd;

  return (
    <div className="flex-1 overflow-auto">
      {/* Master headers */}
      <div className="flex border-b border-cream-200 sticky top-0 bg-white z-10">
        <div className="w-12 flex-shrink-0" />
        {activeMasters.map((m) => (
          <div key={m.id} className="w-40 flex-shrink-0 px-3 py-2.5 border-l border-cream-100 first:border-l-0">
            <p className="text-xs font-medium text-charcoal-800 truncate">{m.name}</p>
            <p className="text-[10px] text-charcoal-400">{m.schedules[0].startTime}–{m.schedules[0].endTime}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="relative flex" style={{ minHeight: (ticks.length - 1) * SLOT_H, width: 48 + activeMasters.length * 160 }}>
        {/* Time axis */}
        <div className="w-12 flex-shrink-0 relative">
          {ticks.map((m) => (
            <div key={m} style={{ top: ((m - gridStart) / totalMins) * 100 + '%' }}
              className="absolute right-2 -translate-y-1/2 text-[10px] text-charcoal-300 select-none">
              {m % 60 === 0 ? toTime(m) : ''}
            </div>
          ))}
        </div>

        {/* Master columns */}
        {activeMasters.map((m) => {
          const sched      = m.schedules[0];
          const mStart     = toMin(sched.startTime);
          const mEnd       = toMin(sched.endTime);
          const mApts      = appointments.filter((a) => a.masterId === m.id);
          const mBlocks    = blockedSlots.filter((b) => b.masterId === m.id);
          const topPct     = ((mStart - gridStart) / totalMins) * 100;
          const heightPct  = ((mEnd - mStart) / totalMins) * 100;

          return (
            <div key={m.id} className="w-40 flex-shrink-0 border-l border-cream-100 relative"
              style={{ height: (ticks.length - 1) * SLOT_H }}>

              {/* Working hours bg */}
              <div className="absolute left-0 right-0 bg-cream-50/60" style={{ top: `${topPct}%`, height: `${heightPct}%` }} />

              {/* Grid lines */}
              {ticks.map((tick) => tick > gridStart && (
                <div key={tick} style={{ top: `${((tick - gridStart) / totalMins) * 100}%` }}
                  className={`absolute left-0 right-0 border-t ${tick % 60 === 0 ? 'border-cream-200' : 'border-cream-100'}`} />
              ))}

              {/* Clickable empty slots */}
              {Array.from({ length: (mEnd - mStart) / 30 }, (_, i) => {
                const slotMin  = mStart + i * 30;
                const slotTime = toTime(slotMin);
                const occupied =
                  mApts.some((a) => { const s = toMin(a.time), e = s + (a.service?.durationMin ?? 30); return slotMin >= s && slotMin < e; }) ||
                  mBlocks.some((b) => b.time === slotTime);
                if (occupied) return null;
                return (
                  <div key={slotTime}
                    onClick={() => onBlock({ masterId: m.id, masterName: m.name, date: dateStr, time: slotTime })}
                    style={{ top: `${((slotMin - gridStart) / totalMins) * 100}%`, height: `${(30 / totalMins) * 100}%` }}
                    className="absolute left-0 right-0 z-10 group cursor-pointer hover:bg-charcoal-50 transition-colors flex items-center justify-end pr-1">
                    <Lock size={9} className="text-transparent group-hover:text-charcoal-300 transition-colors" />
                  </div>
                );
              })}

              {/* Blocked slots */}
              {mBlocks.map((block) => {
                const bMin = toMin(block.time);
                if (bMin < gridStart || bMin >= gridEnd) return null;
                return (
                  <button key={block.id}
                    onClick={() => onUnblock(block)}
                    style={{ top: `${((bMin - gridStart) / totalMins) * 100}%`, height: `${(30 / totalMins) * 100}%` }}
                    className="absolute left-0.5 right-0.5 z-20 bg-orange-100 border border-orange-200 hover:bg-orange-200 transition-colors flex items-center px-1.5 gap-1 overflow-hidden">
                    <Lock size={9} className="text-orange-400 flex-shrink-0" />
                    {block.comment && <span className="text-[10px] text-orange-700 truncate">{block.comment}</span>}
                  </button>
                );
              })}

              {/* Appointments */}
              {mApts.map((apt) => {
                const aMin = toMin(apt.time);
                const dur  = apt.service?.durationMin ?? 30;
                if (aMin < gridStart || aMin >= gridEnd) return null;
                const top  = ((aMin - gridStart) / totalMins) * 100;
                const h    = (Math.min(dur, gridEnd - aMin) / totalMins) * 100;
                const meta = STATUS_META[apt.status] || STATUS_META.PENDING;
                return (
                  <button key={apt.id} onClick={() => onApptClick(apt)}
                    style={{ top: `${top}%`, height: `${h}%` }}
                    className={`absolute left-0.5 right-0.5 z-20 border-l-2 ${meta.borderL} bg-white hover:brightness-95 transition-all flex flex-col px-1.5 py-0.5 text-left overflow-hidden border border-cream-200`}>
                    <span className="text-[10px] font-mono text-charcoal-400 leading-tight">{apt.time}</span>
                    <span className="text-[11px] font-semibold text-charcoal-900 truncate leading-tight">{apt.clientName}</span>
                    {dur >= 60 && apt.service && <span className="text-[10px] text-charcoal-400 truncate">{apt.service.name}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Now line */}
        {showNow && (
          <div ref={nowLineRef} style={{ top: nowTopPx, transform: 'translateY(-50%)' }}
            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center">
            <div className="w-12 flex-shrink-0 flex justify-end pr-1">
              <span className="text-[10px] text-red-400 font-mono leading-none">{nowTime}</span>
            </div>
            <div className="flex-1 border-t border-red-400 border-dashed opacity-70" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── WeekView ─────────────────────────────────────────────────── */
function WeekView({ weekStart, appointments, onApptClick }) {
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = toDateStr(new Date());

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-cream-200 sticky top-0 bg-white z-10">
        {days.map((d, i) => {
          const isToday = toDateStr(d) === today;
          return (
            <div key={i} className={`py-2 px-1 text-center border-r border-cream-100 last:border-r-0
              ${isToday ? 'bg-charcoal-900' : ''}`}>
              <div className={`text-[10px] uppercase tracking-wider ${isToday ? 'text-charcoal-400' : 'text-charcoal-500'}`}>{DAY_SHORT[i]}</div>
              <div className={`text-sm font-medium mt-0.5 ${isToday ? 'text-white' : 'text-charcoal-900'}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 divide-x divide-cream-100 min-h-[400px]">
        {days.map((d, i) => {
          const ds       = toDateStr(d);
          const dayApts  = appointments.filter((a) => toDateStr(new Date(a.date)) === ds)
                                       .sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={i} className="p-1 space-y-1 min-h-[80px]">
              {dayApts.map((a) => {
                const meta = STATUS_META[a.status] || STATUS_META.PENDING;
                return (
                  <button key={a.id} onClick={() => onApptClick(a)}
                    className={`w-full text-left px-1.5 py-1 text-[10px] border-l-2 ${meta.borderL} bg-white border border-cream-200 hover:bg-cream-50 transition-colors leading-tight ${a.status === 'CANCELLED' ? 'opacity-40' : ''}`}>
                    <div className="font-medium text-charcoal-900">{a.time}</div>
                    <div className="truncate text-charcoal-600">{a.clientName}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── MonthView ────────────────────────────────────────────────── */
function MonthView({ month, year, appointments, onApptClick }) {
  const today = toDateStr(new Date());
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const cells = Array.from({ length: startDay }, () => null)
    .concat(Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1)));

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-cream-200 sticky top-0 bg-white z-10">
        {DAY_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] uppercase tracking-wider text-charcoal-500 border-r border-cream-100 last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-cream-100">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[80px] bg-cream-50/50 border-b border-cream-100" />;
          const ds       = toDateStr(d);
          const isToday  = ds === today;
          const dayApts  = appointments.filter((a) => toDateStr(new Date(a.date)) === ds)
                                       .sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={i} className={`min-h-[80px] p-1 border-b border-cream-100 ${isToday ? 'bg-charcoal-50' : ''}`}>
              <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center
                ${isToday ? 'bg-charcoal-900 text-white' : 'text-charcoal-700'}`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((a) => {
                  const meta = STATUS_META[a.status] || STATUS_META.PENDING;
                  return (
                    <button key={a.id} onClick={() => onApptClick(a)}
                      className={`w-full text-left px-1 py-0.5 text-[9px] border-l-2 ${meta.borderL} bg-white hover:bg-cream-50 truncate leading-tight`}>
                      {a.time} {a.clientName}
                    </button>
                  );
                })}
                {dayApts.length > 3 && <div className="text-[9px] text-charcoal-400 pl-1">+{dayApts.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function CalendarPage() {
  const [view, setView]         = useState('day');
  const [cursor, setCursor]     = useState(new Date());
  const [appointments, setAppts] = useState([]);
  const [dayData, setDayData]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pendingApts, setPending] = useState([]);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [selectedAppt, setSelAppt] = useState(null);
  const [blockModal, setBlockModal] = useState(null);
  const [unblockSlot, setUnblockSlot] = useState(null);
  const [nowTime, setNowTime]   = useState('00:00');
  const [token, setToken]       = useState('');
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || '';
    setToken(t);
    const tick = () => {
      const n = new Date();
      setNowTime(`${pad(n.getHours())}:${pad(n.getMinutes())}`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── pending strip ── */
  const fetchPending = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/appointments?status=PENDING&limit=50', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPending(data.appointments || []);
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchPending]);

  /* ── fetch day data (masters + appointments + blocked slots) ── */
  const fetchDay = useCallback(async (date, silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    const res  = await fetch(`/api/admin/today?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDayData(data);
    setLoading(false);
  }, [token]);

  /* ── fetch week/month appointments ── */
  const fetchRange = useCallback(async (from, to) => {
    if (!token) return;
    setLoading(true);
    const res  = await fetch(`/api/admin/calendar?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAppts(data.appointments || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (view === 'day') {
      fetchDay(toDateStr(cursor));
    } else if (view === 'week') {
      const ws = startOfWeek(cursor);
      fetchRange(toDateStr(ws), toDateStr(addDays(ws, 6)));
    } else {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const last  = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      fetchRange(toDateStr(first), toDateStr(last));
    }
  }, [view, cursor, token, fetchDay, fetchRange]);

  /* ── poll day view every 60s ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && view === 'day') {
        fetchDay(toDateStr(cursorRef.current), true);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [view, fetchDay]);

  function navigate(dir) {
    setCursor((prev) => {
      if (view === 'day')   return addDays(prev, dir);
      if (view === 'week')  return addDays(prev, dir * 7);
      return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
    });
  }

  function handleStatusChange(id, status) {
    setAppts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    if (view === 'day') fetchDay(toDateStr(cursor), true);
  }

  function handlePaymentDone(id) {
    handleStatusChange(id, 'COMPLETED');
    fetchPending();
  }

  async function confirmPending(id) {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    fetchPending();
    if (view === 'day') fetchDay(toDateStr(cursor), true);
  }

  async function cancelPending(id) {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    fetchPending();
    if (view === 'day') fetchDay(toDateStr(cursor), true);
  }

  // Title
  const dateStr = toDateStr(cursor);
  let title = '';
  if (view === 'day') {
    title = new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  } else if (view === 'week') {
    const ws = startOfWeek(cursor);
    const we = addDays(ws, 6);
    title = `${pad(ws.getDate())} – ${pad(we.getDate())} ${MONTH_RU[we.getMonth()].toLowerCase()} ${we.getFullYear()}`;
  } else {
    title = `${MONTH_RU[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }

  const displayedAppts = view === 'day' ? (dayData?.appointments || []) : appointments;
  const counts = displayedAppts.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Pending strip */}
      {pendingApts.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100">
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">
              Ожидают подтверждения: {pendingApts.length}
            </span>
          </div>
          <div className="divide-y divide-amber-100 max-h-40 overflow-y-auto">
            {pendingApts.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 px-4 py-2 hover:bg-amber-100/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-charcoal-900">{apt.clientName}</span>
                  <span className="text-xs text-charcoal-500 ml-2">
                    <a href={`tel:${apt.clientPhone}`} className="hover:underline">{apt.clientPhone}</a>
                    {' · '}{new Date(apt.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })} {apt.time}
                    {apt.service && ` · ${apt.service.name}`}
                    {apt.master && ` · ${apt.master.name}`}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {cancelConfirmId === apt.id ? (
                    <>
                      <span className="text-xs text-red-600 self-center">Уверены?</span>
                      <button onClick={() => setCancelConfirmId(null)}
                        className="px-3 py-1 text-xs border border-charcoal-200 hover:bg-cream-50 transition-colors">
                        Нет
                      </button>
                      <button onClick={() => { setCancelConfirmId(null); cancelPending(apt.id); }}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors">
                        Да
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => confirmPending(apt.id)}
                        className="px-3 py-1 text-xs bg-charcoal-900 text-white hover:bg-charcoal-700 transition-colors">
                        Подтвердить
                      </button>
                      <button onClick={() => setCancelConfirmId(apt.id)}
                        className="px-3 py-1 text-xs border border-charcoal-200 hover:bg-cream-50 transition-colors">
                        Отменить
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-charcoal-900 px-4 py-3 flex items-center gap-3 flex-wrap bg-white">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-cream-100 border border-transparent hover:border-cream-200 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCursor(new Date())}
            className="px-3 py-1 text-[10px] uppercase tracking-wider border border-charcoal-200 hover:bg-charcoal-900 hover:text-white hover:border-charcoal-900 transition-colors">
            Сегодня
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-cream-100 border border-transparent hover:border-cream-200 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <span className="font-display font-semibold text-charcoal-900 flex-1 capitalize">{title}</span>

        <div className="hidden md:flex items-center gap-2">
          {Object.entries(STATUS_META).map(([k, v]) => counts[k] ? (
            <span key={k} className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider ${v.color}`}>
              {v.label} {counts[k]}
            </span>
          ) : null)}
        </div>

        <div className="flex items-center gap-px">
          {[['day','День'],['week','Неделя'],['month','Месяц']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-colors
                ${view === v ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-charcoal-200 hover:bg-cream-100'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading && <RefreshCw size={14} className="animate-spin text-charcoal-400" />}
      </div>

      {/* Calendar body */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'day' && (
          <DayView
            dateStr={dateStr}
            dayData={dayData}
            nowTime={nowTime}
            onApptClick={setSelAppt}
            onBlock={setBlockModal}
            onUnblock={setUnblockSlot}
          />
        )}
        {view === 'week' && (
          <WeekView weekStart={startOfWeek(cursor)} appointments={appointments} onApptClick={setSelAppt} />
        )}
        {view === 'month' && (
          <MonthView month={cursor.getMonth()} year={cursor.getFullYear()} appointments={appointments} onApptClick={setSelAppt} />
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-cream-200 px-4 py-2 flex items-center gap-4 flex-wrap bg-white">
        {Object.entries(STATUS_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${v.dot}`} />
            <span className="text-[10px] text-charcoal-500 uppercase tracking-wider">{v.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-charcoal-300 ml-auto">Нажмите на пустой слот в дневном виде, чтобы закрыть время</span>
      </div>

      {/* Modals */}
      {selectedAppt && (
        <AppointmentModal
          appt={selectedAppt}
          token={token}
          onClose={() => setSelAppt(null)}
          onStatusChange={handleStatusChange}
          onPaymentDone={handlePaymentDone}
        />
      )}
      {blockModal && (
        <BlockModal
          data={blockModal}
          token={token}
          onClose={() => setBlockModal(null)}
          onDone={() => fetchDay(dateStr, true)}
        />
      )}
      {unblockSlot && (
        <UnblockModal
          slot={unblockSlot}
          token={token}
          onClose={() => setUnblockSlot(null)}
          onDone={() => fetchDay(dateStr, true)}
        />
      )}
    </div>
  );
}
