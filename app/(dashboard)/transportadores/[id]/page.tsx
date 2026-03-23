'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { validateCPF } from '@/lib/utils';

interface Transportador {
  id: string;
  nome: string;
  cpf: string;
  cnh_numero: string;
  cnh_categoria: string;
  cnh_vencimento: string;
  rntrc: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  status: string;
}

export default function EditTransportadorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [form, setForm] = useState<Partial<Transportador>>({});

  useEffect(() => {
    fetch(`/api/transportadores/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const t = d.data;
          // Format CPF for display
          const digits = t.cpf.replace(/\D/g, '');
          let masked = digits;
          if (digits.length > 3) masked = digits.slice(0, 3) + '.' + digits.slice(3);
          if (digits.length > 6) masked = masked.slice(0, 7) + '.' + digits.slice(6);
          if (digits.length > 9) masked = masked.slice(0, 11) + '-' + digits.slice(9);
          setForm({ ...t, cpf: masked });
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id]);

  function handleCpfChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 3) masked = digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length > 6) masked = masked.slice(0, 7) + '.' + digits.slice(6);
    if (digits.length > 9) masked = masked.slice(0, 11) + '-' + digits.slice(9);
    setForm((f) => ({ ...f, cpf: masked }));
    if (digits.length === 11) {
      setCpfError(validateCPF(digits) ? '' : 'CPF inválido');
    } else {
      setCpfError('');
    }
  }

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const digits = (form.cpf || '').replace(/\D/g, '');
    if (!validateCPF(digits)) {
      setCpfError('CPF inválido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/transportadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar');
        return;
      }
      router.push('/transportadores');
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Deseja inativar este transportador?')) return;
    setLoading(true);
    try {
      await fetch(`/api/transportadores/${id}`, { method: 'DELETE' });
      router.push('/transportadores');
    } catch {
      setError('Erro ao inativar');
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
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/transportadores">
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Editar Transportador</h1>
            <p className="text-sm text-slate-400 mt-0.5">{form.nome}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleDelete}>
          Inativar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo"
                value={form.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                CPF <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.cpf || ''}
                onChange={(e) => handleCpfChange(e.target.value)}
                required
                className={`w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3 font-mono text-sm focus:outline-none focus:ring-1 transition-colors ${
                  cpfError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
                }`}
              />
              {cpfError && <p className="mt-1 text-xs text-red-400">{cpfError}</p>}
            </div>
            <Input
              label="RNTRC"
              value={form.rntrc || ''}
              onChange={(e) => handleChange('rntrc', e.target.value)}
              required
            />
            <Select
              label="Status"
              value={form.status || 'ativo'}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">CNH</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Número CNH"
              value={form.cnh_numero || ''}
              onChange={(e) => handleChange('cnh_numero', e.target.value)}
              required
            />
            <Select
              label="Categoria"
              value={form.cnh_categoria || ''}
              onChange={(e) => handleChange('cnh_categoria', e.target.value)}
              options={['A','B','AB','C','D','E','AC','AD','AE'].map(v => ({ value: v, label: v }))}
              placeholder="Selecione"
              required
            />
            <Input
              label="Vencimento"
              type="date"
              value={form.cnh_vencimento || ''}
              onChange={(e) => handleChange('cnh_vencimento', e.target.value)}
              required
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados Bancários</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Banco" value={form.banco || ''} onChange={(e) => handleChange('banco', e.target.value)} />
            <Select
              label="Tipo de Conta"
              value={form.tipo_conta || ''}
              onChange={(e) => handleChange('tipo_conta', e.target.value)}
              options={[
                { value: 'corrente', label: 'Conta Corrente' },
                { value: 'poupanca', label: 'Poupança' },
              ]}
              placeholder="Selecione"
            />
            <Input label="Agência" value={form.agencia || ''} onChange={(e) => handleChange('agencia', e.target.value)} />
            <Input label="Conta" value={form.conta || ''} onChange={(e) => handleChange('conta', e.target.value)} />
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
          <Link href="/transportadores">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
