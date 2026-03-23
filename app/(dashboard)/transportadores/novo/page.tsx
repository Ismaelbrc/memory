'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { validateCPF, formatCPF } from '@/lib/utils';

export default function NovoTransportadorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cpfError, setCpfError] = useState('');

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    cnh_numero: '',
    cnh_categoria: '',
    cnh_vencimento: '',
    rntrc: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: '',
  });

  function handleCpfChange(value: string) {
    // Apply mask
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 3) masked = digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length > 6) masked = masked.slice(0, 7) + '.' + digits.slice(6);
    if (digits.length > 9) masked = masked.slice(0, 11) + '-' + digits.slice(9);
    setForm((f) => ({ ...f, cpf: masked }));

    if (digits.length === 11) {
      if (!validateCPF(digits)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
      }
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

    const digits = form.cpf.replace(/\D/g, '');
    if (!validateCPF(digits)) {
      setCpfError('CPF inválido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transportadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar transportador');
        return;
      }

      router.push('/transportadores');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/transportadores">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Novo Transportador</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cadastrar motorista ou transportador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal info */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo"
                value={form.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome do transportador"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                CPF <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                required
                className={`w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3 font-mono text-sm focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600 ${
                  cpfError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
                }`}
              />
              {cpfError && <p className="mt-1 text-xs text-red-400">{cpfError}</p>}
            </div>
            <Input
              label="RNTRC"
              value={form.rntrc}
              onChange={(e) => handleChange('rntrc', e.target.value)}
              placeholder="Número RNTRC"
              required
            />
          </div>
        </Card>

        {/* CNH */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Carteira Nacional de Habilitação (CNH)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Número CNH"
              value={form.cnh_numero}
              onChange={(e) => handleChange('cnh_numero', e.target.value)}
              placeholder="00000000000"
              required
            />
            <Select
              label="Categoria"
              value={form.cnh_categoria}
              onChange={(e) => handleChange('cnh_categoria', e.target.value)}
              options={[
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'AB', label: 'AB' },
                { value: 'C', label: 'C' },
                { value: 'D', label: 'D' },
                { value: 'E', label: 'E' },
                { value: 'AC', label: 'AC' },
                { value: 'AD', label: 'AD' },
                { value: 'AE', label: 'AE' },
              ]}
              placeholder="Selecione"
              required
            />
            <Input
              label="Vencimento"
              type="date"
              value={form.cnh_vencimento}
              onChange={(e) => handleChange('cnh_vencimento', e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Banking */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados Bancários (opcional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              value={form.banco}
              onChange={(e) => handleChange('banco', e.target.value)}
              placeholder="Ex: Banco do Brasil"
            />
            <Select
              label="Tipo de Conta"
              value={form.tipo_conta}
              onChange={(e) => handleChange('tipo_conta', e.target.value)}
              options={[
                { value: 'corrente', label: 'Conta Corrente' },
                { value: 'poupanca', label: 'Poupança' },
              ]}
              placeholder="Selecione"
            />
            <Input
              label="Agência"
              value={form.agencia}
              onChange={(e) => handleChange('agencia', e.target.value)}
              placeholder="0000"
            />
            <Input
              label="Conta"
              value={form.conta}
              onChange={(e) => handleChange('conta', e.target.value)}
              placeholder="00000-0"
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
            Salvar Transportador
          </Button>
          <Link href="/transportadores">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
