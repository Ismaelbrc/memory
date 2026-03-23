'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface Transportador { id: string; nome: string; rntrc: string; }
interface Veiculo { id: string; placa: string; tipo: string; rntrc: string; proprietario_id: string; }
interface Contratante { id: string; razao_social: string; cnpj: string; }

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function NovoCiotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freteAlert, setFreteAlert] = useState('');

  const [transportadores, setTransportadores] = useState<Transportador[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [contratantes, setContratantes] = useState<Contratante[]>([]);

  const [form, setForm] = useState({
    tipo_operacao: 'contratacao',
    contratante_id: '',
    transportador_id: '',
    veiculo_id: '',
    origem_municipio: '',
    origem_uf: '',
    destino_municipio: '',
    destino_uf: '',
    produto: '',
    tipo_carga: 'carga_geral',
    peso_kg: '',
    valor_carga: '',
    valor_frete: '',
    adiantamento: '',
    complemento: '',
    observacoes: '',
  });

  const [veiculoRntrc, setVeiculoRntrc] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/transportadores?limit=200').then(r => r.json()),
      fetch('/api/veiculos?limit=200').then(r => r.json()),
      fetch('/api/contratantes?limit=200').then(r => r.json()),
    ]).then(([t, v, c]) => {
      setTransportadores(t.data || []);
      setVeiculos(v.data || []);
      setContratantes(c.data || []);
    }).catch(console.error);
  }, []);

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));

    if (field === 'veiculo_id') {
      const found = veiculos.find(x => x.id === value);
      setVeiculoRntrc(found?.rntrc || '');
    }

    if (field === 'valor_frete' && value) {
      const val = parseFloat(value);
      if (!isNaN(val) && val < 500) {
        setFreteAlert('⚠ Valor abaixo do piso mínimo ANTT recomendado. Verifique a tabela vigente.');
      } else {
        setFreteAlert('');
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        peso_kg: parseFloat(form.peso_kg) || 0,
        valor_carga: parseFloat(form.valor_carga) || 0,
        valor_frete: parseFloat(form.valor_frete) || 0,
        adiantamento: parseFloat(form.adiantamento) || 0,
        complemento: parseFloat(form.complemento) || 0,
      };

      const res = await fetch('/api/ciots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao emitir CIOT');
        return;
      }

      router.push(`/ciots/${data.data.id}`);
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const transportadorOptions = [
    { value: '', label: 'Selecione o transportador' },
    ...transportadores.map(t => ({ value: t.id, label: `${t.nome} — RNTRC: ${t.rntrc}` })),
  ];
  const veiculoOptions = [
    { value: '', label: 'Selecione o veículo' },
    ...veiculos.map(v => ({ value: v.id, label: `${v.placa} — ${v.tipo.toUpperCase()}` })),
  ];
  const contratanteOptions = [
    { value: '', label: 'Selecione o contratante' },
    ...contratantes.map(c => ({ value: c.id, label: c.razao_social })),
  ];
  const ufOptions = [{ value: '', label: 'UF' }, ...UF_LIST.map(u => ({ value: u, label: u }))];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/ciots">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Emitir CIOT</h1>
          <p className="text-sm text-slate-400 mt-0.5">Nova operação de transporte</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Operação */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 pb-3 border-b border-[#2a2f42]">
            Dados da Operação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Operação"
              value={form.tipo_operacao}
              onChange={e => handleChange('tipo_operacao', e.target.value)}
              options={[
                { value: 'contratacao', label: 'Contratação' },
                { value: 'subcontratacao', label: 'Subcontratação' },
              ]}
              required
            />
            <Select
              label="Contratante / Embarcador"
              value={form.contratante_id}
              onChange={e => handleChange('contratante_id', e.target.value)}
              options={contratanteOptions}
              required
            />
          </div>
        </Card>

        {/* Transportador e Veículo */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 pb-3 border-b border-[#2a2f42]">
            Transportador e Veículo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Transportador (TAC)"
              value={form.transportador_id}
              onChange={e => handleChange('transportador_id', e.target.value)}
              options={transportadorOptions}
              required
            />
            <Select
              label="Veículo"
              value={form.veiculo_id}
              onChange={e => handleChange('veiculo_id', e.target.value)}
              options={veiculoOptions}
              required
            />
            {veiculoRntrc && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">RNTRC do Veículo</label>
                <div className="bg-[#0f1117] border border-[#2a2f42] rounded-lg px-3 py-2.5 font-mono text-amber-400 text-sm">
                  {veiculoRntrc}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Rota */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 pb-3 border-b border-[#2a2f42]">
            Rota
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Origem — Município"
                  value={form.origem_municipio}
                  onChange={e => handleChange('origem_municipio', e.target.value)}
                  placeholder="Ex: São Paulo"
                  required
                />
              </div>
              <Select
                label="UF"
                value={form.origem_uf}
                onChange={e => handleChange('origem_uf', e.target.value)}
                options={ufOptions}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Destino — Município"
                  value={form.destino_municipio}
                  onChange={e => handleChange('destino_municipio', e.target.value)}
                  placeholder="Ex: Curitiba"
                  required
                />
              </div>
              <Select
                label="UF"
                value={form.destino_uf}
                onChange={e => handleChange('destino_uf', e.target.value)}
                options={ufOptions}
                required
              />
            </div>
          </div>
        </Card>

        {/* Carga */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 pb-3 border-b border-[#2a2f42]">
            Carga e Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Produto Transportado"
              value={form.produto}
              onChange={e => handleChange('produto', e.target.value)}
              placeholder="Ex: Soja"
              required
            />
            <Select
              label="Tipo de Carga"
              value={form.tipo_carga}
              onChange={e => handleChange('tipo_carga', e.target.value)}
              options={[
                { value: 'granel_solido', label: 'Granel Sólido' },
                { value: 'granel_liquido', label: 'Granel Líquido' },
                { value: 'fracionado', label: 'Fracionado' },
                { value: 'neogranel', label: 'Neogranel' },
                { value: 'carga_geral', label: 'Carga Geral' },
                { value: 'perigosa', label: 'Carga Perigosa' },
                { value: 'outros', label: 'Outros' },
              ]}
              required
            />
            <Input
              label="Peso Estimado (kg)"
              value={form.peso_kg}
              onChange={e => handleChange('peso_kg', e.target.value)}
              type="number"
              placeholder="Ex: 25000"
              required
            />
            <Input
              label="Valor da Carga (R$)"
              value={form.valor_carga}
              onChange={e => handleChange('valor_carga', e.target.value)}
              type="number"
              step="0.01"
              placeholder="Ex: 150000.00"
              required
            />
            <div>
              <Input
                label="Valor do Frete (R$)"
                value={form.valor_frete}
                onChange={e => handleChange('valor_frete', e.target.value)}
                type="number"
                step="0.01"
                placeholder="Ex: 4500.00"
                required
                error={freteAlert}
              />
            </div>
          </div>

          {freteAlert && (
            <div className="mt-3 flex items-start gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {freteAlert}
            </div>
          )}
        </Card>

        {/* Pagamento */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 pb-3 border-b border-[#2a2f42]">
            Forma de Pagamento Prevista
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Adiantamento (R$)"
              value={form.adiantamento}
              onChange={e => handleChange('adiantamento', e.target.value)}
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            <Input
              label="Complemento (R$)"
              value={form.complemento}
              onChange={e => handleChange('complemento', e.target.value)}
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </Card>

        {/* Observações */}
        <Card>
          <label className="block text-xs font-medium text-slate-300 mb-2">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={e => handleChange('observacoes', e.target.value)}
            rows={3}
            placeholder="Informações adicionais sobre a operação..."
            className="w-full bg-[#0f1117] border border-[#2a2f42] text-slate-100 rounded-lg px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors placeholder:text-slate-600 text-sm resize-none"
          />
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/ciots">
            <Button variant="secondary" type="button">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            loading={loading}
            icon={<Save className="w-4 h-4" />}
          >
            Emitir CIOT
          </Button>
        </div>
      </form>
    </div>
  );
}
