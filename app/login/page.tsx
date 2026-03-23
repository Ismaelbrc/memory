'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    try {
      await fetch('/api/auth/seed', { method: 'POST' });
      setEmail('admin@fretecontrol.com');
      setPassword('Admin@2024');
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-lg shadow-amber-500/20">
            <Truck className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FreteControl</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Gestão de Fretes</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-[#0f1117] border border-[#2a2f42] text-slate-100 rounded-lg pl-10 pr-4 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0f1117] border border-[#2a2f42] text-slate-100 rounded-lg pl-10 pr-4 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#2a2f42]">
            <p className="text-xs text-slate-500 text-center">
              Primeira vez?{' '}
              <button
                onClick={handleSeed}
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Criar usuário admin
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2024 FreteControl · CIOT &amp; PEF · Transporte de Carga
        </p>
      </div>
    </div>
  );
}
