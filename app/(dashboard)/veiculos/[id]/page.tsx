'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  rntrc: string | null;
  proprietario_id: string | null;
  crlv_vencimento: string | null;
  seguro_vencimento: string | null;
}

interface Transportador {
  id: string;
  nome: string;
  rntrc: string;
}

export default function EditVeiculoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Veiculo>>({});
  const [transportadores, setTransportadores] = useState<Transportador[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/veiculos/${id}`).then((r) => r.json()),
      fetch('/api/transportadores?limit=200').then((r) => r.json()),
    ]).then(([vData, tData]) => {
      if (vData.data) setForm(vData.data);
      setTransportadores(tData.data || []);
    }).catch(console.error).finally(() => setFetching(false));
  }, [id]);

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/veiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar');
        return;
      }
      router.push('/veiculos');
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Deseja excluir este veículo?')) return;
    setLoading(true);
    try {
      await fetch(`/api/veiculos/${id}`, { method: 'DELETE' });
      router.push('/veiculos');
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
          <Link href="/veiculos">
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Editar Veículo</h1>
            <p className="text-sm text-slate-400 mt-0.5 font-mono">{form.placa}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleDelete}>
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Dados do Veículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Placa</label>
              <input
                type="text"
                value={form.placa || ''}
                onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
                className="w-full bg-[#1a1f2e] border border-[#2a2f42] text-slate-100 rounded-lg py-2 px-3 font-mono font-bold tracking-widest text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
            <Select
              label="Tipo"
              value={form.tipo || ''}
              onChange={(e) => handleChange('tipo', e.target.value)}
              options={[
                { value: 'truck', label: 'Truck' },
                { value: 'carreta', label: 'Carreta' },
                { value: 'bitrem', label: 'Bitrem' },
                { value: 'reboque', label: 'Reboque' },
                { value: 'vanderleia', label: 'Vanderleia' },
                { value: 'outros', label: 'Outros' },
              ]}
            />
            <div className="md:col-span-2">
              <Select
                label="Proprietário"
                value={form.proprietario_id || ''}
                onChange={(e) => handleChange('proprietario_id', e.target.value)}
                options={transportadores.map((t) => ({ value: t.id, label: t.nome }))}
                placeholder="Selecione"
              />
            </div>
            <Input
              label="RNTRC"
              value={form.rntrc || ''}
              onChange={(e) => handleChange('rntrc', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vencimento CRLV"
              type="date"
              value={form.crlv_vencimento || ''}
              onChange={(e) => handleChange('crlv_vencimento', e.target.value)}
            />
            <Input
              label="Vencimento Seguro"
              type="date"
              value={form.seguro_vencimento || ''}
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
            Salvar Alterações
          </Button>
          <Link href="/veiculos">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
