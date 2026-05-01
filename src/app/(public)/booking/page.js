'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Calendar, Clock, User, Phone, MessageSquare, ChevronLeft } from 'lucide-react';

function maskPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (!d) return '';
  let s = '(' + d.slice(0, 2);
  if (d.length >= 2) s += ')';
  if (d.length > 2) s += ' ' + d.slice(2, 5);
  if (d.length > 5) s += '-' + d.slice(5, 7);
  if (d.length > 7) s += '-' + d.slice(7, 9);
  return s;
}

function BookingPage() {
  const searchParams = useSearchParams();
  const preselectedMasterId = searchParams.get('master');

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '+375',
    date: '',
    time: '',
    serviceId: '',
    masterId: preselectedMasterId || '',
    comment: '',
  });
  const [masters, setMasters] = useState([]);
  const [masterSchedule, setMasterSchedule] = useState([]);
  const [busySlots, setBusySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // panel: 0=masters, 1=services, 2=datetime, 3=contacts
  const [panel, setPanel] = useState(preselectedMasterId ? 1 : 0);

  useEffect(() => {
    fetch('/api/masters').then((r) => r.json()).then((data) => setMasters(data.masters || []));
  }, []);

  useEffect(() => {
    fetch('/api/client/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.client) return;
        setForm((f) => ({
          ...f,
          clientName: f.clientName || data.client.name || '',
          clientPhone: f.clientPhone === '+375' && data.client.phone ? data.client.phone : f.clientPhone,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.masterId) { setMasterSchedule([]); return; }
    fetch(`/api/masters/${form.masterId}/schedule`)
      .then((r) => r.json())
      .then((data) => setMasterSchedule(data.schedule || []))
      .catch(() => setMasterSchedule([]));
  }, [form.masterId]);

  useEffect(() => {
    setBusySlots([]);
    if (!form.masterId || !form.date) return;
    setSlotsLoading(true);
    fetch(`/api/masters/${form.masterId}/busy?date=${form.date}`)
      .then((r) => r.json())
      .then((data) => setBusySlots(data.busy || []))
      .catch(() => setBusySlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.masterId, form.date]);

  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const selectedMaster = masters.find((m) => m.id === form.masterId);
  const masterServices = selectedMaster
    ? selectedMaster.services.map((ms) => ms.service).filter(Boolean)
    : [];
  const selectedService = masterServices.find((s) => s.id === form.serviceId);
  const serviceDuration = selectedService?.durationMin ?? 30;

  const dates = (() => {
    if (form.masterId && masterSchedule.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return masterSchedule
        .map((s) => new Date(s.date + 'T00:00:00'))
        .filter((d) => d >= today)
        .sort((a, b) => a - b);
    }
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  })();

  const timeSlots = (() => {
    if (!form.masterId || !form.date || masterSchedule.length === 0) return [];
    const daySchedule = masterSchedule.find((d) => d.date === form.date);
    if (!daySchedule) return [];

    const endMin = toMinutes(daySchedule.endTime);
    const slots = [];
    const [sh, sm] = daySchedule.startTime.split(':').map(Number);
    let h = sh, m = sm;
    while (h * 60 + m < endMin) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { h++; m -= 60; }
    }
    const isToday = form.date === toDateStr(new Date());
    const nowMin = isToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : 0;

    return slots.filter((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > endMin) return false;
      if (isToday && slotStart <= nowMin) return false;
      for (const busy of busySlots) {
        const busyStart = toMinutes(busy.time);
        const busyEnd = busyStart + busy.duration;
        if (slotStart < busyEnd && slotEnd > busyStart) return false;
      }
      return true;
    });
  })();

  const refreshBusy = () => {
    if (!form.masterId || !form.date) return;
    setSlotsLoading(true);
    fetch(`/api/masters/${form.masterId}/busy?date=${form.date}`)
      .then((r) => r.json())
      .then((data) => setBusySlots(data.busy || []))
      .catch(() => setBusySlots([]))
      .finally(() => setSlotsLoading(false));
  };

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.date || !form.time) {
      setError('Заполните обязательные поля');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        if (data.code === 'SLOT_TAKEN') {
          setForm((f) => ({ ...f, time: '' }));
          refreshBusy();
          setPanel(2);
          setError(data.error);
        } else {
          setError(data.error || 'Ошибка при отправке');
        }
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="section-padding py-20 md:py-32">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-charcoal-700" />
          </div>
          <h1 className="heading-lg mb-4">Вы записаны!</h1>
          <p className="body-text mb-8">
            Мы получили вашу заявку и скоро свяжемся для подтверждения.
            Спасибо, что выбрали Hair Atelier!
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => {
              setSuccess(false);
              setForm({ clientName: '', clientPhone: '+375', date: '', time: '', serviceId: '', masterId: '', comment: '' });
              setPanel(0);
            }} className="btn-outline">
              Записаться ещё
            </button>
            <a href="/" className="btn-primary">
              Мой Hair Atelier
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Progress indicator: panel 0-1 = step 1, panel 2 = step 2, panel 3 = step 3
  const progressStep = panel <= 1 ? 1 : panel === 2 ? 2 : 3;

  return (
    <div className="section-padding py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 md:mb-12">
          <span className="text-xs tracking-[0.2em] uppercase text-gold-500 font-body block mb-3">
            Онлайн-запись
          </span>
          <h1 className="heading-lg text-charcoal-900 mb-4">Записаться</h1>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${s <= progressStep ? 'bg-charcoal-900 text-white' : 'bg-cream-200 text-charcoal-400'}`}>
                {s < progressStep ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-px ${s < progressStep ? 'bg-charcoal-900' : 'bg-cream-200'}`} />}
            </div>
          ))}
        </div>

        {/* Panels 0-2: sliding */}
        {panel < 3 && (
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-350 ease-in-out"
              style={{ width: '300%', transform: `translateX(${panel * -33.333}%)` }}
            >
              {/* Panel 0: Masters */}
              <div className="w-1/3 pr-6">
                <p className="text-xs text-charcoal-500 mb-3 uppercase tracking-wider">Выберите мастера</p>
                <div className="grid grid-cols-1 gap-2">
                  {masters.map((m) => (
                    <button key={m.id}
                      onClick={() => {
                        setForm({ ...form, masterId: m.id, serviceId: '', date: '', time: '' });
                        setPanel(1);
                      }}
                      className="p-4 border border-cream-200 text-left transition-all flex items-center gap-4 hover:border-cream-300">
                      <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center shrink-0">
                        <span className="font-display text-sm text-gold-700">
                          {m.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-charcoal-900 block">{m.name}</span>
                        <span className="text-xs text-charcoal-500">{m.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel 1: Services */}
              <div className="w-1/3 px-3">
                <button
                  onClick={() => { setForm({ ...form, masterId: '', serviceId: '' }); setPanel(0); }}
                  className="flex items-center gap-1 text-xs text-charcoal-400 hover:text-charcoal-700 transition-colors mb-3">
                  <ChevronLeft size={14} /> Мастера
                </button>
                <p className="text-xs text-charcoal-500 mb-3 uppercase tracking-wider">
                  Услуги — {selectedMaster?.name}
                </p>
                {masterServices.length === 0 ? (
                  <p className="text-sm text-charcoal-400 py-4">У этого мастера пока нет услуг.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {masterServices.map((s) => (
                      <button key={s.id}
                        onClick={() => {
                          setForm({ ...form, serviceId: s.id, date: '', time: '' });
                          setPanel(2);
                        }}
                        className="p-4 border border-cream-200 text-left transition-all hover:border-cream-300">
                        <span className="text-sm font-medium text-charcoal-900 block">{s.name}</span>
                        <span className="text-xs text-charcoal-400">
                          {(s.priceFrom / 100).toLocaleString('ru-RU')} BYN · {s.durationMin} мин
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel 2: Date & Time */}
              <div className="w-1/3 pl-6">
                <button
                  onClick={() => { setForm({ ...form, serviceId: '', date: '', time: '' }); setPanel(1); }}
                  className="flex items-center gap-1 text-xs text-charcoal-400 hover:text-charcoal-700 transition-colors mb-3">
                  <ChevronLeft size={14} /> Услуги
                </button>

                {/* Selected service badge */}
                {selectedService && (
                  <div className="mb-4 p-3 bg-cream-50 border border-cream-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-charcoal-500">Выбрана услуга</p>
                      <p className="text-sm font-medium text-charcoal-900">{selectedService.name}</p>
                    </div>
                    <span className="text-xs text-charcoal-400 shrink-0 ml-3">{selectedService.durationMin} мин</span>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-charcoal-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={11} /> Дата
                    </p>
                    {dates.length === 0 ? (
                      <p className="text-sm text-charcoal-400">Нет доступных дат в графике мастера.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {dates.map((d) => {
                          const dateStr = toDateStr(d);
                          const isSelected = form.date === dateStr;
                          const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <button key={dateStr}
                              onClick={() => setForm({ ...form, date: dateStr, time: '' })}
                              className={`shrink-0 w-14 py-2.5 flex flex-col items-center gap-0.5 border transition-all
                                ${isSelected ? 'border-gold-400 bg-gold-50/50' : 'border-cream-200 hover:border-cream-300'}
                                ${isWeekend && !isSelected ? 'bg-cream-50' : ''}`}>
                              <span className={`text-[10px] uppercase ${isWeekend ? 'text-gold-600' : 'text-charcoal-400'}`}>
                                {dayName}
                              </span>
                              <span className="font-display text-lg text-charcoal-900">{d.getDate()}</span>
                              <span className="text-[10px] text-charcoal-400">
                                {d.toLocaleDateString('ru-RU', { month: 'short' })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {form.date && (
                    <div>
                      <p className="text-xs text-charcoal-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={11} /> Время
                      </p>
                      {slotsLoading ? (
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="py-2.5 border border-cream-200 bg-cream-100 animate-pulse rounded" />
                          ))}
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-charcoal-400">Нет свободных слотов.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((t) => (
                            <button key={t}
                              onClick={() => setForm({ ...form, time: t })}
                              className={`py-2.5 text-sm border transition-all
                                ${form.time === t
                                  ? 'border-gold-400 bg-gold-50/50 text-charcoal-900'
                                  : 'border-cream-200 text-charcoal-600 hover:border-cream-300'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {error && !form.time && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                  {form.time && (
                    <button
                      onClick={() => { setError(''); setPanel(3); }}
                      className="btn-primary w-full">
                      Далее — ввести данные
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Contact info */}
        {panel === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* Summary */}
            <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Мастер</span>
                <span className="text-charcoal-900 font-medium">{selectedMaster?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Услуга</span>
                <span className="text-charcoal-900 font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Дата и время</span>
                <span className="text-charcoal-900 font-medium">
                  {form.date && new Date(form.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, {form.time}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-charcoal-500 mb-1 block">
                <User size={12} className="inline mr-1" /> Имя *
              </label>
              <input type="text" value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="input-field" placeholder="Ваше имя" />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 mb-1 block">
                <Phone size={12} className="inline mr-1" /> Телефон *
              </label>
              <div className="input-field !p-0 flex items-center overflow-hidden">
                <span className="px-4 py-3.5 text-sm text-charcoal-500 bg-cream-100 border-r border-cream-200 shrink-0 select-none">+375</span>
                <input type="tel"
                  value={form.clientPhone.slice(4)}
                  onChange={(e) => {
                    const current = form.clientPhone.slice(4);
                    const newDigits = e.target.value.replace(/\D/g, '');
                    const oldDigits = current.replace(/\D/g, '');
                    const digits = (newDigits.length === oldDigits.length && e.target.value.length < current.length)
                      ? oldDigits.slice(0, -1)
                      : newDigits;
                    setForm({ ...form, clientPhone: '+375' + maskPhone(digits) });
                  }}
                  className="flex-1 px-3 py-3.5 bg-transparent text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none"
                  placeholder="(__) ___-__-__" />
              </div>
            </div>
            <div>
              <label className="text-xs text-charcoal-500 mb-1 block">
                <MessageSquare size={12} className="inline mr-1" /> Комментарий
              </label>
              <textarea value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="input-field min-h-[80px] resize-none"
                placeholder="Пожелания к визиту..." />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setError(''); setPanel(2); }} className="btn-outline flex-1">Назад</button>
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50">
                {loading ? 'Отправка...' : 'Записаться'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-charcoal-400 text-sm uppercase tracking-widest">Загрузка...</div></div>}>
      <BookingPage />
    </Suspense>
  );
}
