import { Calendar, Clock, Scissors, User } from 'lucide-react';

const STATUS_LABEL = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
};

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dStart = new Date(d);
  dStart.setHours(0, 0, 0, 0);

  if (dStart.getTime() === today.getTime()) return 'Сегодня';
  if (dStart.getTime() === tomorrow.getTime()) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
}

export default function NextAppointment({ appointment }) {
  if (!appointment) return null;

  return (
    <div className="border border-cream-200 bg-white p-5 md:p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-400">
          Ваша ближайшая запись
        </p>
        <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${
          appointment.status === 'CONFIRMED'
            ? 'bg-charcoal-900 text-white'
            : 'border border-charcoal-200 text-charcoal-500'
        }`}>
          {STATUS_LABEL[appointment.status]}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display font-semibold text-3xl md:text-4xl text-charcoal-900">
          {appointment.time}
        </span>
        <span className="text-sm text-charcoal-500 font-body">
          {formatDate(appointment.date)}
        </span>
      </div>

      <div className="h-px w-12 bg-charcoal-900 my-4" />

      <div className="space-y-2 text-sm">
        {appointment.serviceName && (
          <div className="flex items-center gap-2 text-charcoal-700">
            <Scissors size={13} className="text-charcoal-400 shrink-0" />
            <span>{appointment.serviceName}</span>
            {appointment.durationMin && (
              <span className="text-charcoal-400 text-xs">· {appointment.durationMin} мин</span>
            )}
          </div>
        )}
        {appointment.masterName && (
          <div className="flex items-center gap-2 text-charcoal-700">
            <User size={13} className="text-charcoal-400 shrink-0" />
            <span>{appointment.masterName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
