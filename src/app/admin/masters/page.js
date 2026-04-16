'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Plus, Edit2, Trash2, X, Save, CalendarDays, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';

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

function ScheduleCalendar({ schedule, onChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  const toStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toggleDate = (date) => {
    const s = toStr(date);
    const exists = schedule.find((x) => x.date === s);
    if (exists) {
      onChange(schedule.filter((x) => x.date !== s));
    } else {
      const sorted = [...schedule, { date: s, startTime: '09:00', endTime: '19:00' }]
        .sort((a, b) => a.date.localeCompare(b.date));
      onChange(sorted);
    }
  };

  const updateTime = (dateStr, field, value) => {
    onChange(schedule.map((s) => s.date === dateStr ? { ...s, [field]: value } : s));
  };

  const monthLabel = viewMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-800 capitalize">{monthLabel}</span>
        <button onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d) => (
          <div key={d} className="text-center text-[11px] text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const dateStr = toStr(date);
          const isPast = date < today;
          const isSelected = schedule.some((s) => s.date === dateStr);
          return (
            <button key={dateStr} disabled={isPast}
              onClick={() => toggleDate(date)}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors font-medium
                ${isPast ? 'text-gray-200 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-charcoal-900 text-white' : isPast ? '' : 'hover:bg-gray-100 text-gray-700'}
              `}>
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {schedule.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-400 mb-2">Время работы по датам:</p>
          {schedule.map((s) => (
            <div key={s.date} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-20 shrink-0">
                {new Date(s.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
              <input type="time" value={s.startTime}
                onChange={(e) => updateTime(s.date, 'startTime', e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24" />
              <span className="text-gray-400 text-xs">—</span>
              <input type="time" value={s.endTime}
                onChange={(e) => updateTime(s.date, 'endTime', e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24" />
              <button onClick={() => onChange(schedule.filter((x) => x.date !== s.date))}
                className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {schedule.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Нажмите на даты, чтобы отметить рабочие дни
        </p>
      )}
    </div>
  );
}

const emptyMaster = { name: '', role: '', bio: '', phone: '+375', isActive: true, sortOrder: 0 };

export default function MastersPage() {
  const { authFetch } = useAuth();
  const [masters, setMasters] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyMaster);
  const [saving, setSaving] = useState(false);

  const [scheduleMaster, setScheduleMaster] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [servicesMaster, setServicesMaster] = useState(null);
  // map: serviceId -> { enabled, priceFrom: string, priceTo: string }
  const [masterServicesMap, setMasterServicesMap] = useState({});
  const [servicesSaving, setServicesSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      authFetch('/api/admin/masters').then((r) => r.json()),
      authFetch('/api/admin/services').then((r) => r.json()),
    ]).then(([mastersData, servicesData]) => {
      setMasters(mastersData.masters || []);
      const flat = (servicesData.categories || []).flatMap((c) =>
        (c.services || []).map((s) => ({ ...s, categoryName: c.name }))
      );
      setAllServices(flat);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setForm(emptyMaster); setEditing('new'); };
  const openEdit = (m) => {
    setForm({ name: m.name, role: m.role, bio: m.bio || '', phone: m.phone || '+375', isActive: m.isActive, sortOrder: m.sortOrder });
    setEditing(m);
  };
  const close = () => { setEditing(null); setForm(emptyMaster); };

  const handleSave = async () => {
    if (!form.name || !form.role) return;
    setSaving(true);
    try {
      if (editing === 'new') {
        await authFetch('/api/admin/masters', { method: 'POST', body: JSON.stringify(form) });
      } else {
        await authFetch(`/api/admin/masters/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      }
      close(); fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить мастера?')) return;
    await authFetch(`/api/admin/masters/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openSchedule = async (m) => {
    setScheduleMaster(m);
    setScheduleLoading(true);
    try {
      const r = await authFetch(`/api/admin/masters/${m.id}/schedule`);
      if (!r.ok) throw new Error('Server error');
      const { schedule: saved } = await r.json();
      setSchedule(saved.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })));
    } catch {
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const saveSchedule = async () => {
    setScheduleSaving(true);
    await authFetch(`/api/admin/masters/${scheduleMaster.id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    });
    setScheduleSaving(false);
    setScheduleMaster(null);
  };

  const openServices = async (m) => {
    setServicesMaster(m);
    try {
      const r = await authFetch(`/api/admin/masters/${m.id}/services`);
      const { masterServices } = await r.json();
      const map = {};
      (masterServices || []).forEach(({ serviceId, priceFrom, priceTo }) => {
        map[serviceId] = {
          enabled: true,
          priceFrom: priceFrom != null ? String(priceFrom / 100) : '',
          priceTo:   priceTo   != null ? String(priceTo   / 100) : '',
        };
      });
      setMasterServicesMap(map);
    } catch {
      setMasterServicesMap({});
    }
  };

  const toggleService = (serviceId) => {
    setMasterServicesMap((prev) => {
      if (prev[serviceId]?.enabled) {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      }
      return { ...prev, [serviceId]: { enabled: true, priceFrom: '', priceTo: '' } };
    });
  };

  const updateServicePrice = (serviceId, field, value) => {
    setMasterServicesMap((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], [field]: value },
    }));
  };

  const saveServices = async () => {
    setServicesSaving(true);
    const services = Object.entries(masterServicesMap)
      .filter(([, v]) => v.enabled)
      .map(([serviceId, v]) => ({
        serviceId,
        priceFrom: v.priceFrom !== '' ? parseFloat(v.priceFrom) : null,
        priceTo:   v.priceTo   !== '' ? parseFloat(v.priceTo)   : null,
      }));
    await authFetch(`/api/admin/masters/${servicesMaster.id}/services`, {
      method: 'PUT',
      body: JSON.stringify({ services }),
    });
    setServicesSaving(false);
    setServicesMaster(null);
    fetchData();
  };

  // Group allServices by category for display
  const servicesByCategory = allServices.reduce((acc, s) => {
    if (!acc[s.categoryName]) acc[s.categoryName] = [];
    acc[s.categoryName].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Мастера и графики</h1>
          <p className="text-sm text-gray-500">Управление командой и расписанием работы</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white text-sm rounded-lg hover:bg-charcoal-800 transition-colors">
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && [1,2,3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4" />
            <div className="h-5 bg-gray-100 rounded w-32 mx-auto mb-2" />
            <div className="h-3 bg-gray-50 rounded w-20 mx-auto" />
          </div>
        ))}
        {masters.map((m) => (
          <div key={m.id} className={`bg-white rounded-xl border border-gray-100 p-6 ${!m.isActive ? 'opacity-50' : ''}`}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-3">
                <span className="font-display text-xl text-gold-700">
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{m.name}</h3>
              <p className="text-xs text-gold-600 uppercase tracking-wider mt-0.5">{m.role}</p>
              {m.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{m.bio}</p>}
              {m._count && <p className="text-xs text-gray-400 mt-2">{m._count.appointments} записей</p>}
            </div>
            <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => openServices(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Scissors size={12} /> Услуги
              </button>
              <button onClick={() => openSchedule(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <CalendarDays size={12} /> График
              </button>
              <button onClick={() => openEdit(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Edit2 size={12} /> Изменить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing === 'new' ? 'Новый мастер' : 'Редактирование'}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Имя *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Анна Светлова" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Специализация *</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Топ-стилист" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">О мастере</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none"
                  placeholder="Опыт, специализация..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
                <div className="flex items-center w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
                  <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-500 shrink-0 select-none">+375</span>
                  <input type="tel" value={form.phone.slice(4)}
                    onChange={(e) => {
                      const current = form.phone.slice(4);
                      const newDigits = e.target.value.replace(/\D/g, '');
                      const oldDigits = current.replace(/\D/g, '');
                      const digits = (newDigits.length === oldDigits.length && e.target.value.length < current.length)
                        ? oldDigits.slice(0, -1) : newDigits;
                      setForm({ ...form, phone: '+375' + maskPhone(digits) });
                    }}
                    className="flex-1 px-3 py-2.5 bg-white focus:outline-none"
                    placeholder="(__) ___-__-__" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Активен (виден на сайте)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {editing !== 'new' && (
                <button onClick={() => { close(); handleDelete(editing.id); }}
                  className="px-4 py-2.5 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={close} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.role}
                className="flex-1 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {servicesMaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setServicesMaster(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Услуги мастера</h2>
                <p className="text-sm text-gray-500">{servicesMaster.name}</p>
              </div>
              <button onClick={() => setServicesMaster(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                  <div className="space-y-1">
                    {services.map((s) => {
                      const checked = !!masterServicesMap[s.id]?.enabled;
                      const entry = masterServicesMap[s.id];
                      return (
                        <div key={s.id}
                          className={`rounded-lg transition-colors ${checked ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                            <input type="checkbox" checked={checked}
                              onChange={() => toggleService(s.id)}
                              className="w-4 h-4 rounded border-gray-300 accent-purple-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-900">{s.name}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {s.durationMin} мин · {(s.priceFrom / 100).toLocaleString('ru-RU')} BYN
                              </span>
                            </div>
                          </label>
                          {checked && (
                            <div className="flex items-center gap-2 px-3 pb-2.5">
                              <div className="flex-1">
                                <label className="block text-[10px] text-gray-400 mb-1">Цена мастера (BYN)</label>
                                <input
                                  type="number" min="0" step="1" placeholder={String(s.priceFrom / 100)}
                                  value={entry?.priceFrom ?? ''}
                                  onChange={(e) => updateServicePrice(s.id, 'priceFrom', e.target.value)}
                                  className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-purple-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {allServices.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Услуги не найдены. Сначала добавьте услуги.</p>
              )}
            </div>

            <div className="flex gap-3 mt-5 shrink-0 pt-4 border-t border-gray-100">
              <button onClick={() => setServicesMaster(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={saveServices} disabled={servicesSaving}
                className="flex-1 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {servicesSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleMaster && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4" onClick={() => setScheduleMaster(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">График работы</h2>
                <p className="text-sm text-gray-500">{scheduleMaster.name}</p>
              </div>
              <button onClick={() => setScheduleMaster(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {scheduleLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : (
              <ScheduleCalendar schedule={schedule} onChange={setSchedule} />
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setScheduleMaster(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={saveSchedule} disabled={scheduleSaving || scheduleLoading}
                className="flex-1 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {scheduleSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
