'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validateCNPJ } from '@/lib/utils';

interface Contratante {
  id: string;
  razao_social: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  responsavel: string | null;
  endereco: string | null;
}

export default function EditContratantePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [form, setForm] = useState<Partial<Contratante>>({});

  useEffect(() => {
    fetch(`/api/contratantes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const c = d.data;
          // Format CNPJ for display
          const digits = c.cnpj.replace(/\D/g, '');
          let masked = digits;
          if (digits.length > 2) masked = digits.slice(0, 2) + '.' + digits.slice(2);
          if (digits.length > 5) masked = masked.slice(0, 6) + '.' + digits.slice(5);
          if (digits.length > 8) masked = masked.slice(0, 10) + '/' + digits.slice(8);
          if (digits.length > 12) masked = masked.slice(0, 15) + '-' + digits.slice(12);
          setForm({ ...c, cnpj: masked });
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id]);

  function handleCnpjChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) masked = masked.slice(0, 6) + '.' + digits.slice(5);
    if (digits.length > 8) masked = masked.slice(0, 10) + '/' + digits.slice(8);
    if (digits.length > 12) masked = masked.slice(0, 15) + '-' + digits.slice(12);
    setForm((f) => ({ ...f, cnpj: masked }));
    if (digits.length === 14) setCnpjError(validateCNPJ(digits) ? '' : 'CNPJ inválido');
    else setCnpjError('');
  }

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const digits = (form.cnpj || '').replace(/\D/g, '');
    if (!validateCNPJ(digits)) { setCnpjError('CNPJ inválido'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/contratantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao atualizar'); return; }
      router.push('/contratantes');
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Deseja excluir este contratante?')) return;
    setLoading(true);
    try {
      await fetch(`/api/contratantes/${id}`, { method: 'DELETE' });
      router.push('/contratantes');
    } catch {
      setError('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contratantes">
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Editar Contratante</h1>
            <p className="text-sm text-slate-400 mt-0.5">{form.razao_social}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleDelete}>
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Razão Social"
                value={form.razao_social || ''}
                onChange={(e) => handleChange('razao_social', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">CNPJ</label>
              <input
                type="text"
                value={form.cnpj || ''}
                onChange={(e) => handleCnpjChange(e.target.value)}
                className={`w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3 font-mono text-sm focus:outline-none focus:ring-1 transition-colors ${
                  cnpjError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
                }`}
              />
              {cnpjError && <p className="mt-1 text-xs text-red-400">{cnpjError}</p>}
            </div>
            <Input label="Responsável" value={form.responsavel || ''} onChange={(e) => handleChange('responsavel', e.target.value)} />
            <Input label="E-mail" type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
            <Input label="Telefone" value={form.telefone || ''} onChange={(e) => handleChange('telefone', e.target.value)} />
            <div className="md:col-span-2">
              <Input label="Endereço" value={form.endereco || ''} onChange={(e) => handleChange('endereco', e.target.value)} />
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
            Salvar Alterações
          </Button>
          <Link href="/contratantes">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
