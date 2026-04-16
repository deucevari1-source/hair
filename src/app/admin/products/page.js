'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Plus, Edit2, Trash2, X, Save, ShoppingBag } from 'lucide-react';

const emptyProduct = { name: '', description: '', brand: '', price: 0, isActive: true, sortOrder: 0 };

export default function ProductsPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    authFetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setForm(emptyProduct); setEditing('new'); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', brand: p.brand || '', price: p.price, isActive: p.isActive, sortOrder: p.sortOrder });
    setEditing(p);
  };
  const close = () => { setEditing(null); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = { ...form, price: parseInt(form.price) };
    try {
      if (editing === 'new') {
        await authFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(data) });
      } else {
        await authFetch(`/api/admin/products/${editing.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      }
      close(); fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return;
    await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Товары</h1>
          <p className="text-sm text-gray-500">Витрина бьюти-магазина</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white text-sm rounded-lg hover:bg-charcoal-800">
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading && (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            <ShoppingBag size={32} className="mx-auto text-gray-200 mb-2" />
            Товаров пока нет
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {products.map((p) => (
            <div key={p.id} className={`px-4 py-4 flex items-center justify-between gap-3 ${!p.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Активен' : 'Скрыт'}
                  </span>
                </div>
                {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                <p className="text-sm font-medium text-gray-900 mt-1">{p.price.toLocaleString()} BYN</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing === 'new' ? 'Новый товар' : 'Редактирование'}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Название *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Бренд</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Описание</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена (BYN) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="prodActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="prodActive" className="text-sm text-gray-700">Активен</label>
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
