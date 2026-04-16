'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Plus, Edit2, Trash2, X, Save, GraduationCap, Users, Calendar } from 'lucide-react';

const emptyCourse = { title: '', description: '', instructor: '', price: 0, durationDays: 1, startDate: '', endDate: '', maxStudents: 10, isActive: true };

export default function CoursesPage() {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [saving, setSaving] = useState(false);
  const [expandedEnrollments, setExpandedEnrollments] = useState(null);

  const fetchData = () => {
    setLoading(true);
    authFetch('/api/admin/courses')
      .then((r) => r.json())
      .then((d) => { setCourses(d.courses || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setForm(emptyCourse); setEditing('new'); };
  const openEdit = (c) => {
    setForm({
      title: c.title, description: c.description || '', instructor: c.instructor || '',
      price: c.price || 0, durationDays: c.durationDays || 1,
      startDate: c.startDate ? c.startDate.split('T')[0] : '',
      endDate: c.endDate ? c.endDate.split('T')[0] : '',
      maxStudents: c.maxStudents || 10, isActive: c.isActive,
    });
    setEditing(c);
  };
  const close = () => { setEditing(null); };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const data = {
      ...form,
      price: parseInt(form.price) || null,
      durationDays: parseInt(form.durationDays) || null,
      maxStudents: parseInt(form.maxStudents) || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    try {
      if (editing === 'new') {
        await authFetch('/api/admin/courses', { method: 'POST', body: JSON.stringify(data) });
      } else {
        await authFetch(`/api/admin/courses/${editing.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      }
      close(); fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить курс?')) return;
    await authFetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Курсы</h1>
          <p className="text-sm text-gray-500">Школа Hair Atelier</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white text-sm rounded-lg hover:bg-charcoal-800">
          <Plus size={16} /> Добавить курс
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-50 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {courses.map((c) => (
          <div key={c.id} className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${!c.isActive ? 'opacity-60' : ''}`}>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                  {c.instructor && (
                    <p className="text-sm text-gold-600 mt-0.5">{c.instructor}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    {c.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(c.startDate).toLocaleDateString('ru-RU')}
                        {c.endDate && ` — ${new Date(c.endDate).toLocaleDateString('ru-RU')}`}
                      </span>
                    )}
                    {c.price && <span>{c.price.toLocaleString()} BYN</span>}
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {c._count?.enrollments || 0} / {c.maxStudents || '∞'} записей
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpandedEnrollments(expandedEnrollments === c.id ? null : c.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Users size={14} />
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Enrollments */}
            {expandedEnrollments === c.id && c.enrollments && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Записи на курс ({c.enrollments.length})
                </h4>
                {c.enrollments.length === 0 ? (
                  <p className="text-sm text-gray-400">Записей нет</p>
                ) : (
                  <div className="space-y-2">
                    {c.enrollments.map((e) => (
                      <div key={e.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-2.5">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{e.name}</span>
                          <span className="text-xs text-gray-500 ml-3">{e.phone}</span>
                          {e.email && <span className="text-xs text-gray-400 ml-3">{e.email}</span>}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(e.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && courses.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Курсов пока нет</p>
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing === 'new' ? 'Новый курс' : 'Редактирование'}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Название *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Описание</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Преподаватель</label>
                <input type="text" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Цена (BYN)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Макс. учеников</label>
                  <input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Дата начала</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Дата окончания</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Длительность (дней)</label>
                <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="courseActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="courseActive" className="text-sm text-gray-700">Активен</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={close} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Отмена</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
