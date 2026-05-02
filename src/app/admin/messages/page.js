'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Plus, Send, Trash2, X, Pencil, FileText, MessageSquare, Check } from 'lucide-react';

const STATUS_LABELS = {
  PENDING: 'Ожидает ответа',
  ANSWERED: 'Отвечено',
  EXPIRED: 'Истёк',
  DISMISSED: 'Отменён',
};

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  ANSWERED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  DISMISSED: 'bg-gray-100 text-gray-500',
};

export default function MessagesPage() {
  const { authFetch } = useAuth() || {};
  const [tab, setTab] = useState('messages'); // 'messages' | 'templates'
  const [statusFilter, setStatusFilter] = useState('ANSWERED');
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [tplEditOpen, setTplEditOpen] = useState(null); // null | 'new' | tpl object
  const [loading, setLoading] = useState(true);

  const loadPrompts = async () => {
    if (!authFetch) return;
    setLoading(true);
    const res = await authFetch(`/api/admin/prompts?status=${statusFilter}`);
    if (res.ok) {
      const d = await res.json();
      setPrompts(d.prompts);
    }
    setLoading(false);
  };

  const loadTemplates = async () => {
    if (!authFetch) return;
    const res = await authFetch('/api/admin/prompt-templates');
    if (res.ok) {
      const d = await res.json();
      setTemplates(d.templates);
    }
  };

  const markRead = async () => {
    if (!authFetch) return;
    await authFetch('/api/admin/prompts/mark-read', { method: 'POST' });
  };

  useEffect(() => {
    if (!authFetch) return;
    loadPrompts();
    loadTemplates();
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch, statusFilter]);

  const deletePrompt = async (id) => {
    if (!confirm('Удалить сообщение?')) return;
    const res = await authFetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
    if (res.ok) loadPrompts();
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Удалить шаблон?')) return;
    const res = await authFetch(`/api/admin/prompt-templates/${id}`, { method: 'DELETE' });
    if (res.ok) loadTemplates();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-charcoal-900">Сообщения</h1>
          <p className="text-sm text-gray-500 mt-1">
            Вопросы клиентам и шаблоны для рассылок
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 transition-colors"
        >
          <Plus size={16} /> Новое сообщение
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { id: 'messages', label: 'Сообщения', icon: MessageSquare },
          { id: 'templates', label: 'Шаблоны', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-charcoal-900 text-charcoal-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'messages' && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              ['ANSWERED', 'Отвечены'],
              ['PENDING', 'Ожидают'],
              ['all', 'Все'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  statusFilter === key
                    ? 'bg-charcoal-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>
          ) : prompts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Сообщений пока нет</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Клиент</th>
                    <th className="text-left px-4 py-3 font-medium">Вопрос</th>
                    <th className="text-left px-4 py-3 font-medium">Ответ</th>
                    <th className="text-left px-4 py-3 font-medium">Статус</th>
                    <th className="text-left px-4 py-3 font-medium">Дата</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prompts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-charcoal-900">{p.client.name}</div>
                        <div className="text-xs text-gray-500">{p.client.phone}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-charcoal-700 line-clamp-2">{p.question}</div>
                        {p.source === 'SYSTEM' && (
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">
                            автоматический
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.response ? (
                          <span className="font-medium text-charcoal-900">{p.response}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deletePrompt(p.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'templates' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setTplEditOpen('new')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus size={13} /> Новый шаблон
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Шаблонов пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-charcoal-900">{t.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTplEditOpen(t)}
                        className="text-gray-400 hover:text-charcoal-900 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(t.options) ? t.options : []).map((o, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-xs text-gray-700 rounded"
                      >
                        {o.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {composeOpen && (
        <ComposeModal
          authFetch={authFetch}
          templates={templates}
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setComposeOpen(false);
            loadPrompts();
            loadTemplates();
          }}
        />
      )}

      {tplEditOpen && (
        <TemplateModal
          authFetch={authFetch}
          template={tplEditOpen === 'new' ? null : tplEditOpen}
          onClose={() => setTplEditOpen(null)}
          onSaved={() => {
            setTplEditOpen(null);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}

/* ─── Compose modal ─────────────────────────────────────────── */

function ComposeModal({ authFetch, templates, onClose, onSent }) {
  const [segment, setSegment] = useState('SINGLE');
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [masterId, setMasterId] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { label: 'Да', action: 'ACK' },
    { label: 'Нет', action: 'ACK' },
  ]);
  const [saveAsTpl, setSaveAsTpl] = useState(false);
  const [tplName, setTplName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedTplId, setSelectedTplId] = useState('');

  useEffect(() => {
    authFetch('/api/masters').then((r) => r.json()).then((d) => setMasters(d.masters || []));
    authFetch('/api/services').then((r) => r.json()).then((d) => setServices(d.services || []));
  }, [authFetch]);

  useEffect(() => {
    if (clientQuery.length < 2) { setClientResults([]); return; }
    const t = setTimeout(() => {
      authFetch(`/api/admin/clients?search=${encodeURIComponent(clientQuery)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setClientResults(d.clients || []));
    }, 200);
    return () => clearTimeout(t);
  }, [clientQuery, authFetch]);

  const applyTemplate = (id) => {
    setSelectedTplId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setQuestion(t.question);
    setOptions(Array.isArray(t.options) ? JSON.parse(JSON.stringify(t.options)) : []);
  };

  const updateOption = (i, patch) => {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  };

  const removeOption = (i) => {
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions((opts) => [...opts, { label: '', action: 'ACK' }]);
  };

  const submit = async () => {
    setError('');
    if (!question.trim()) return setError('Введите вопрос');
    if (options.length === 0 || options.some((o) => !o.label.trim())) {
      return setError('Все варианты должны иметь текст');
    }
    if (segment === 'SINGLE' && !selectedClient) return setError('Выберите клиента');
    if (segment === 'MASTER' && !masterId) return setError('Выберите мастера');
    if (saveAsTpl && !tplName.trim()) return setError('Введите название шаблона');

    // Validate BOOK options
    for (const o of options) {
      if (o.action === 'BOOK' && (!o.payload?.masterId || !o.payload?.serviceId)) {
        return setError(`Вариант «${o.label}»: выберите мастера и услугу`);
      }
    }

    setSending(true);
    try {
      const body = {
        question: question.trim(),
        options,
        segment,
        clientId: segment === 'SINGLE' ? selectedClient.id : undefined,
        masterId: segment === 'MASTER' ? masterId : undefined,
        saveAsTemplate: saveAsTpl,
        templateName: saveAsTpl ? tplName.trim() : undefined,
      };
      const res = await authFetch('/api/admin/prompts', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка отправки');
        setSending(false);
        return;
      }
      onSent(data);
    } catch (e) {
      setError('Ошибка сети');
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start md:items-center justify-center px-4 py-6 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-xl text-charcoal-900">Новое сообщение</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-charcoal-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Segment */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Кому</label>
            <div className="flex gap-2">
              {[
                ['SINGLE', 'Одному клиенту'],
                ['MASTER', 'Клиентам мастера'],
                ['ALL', 'Всем клиентам'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSegment(key)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                    segment === key
                      ? 'border-charcoal-900 bg-charcoal-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Segment-specific selectors */}
          {segment === 'SINGLE' && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Клиент</label>
              {selectedClient ? (
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-charcoal-900">{selectedClient.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{selectedClient.phone}</span>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Имя или телефон..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none"
                  />
                  {clientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                      {clientResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientQuery(''); setClientResults([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-charcoal-900">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {segment === 'MASTER' && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Мастер</label>
              <select
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none"
              >
                <option value="">— выбрать —</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Template picker */}
          {templates.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Шаблон (опционально)</label>
              <select
                value={selectedTplId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none"
              >
                <option value="">— без шаблона —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Question */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Вопрос</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Что хотите спросить у клиента?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Варианты ответа ({options.length}/4)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <OptionEditor
                  key={i}
                  opt={opt}
                  masters={masters}
                  services={services}
                  onChange={(patch) => updateOption(i, patch)}
                  onRemove={options.length > 1 ? () => removeOption(i) : null}
                />
              ))}
              {options.length < 4 && (
                <button
                  onClick={addOption}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  + Добавить вариант
                </button>
              )}
            </div>
          </div>

          {/* Save as template */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm text-charcoal-700">
              <input
                type="checkbox"
                checked={saveAsTpl}
                onChange={(e) => setSaveAsTpl(e.target.checked)}
              />
              Сохранить как шаблон
            </label>
            {saveAsTpl && (
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Название шаблона"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-white"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50"
          >
            <Send size={14} /> {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionEditor({ opt, masters, services, onChange, onRemove }) {
  const isBook = opt.action === 'BOOK';
  const masterServices = isBook && opt.payload?.masterId
    ? services.filter((s) => true)  // всех услуг хватит — выбор будет проверяться при бронировании
    : services;

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
      <div className="flex gap-2 items-start">
        <input
          value={opt.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Текст кнопки (напр. «Да»)"
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded text-sm bg-white focus:border-charcoal-900 outline-none"
        />
        <select
          value={opt.action}
          onChange={(e) => onChange({ action: e.target.value, payload: e.target.value === 'BOOK' ? {} : null })}
          className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white focus:border-charcoal-900 outline-none"
        >
          <option value="ACK">Просто ответ</option>
          <option value="BOOK">→ Запись</option>
        </select>
        {onRemove && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 px-1 pt-1.5">
            <X size={15} />
          </button>
        )}
      </div>
      {isBook && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={opt.payload?.masterId || ''}
            onChange={(e) => onChange({ payload: { ...opt.payload, masterId: e.target.value } })}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white focus:border-charcoal-900 outline-none"
          >
            <option value="">Мастер...</option>
            {masters.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={opt.payload?.serviceId || ''}
            onChange={(e) => onChange({ payload: { ...opt.payload, serviceId: e.target.value } })}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white focus:border-charcoal-900 outline-none"
          >
            <option value="">Услуга...</option>
            {masterServices.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/* ─── Template modal (create / edit) ────────────────────────── */

function TemplateModal({ authFetch, template, onClose, onSaved }) {
  const [name, setName] = useState(template?.name || '');
  const [question, setQuestion] = useState(template?.question || '');
  const [options, setOptions] = useState(
    template ? JSON.parse(JSON.stringify(template.options || [])) : [
      { label: 'Да', action: 'ACK' },
      { label: 'Нет', action: 'ACK' },
    ]
  );
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/masters').then((r) => r.json()).then((d) => setMasters(d.masters || []));
    authFetch('/api/services').then((r) => r.json()).then((d) => setServices(d.services || []));
  }, [authFetch]);

  const updateOption = (i, patch) => {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  };

  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Название обязательно');
    if (!question.trim()) return setError('Вопрос обязателен');
    if (options.length === 0 || options.some((o) => !o.label.trim())) {
      return setError('Все варианты должны иметь текст');
    }
    setSaving(true);
    const url = template
      ? `/api/admin/prompt-templates/${template.id}`
      : '/api/admin/prompt-templates';
    const method = template ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      body: JSON.stringify({ name: name.trim(), question: question.trim(), options }),
    });
    if (res.ok) onSaved();
    else {
      const d = await res.json();
      setError(d.error || 'Ошибка');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start md:items-center justify-center px-4 py-6 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-xl text-charcoal-900">
            {template ? 'Редактировать шаблон' : 'Новый шаблон'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-charcoal-900">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. «Повтор визита»"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Вопрос</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-charcoal-900 outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Варианты ответа</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <OptionEditor
                  key={i}
                  opt={opt}
                  masters={masters}
                  services={services}
                  onChange={(patch) => updateOption(i, patch)}
                  onRemove={options.length > 1 ? () => setOptions(options.filter((_, idx) => idx !== i)) : null}
                />
              ))}
              {options.length < 4 && (
                <button
                  onClick={() => setOptions([...options, { label: '', action: 'ACK' }])}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                >
                  + Добавить вариант
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-white"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-charcoal-900 text-white rounded-lg text-sm hover:bg-charcoal-800 disabled:opacity-50"
          >
            <Check size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
