'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './layout';
import Link from 'next/link';
import {
  Calendar, Clock, Users, ShoppingBag, GraduationCap,
  AlertCircle, CheckCircle2, ArrowRight,
} from 'lucide-react';

const statusLabels = {
  PENDING: { label: 'Ожидает', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Подтверждена', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Завершена', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Отменена', color: 'bg-red-100 text-red-700' },
};

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recentAppointments || [];

  const cards = [
    { label: 'Сегодня', value: stats.todayAppointments, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ожидают', value: stats.pendingAppointments, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'На неделе', value: stats.upcomingAppointments, icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Всего записей', value: stats.totalAppointments, icon: CheckCircle2, color: 'text-gray-600 bg-gray-50' },
  ];

  const quickLinks = [
    { label: 'Мастера', value: stats.totalMasters, icon: Users, href: '/admin/masters' },
    { label: 'Товары', value: stats.totalProducts, icon: ShoppingBag, href: '/admin/products' },
    { label: 'Курсы', value: stats.totalCourses, icon: GraduationCap, href: '/admin/courses' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Дашборд</h1>
        <p className="text-sm text-gray-500">Обзор салона Hair Atelier</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-3xl font-semibold text-gray-900">{card.value || 0}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Последние записи</h2>
            <Link href="/admin/appointments"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Все записи <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Записей пока нет
              </div>
            )}
            {recent.map((apt) => {
              const st = statusLabels[apt.status] || statusLabels.PENDING;
              return (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{apt.clientName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(apt.date).toLocaleDateString('ru-RU')} в {apt.time}
                      {apt.service && ` · ${apt.service.name}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Управление</h2>
          </div>
          <div className="p-4 space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{link.label}</p>
                    <p className="text-xs text-gray-500">{link.value || 0} активных</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
