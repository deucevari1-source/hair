'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка авторизации');
        setLoading(false);
        return;
      }

      // Token is set as httpOnly cookie by the server.
      router.push('/admin');
    } catch {
      setError('Ошибка сети');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl tracking-[0.1em] text-charcoal-900 mb-2">
            HAIR ATELIER
          </h1>
          <p className="text-sm text-charcoal-500">Панель управления</p>
        </div>

        <div className="bg-white border border-cream-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-charcoal-500 mb-1 block">Email</label>
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="admin@hairatelier.com" required />
            </div>

            <div>
              <label className="text-xs text-charcoal-500 mb-1 block">Пароль</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="••••••••" required />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
