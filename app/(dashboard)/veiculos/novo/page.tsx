'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface Transportador {
  id: string;
  nome: string;
  rntrc: string;
}

export default function NovoVeiculoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transportadores, setTransportadores] = useState<Transportador[]>([]);

  const [form, setForm] = useState({
    placa: '',
    tipo: '',
    rntrc: '',
    proprietario_id: '',
    crlv_vencimento: '',
    seguro_vencimento: '',
  });

  useEffect(() => {
    fetch('/api/transportadores?limit=200&status=ativo')
      .then((r) => r.json())
      .then((d) => setTransportadores(d.data || []))
      .catch(console.error);
  }, []);

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));

    // Auto-fill RNTRC from transportador
    if (field === 'proprietario_id') {
      const t = transportadores.find((t) => t.id === value);
      if (t) setForm((f) => ({ ...f, [field]: value, rntrc: t.rntrc }));
    }
  }

  function handlePlacaChange(value: string) {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    setForm((f) => ({ ...f, placa: clean }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar veículo');
        return;
      }
      router.push('/veiculos');
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/veiculos">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Novo Veículo</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cadastrar veículo na frota</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados do Veículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Placa <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.placa}
                onChange={(e) => handlePlacaChange(e.target.value)}
                placeholder="AAA0000 ou AAA0A00"
                required
                maxLength={8}
                className="w-full bg-[#1a1f2e] border border-[#2a2f42] text-slate-100 rounded-lg py-2 px-3 font-mono font-bold text-sm uppercase tracking-widest focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 placeholder:text-slate-600"
              />
            </div>
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              options={[
                { value: 'truck', label: 'Truck' },
                { value: 'carreta', label: 'Carreta' },
                { value: 'bitrem', label: 'Bitrem' },
                { value: 'reboque', label: 'Reboque' },
                { value: 'vanderleia', label: 'Vanderleia' },
                { value: 'outros', label: 'Outros' },
              ]}
              placeholder="Selecione o tipo"
              required
            />
            <div className="md:col-span-2">
              <Select
                label="Proprietário / Transportador"
                value={form.proprietario_id}
                onChange={(e) => handleChange('proprietario_id', e.target.value)}
                options={transportadores.map((t) => ({ value: t.id, label: `${t.nome} — RNTRC: ${t.rntrc}` }))}
                placeholder="Selecione o proprietário"
                required
              />
            </div>
            <Input
              label="RNTRC do Veículo"
              value={form.rntrc}
              onChange={(e) => handleChange('rntrc', e.target.value)}
              placeholder="Preenchido automaticamente"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vencimento CRLV"
              type="date"
              value={form.crlv_vencimento}
              onChange={(e) => handleChange('crlv_vencimento', e.target.value)}
            />
            <Input
              label="Vencimento do Seguro"
              type="date"
              value={form.seguro_vencimento}
              onChange={(e) => handleChange('seguro_vencimento', e.target.value)}
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
            Salvar Veículo
          </Button>
          <Link href="/veiculos">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
