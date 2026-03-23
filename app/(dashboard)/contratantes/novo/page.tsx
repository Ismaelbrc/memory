'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validateCNPJ } from '@/lib/utils';

export default function NovoContratantePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cnpjError, setCnpjError] = useState('');

  const [form, setForm] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    responsavel: '',
    endereco: '',
  });

  function handleCnpjChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) masked = masked.slice(0, 6) + '.' + digits.slice(5);
    if (digits.length > 8) masked = masked.slice(0, 10) + '/' + digits.slice(8);
    if (digits.length > 12) masked = masked.slice(0, 15) + '-' + digits.slice(12);
    setForm((f) => ({ ...f, cnpj: masked }));

    if (digits.length === 14) {
      setCnpjError(validateCNPJ(digits) ? '' : 'CNPJ inválido');
    } else {
      setCnpjError('');
    }
  }

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const digits = form.cnpj.replace(/\D/g, '');
    if (!validateCNPJ(digits)) {
      setCnpjError('CNPJ inválido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contratantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar contratante');
        return;
      }
      router.push('/contratantes');
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/contratantes">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Novo Contratante</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cadastrar empresa contratante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Razão Social"
                value={form.razao_social}
                onChange={(e) => handleChange('razao_social', e.target.value)}
                placeholder="Nome da empresa"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                CNPJ <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                required
                className={`w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3 font-mono text-sm focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600 ${
                  cnpjError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
                }`}
              />
              {cnpjError && <p className="mt-1 text-xs text-red-400">{cnpjError}</p>}
            </div>
            <Input
              label="Responsável"
              value={form.responsavel}
              onChange={(e) => handleChange('responsavel', e.target.value)}
              placeholder="Nome do responsável"
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contato@empresa.com"
            />
            <Input
              label="Telefone"
              value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
            <div className="md:col-span-2">
              <Input
                label="Endereço"
                value={form.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Rua, número, cidade, UF"
              />
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
            Salvar Contratante
          </Button>
          <Link href="/contratantes">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
