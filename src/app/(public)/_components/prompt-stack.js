'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

export default function PromptStack({ initialPrompts = [] }) {
  const router = useRouter();
  const [prompts] = useState(initialPrompts);
  const [busyId, setBusyId] = useState(null);
  const [acked, setAcked] = useState({}); // { [promptId]: chosenLabel }
  const [errors, setErrors] = useState({}); // { [promptId]: errorString }

  const respond = async (prompt, optionLabel) => {
    if (busyId) return;
    setBusyId(prompt.id);
    setErrors((s) => ({ ...s, [prompt.id]: null }));
    let navigating = false;
    try {
      const res = await fetch(`/api/client/prompts/${prompt.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionLabel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((s) => ({
          ...s,
          [prompt.id]: data.error || 'Не удалось отправить ответ. Попробуйте ещё раз.',
        }));
        return;
      }
      const data = await res.json();

      if (data.action === 'BOOK' && data.payload?.masterId) {
        const qs = new URLSearchParams();
        qs.set('master', data.payload.masterId);
        if (data.payload.serviceId) qs.set('service', data.payload.serviceId);
        navigating = true;
        router.push(`/booking?${qs.toString()}`);
        return;
      }
      if (data.action === 'LINK' && data.payload?.url) {
        navigating = true;
        window.location.href = data.payload.url;
        return;
      }
      // ACK / NONE — collapse to confirmation
      setAcked((s) => ({ ...s, [prompt.id]: optionLabel }));
    } catch {
      setErrors((s) => ({
        ...s,
        [prompt.id]: 'Нет связи. Проверьте интернет.',
      }));
    } finally {
      if (!navigating) setBusyId(null);
    }
  };

  if (prompts.length === 0) return null;

  return (
    <div className="mt-10 space-y-3 max-w-md hero-rise hero-rise-d3">
      <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-400">
        Сообщения от салона
      </p>
      {prompts.map((p) => {
        const ackLabel = acked[p.id];
        const error = errors[p.id];
        const options = Array.isArray(p.options) ? p.options : [];
        const isBusy = busyId !== null;
        return (
          <div
            key={p.id}
            className={`border bg-white p-4 md:p-5 transition-all ${
              ackLabel ? 'border-cream-200 opacity-60' : 'border-cream-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 border border-charcoal-900 rotate-45 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 -mt-0.5">
                <p className="text-[10px] tracking-[0.2em] uppercase text-charcoal-400 mb-1">
                  HAIR ATELIER
                </p>
                <p className="text-sm text-charcoal-900 leading-relaxed">{p.question}</p>
              </div>
            </div>

            {ackLabel ? (
              <div className="flex items-center gap-2 pt-2 border-t border-cream-200 text-[11px] tracking-wider uppercase text-charcoal-500">
                <Check size={13} className="text-charcoal-700" />
                Вы ответили: <span className="text-charcoal-900">{ackLabel}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 pt-1">
                  {options.map((opt, i) => (
                    <button
                      key={`${i}-${opt.label}`}
                      onClick={() => respond(p, opt.label)}
                      disabled={isBusy}
                      className="px-4 py-2 border border-charcoal-900 text-charcoal-900 text-xs tracking-[0.12em] uppercase font-medium hover:bg-charcoal-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {error && (
                  <p className="text-xs text-red-600 mt-2">{error}</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
