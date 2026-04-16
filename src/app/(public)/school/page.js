'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Calendar, Clock, Users, ChevronDown, ChevronUp, X, Check } from 'lucide-react';

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

function EnrollModal({ course, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '+375' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError('Заполните обязательные поля');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, courseId: course.id }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Ошибка при отправке');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full md:max-w-md md:rounded-lg rounded-t-2xl p-6 md:p-8
                      max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-charcoal-400 hover:text-charcoal-600">
          <X size={20} />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-sage-500" />
            </div>
            <h3 className="heading-md mb-2">Вы записаны!</h3>
            <p className="text-sm text-charcoal-500">
              Мы свяжемся с вами для подтверждения записи на курс.
            </p>
            <button onClick={onClose} className="btn-primary mt-6">Закрыть</button>
          </div>
        ) : (
          <>
            <h3 className="heading-md mb-1">Запись на курс</h3>
            <p className="text-sm text-gold-600 mb-6">{course.title}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-charcoal-500 mb-1 block">Имя *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field" placeholder="Ваше имя" />
              </div>
              <div>
                <label className="text-xs text-charcoal-500 mb-1 block">Телефон *</label>
                <div className="input-field !p-0 flex items-center overflow-hidden">
                  <span className="px-4 py-3.5 text-sm text-charcoal-500 bg-cream-100 border-r border-cream-200 shrink-0 select-none">+375</span>
                  <input type="tel"
                    value={form.phone.slice(4)}
                    onChange={(e) => {
                      const current = form.phone.slice(4);
                      const newDigits = e.target.value.replace(/\D/g, '');
                      const oldDigits = current.replace(/\D/g, '');
                      const digits = (newDigits.length === oldDigits.length && e.target.value.length < current.length)
                        ? oldDigits.slice(0, -1)
                        : newDigits;
                      setForm({ ...form, phone: '+375' + maskPhone(digits) });
                    }}
                    className="flex-1 px-3 py-3.5 bg-transparent text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none"
                    placeholder="(__) ___-__-__" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={loading}
                className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Отправка...' : 'Записаться на курс'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SchoolPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long',
    });
  }

  return (
    <div className="section-padding py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <span className="text-xs tracking-[0.2em] uppercase text-gold-500 font-body block mb-3">
            Обучение
          </span>
          <h1 className="heading-lg text-charcoal-900 mb-4">Школа Hair Atelier</h1>
          <p className="body-text max-w-lg">
            Обучение от практикующих мастеров салона. Делимся техниками 
            и секретами, которые используем каждый день.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-luxury p-6 animate-pulse">
                <div className="h-5 bg-cream-200 rounded w-64 mb-3" />
                <div className="h-4 bg-cream-100 rounded w-full mb-2" />
                <div className="h-4 bg-cream-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Courses */}
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="card-luxury overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-display text-xl md:text-2xl font-light text-charcoal-900 mb-2">
                      {course.title}
                    </h3>
                    {course.instructor && (
                      <p className="text-xs tracking-[0.1em] uppercase text-gold-600 mb-3">
                        {course.instructor}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-charcoal-500">
                      {course.startDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {formatDate(course.startDate)}
                          {course.endDate && ` — ${formatDate(course.endDate)}`}
                        </span>
                      )}
                      {course.durationDays && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {course.durationDays} дн.
                        </span>
                      )}
                      {course.maxStudents && (
                        <span className="flex items-center gap-1.5">
                          <Users size={13} />
                          до {course.maxStudents} чел.
                        </span>
                      )}
                    </div>
                  </div>

                  {course.price && (
                    <div className="text-right shrink-0">
                      <div className="font-display text-2xl text-charcoal-900">
                        {course.price.toLocaleString('ru-RU')} BYN
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable description */}
                {course.description && (
                  <div className="mt-4">
                    <button onClick={() => setExpanded(expanded === course.id ? null : course.id)}
                      className="flex items-center gap-1 text-xs text-charcoal-500 hover:text-charcoal-700 transition-colors">
                      {expanded === course.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expanded === course.id ? 'Скрыть' : 'Подробнее'}
                    </button>
                    {expanded === course.id && (
                      <p className="mt-3 text-sm text-charcoal-600 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <button onClick={() => setEnrollCourse(course)}
                    className="btn-primary text-sm">
                    Записаться на курс
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && courses.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap size={48} className="mx-auto text-cream-300 mb-4" />
            <p className="text-charcoal-500">Курсы скоро появятся</p>
          </div>
        )}
      </div>

      {enrollCourse && (
        <EnrollModal course={enrollCourse} onClose={() => setEnrollCourse(null)} />
      )}
    </div>
  );
}
