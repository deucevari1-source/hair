'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function ServicesPage() {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fetchData = () => {
    setLoading(true);
    authFetch('/api/admin/services')
      .then((r) => r.json())
      .then((d) => { setCategories(d.categories || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = (categoryId) => {
    setForm({ name: '', description: '', priceFrom: '', durationMin: 60, categoryId, isActive: true, sortOrder: 0 });
    setEditing('new');
  };

  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description || '', priceFrom: s.priceFrom / 100, durationMin: s.durationMin, categoryId: s.categoryId, isActive: s.isActive, sortOrder: s.sortOrder });
    setEditing(s);
  };

  const close = () => { setEditing(null); setForm({}); };

  const handleSave = async () => {
    if (!form.name || !form.categoryId) return;
    setSaving(true);
    const data = { ...form, priceFrom: Math.round(parseFloat(form.priceFrom) * 100), priceTo: null, durationMin: parseInt(form.durationMin) };
    try {
      if (editing === 'new') {
        await authFetch('/api/admin/services', { method: 'POST', body: JSON.stringify(data) });
      } else {
        await authFetch(`/api/admin/services/${editing.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      }
      close();
      fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить услугу?')) return;
    await authFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addCategory = async () => {
    if (!newCatName) return;
    await authFetch('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify({ type: 'category', name: newCatName }),
    });
    setNewCatName('');
    setAddingCategory(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Услуги</h1>
          <p className="text-sm text-gray-500">Управление каталогом услуг</p>
        </div>
        <button onClick={() => setAddingCategory(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
          <Plus size={16} /> Категория
        </button>
      </div>

      {addingCategory && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Название категории" autoFocus />
          <button onClick={addCategory} className="px-4 py-2 bg-charcoal-900 text-white rounded-lg text-sm">Добавить</button>
          <button onClick={() => setAddingCategory(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 text-sm hover:bg-gray-50">Отмена</button>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-50 rounded" />
                <div className="h-12 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{cat.name}</h2>
            <button onClick={() => openNew(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Plus size={12} /> Добавить услугу
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {cat.services.length === 0 && (
              <div className="px-6 py-6 text-center text-sm text-gray-400">Нет услуг</div>
            )}
            {cat.services.map((s) => (
              <div key={s.id} className={`px-6 py-4 flex items-center justify-between gap-4 ${!s.isActive ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(s.priceFrom / 100).toLocaleString('ru-RU')} BYN · {s.durationMin} мин
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onMouseDown={close} />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing === 'new' ? 'Новая услуга' : 'Редактирование'}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Название *</label>
                <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Описание</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена (BYN) *</label>
                <input type="number" value={form.priceFrom || ''} onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Длительность (мин)</label>
                <input type="number" value={form.durationMin || ''} onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Категория *</label>
                <select value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="svcActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="svcActive" className="text-sm text-gray-700">Активна</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={close} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Отмена</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
