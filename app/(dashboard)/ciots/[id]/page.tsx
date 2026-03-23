'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, DollarSign, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CiotStatusBadge, PefStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

interface CiotDetail {
  id: string;
  numero: string;
  data_emissao: string;
  tipo_operacao: string;
  status: string;
  origem_municipio: string;
  origem_uf: string;
  destino_municipio: string;
  destino_uf: string;
  produto: string;
  tipo_carga: string;
  peso_kg: number;
  valor_carga: number;
  valor_frete: number;
  adiantamento: number;
  complemento: number;
  observacoes: string;
  // Flat joined fields from API
  transportador_nome?: string;
  transportador_cpf?: string;
  transportador_rntrc?: string;
  veiculo_placa?: string;
  veiculo_tipo?: string;
  veiculo_rntrc?: string;
  contratante_nome?: string;
  contratante_cnpj?: string;
  lancamentos?: PefLancamento[];
  financeiro?: { total_pago: number; total_pendente: number; saldo: number; };
}

interface PefLancamento {
  id: string;
  tipo: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  status: string;
  descricao?: string;
  observacao?: string;
}

const tipoLabels: Record<string, string> = {
  adiantamento: 'Adiantamento',
  complemento: 'Complemento',
  pedagio: 'Pedágio',
  combustivel: 'Combustível',
  outros: 'Outros',
};
const formaLabels: Record<string, string> = {
  pix: 'PIX',
  ted: 'TED',
  cartao_frete: 'Cartão Frete',
};

export default function CiotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ciot, setCiot] = useState<CiotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPefForm, setShowPefForm] = useState(false);
  const [pefLoading, setPefLoading] = useState(false);
  const [pefError, setPefError] = useState('');

  const [pefForm, setPefForm] = useState({
    tipo: 'adiantamento',
    valor: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'pix',
    status: 'pendente',
    descricao: '',
    observacao: '',
  });

  async function fetchCiot() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ciots/${id}`);
      const json = await res.json();
      if (res.ok) setCiot(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCiot(); }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Confirma alterar status para "${newStatus}"?`)) return;
    setUpdatingStatus(true);
    try {
      await fetch(`/api/ciots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCiot();
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePefSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPefError('');
    setPefLoading(true);
    try {
      const res = await fetch('/api/pef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pefForm,
          ciot_id: id,
          valor: parseFloat(pefForm.valor) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPefError(data.error || 'Erro'); return; }
      setShowPefForm(false);
      setPefForm({ tipo: 'adiantamento', valor: '', data_pagamento: new Date().toISOString().split('T')[0], forma_pagamento: 'pix', status: 'pendente', descricao: '', observacao: '' });
      fetchCiot();
    } finally {
      setPefLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!ciot) return <div className="text-slate-400 p-8">CIOT não encontrado.</div>;

  const totalPago = ciot.financeiro?.total_pago || 0;
  const saldoPagar = ciot.valor_frete - totalPago;
  const lancamentos = ciot.lancamentos || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/ciots">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-100 font-mono">{ciot.numero}</h1>
            <CiotStatusBadge status={ciot.status} />
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Emitido em {formatDate(ciot.data_emissao)}</p>
        </div>
        {/* Status actions */}
        <div className="flex items-center gap-2">
          {ciot.status === 'emitido' && (
            <button
              onClick={() => handleStatusChange('em_andamento')}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> Iniciar Viagem
            </button>
          )}
          {ciot.status === 'em_andamento' && (
            <button
              onClick={() => handleStatusChange('concluido')}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
            </button>
          )}
          {(ciot.status === 'emitido' || ciot.status === 'em_andamento') && (
            <button
              onClick={() => handleStatusChange('cancelado')}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Partes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Contratante</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{ciot.contratante_nome || '—'}</p>
                <p className="text-xs font-mono text-slate-400">{ciot.contratante_cnpj || ''}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Transportador (TAC)</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{ciot.transportador_nome || '—'}</p>
                <p className="text-xs font-mono text-slate-400">RNTRC: {ciot.transportador_rntrc || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Veículo</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5 font-mono">{ciot.veiculo_placa || '—'} — {ciot.veiculo_tipo?.toUpperCase() || ''}</p>
                <p className="text-xs font-mono text-slate-400">RNTRC: {ciot.veiculo_rntrc || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo de Operação</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5 capitalize">{ciot.tipo_operacao?.replace('_', ' ')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rota e Carga</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Origem</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{ciot.origem_municipio}/{ciot.origem_uf}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Destino</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{ciot.destino_municipio}/{ciot.destino_uf}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Produto</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{ciot.produto}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo de Carga</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5 capitalize">{ciot.tipo_carga?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Peso Estimado</p>
                <p className="text-sm font-mono font-semibold text-slate-100 mt-0.5">{ciot.peso_kg?.toLocaleString('pt-BR')} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor da Carga</p>
                <p className="text-sm font-mono font-semibold text-slate-100 mt-0.5">{formatCurrency(ciot.valor_carga)}</p>
              </div>
            </div>
            {ciot.observacoes && (
              <div className="mt-3 pt-3 border-t border-[#2a2f42]">
                <p className="text-xs text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-300">{ciot.observacoes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Financial summary */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resumo Financeiro</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Valor do Frete</span>
                <span className="text-sm font-mono font-bold text-slate-100">{formatCurrency(ciot.valor_frete)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Adiantamento prev.</span>
                <span className="text-sm font-mono text-slate-300">{formatCurrency(ciot.adiantamento || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Complemento prev.</span>
                <span className="text-sm font-mono text-slate-300">{formatCurrency(ciot.complemento || 0)}</span>
              </div>
              <div className="pt-2 border-t border-[#2a2f42]">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Total Pago (PEF)</span>
                  <span className="text-sm font-mono font-bold text-green-400">{formatCurrency(totalPago)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-400">Saldo a Pagar</span>
                <span className={`text-base font-mono font-bold ${saldoPagar > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {formatCurrency(Math.max(0, saldoPagar))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* PEF Lancamentos */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[#2a2f42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300">PEF — Lançamentos</h3>
            <span className="text-xs text-slate-500">({lancamentos.length})</span>
          </div>
          {ciot.status !== 'cancelado' && (
            <Button
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowPefForm(!showPefForm)}
            >
              Novo Lançamento
            </Button>
          )}
        </div>

        {showPefForm && (
          <form onSubmit={handlePefSubmit} className="p-5 border-b border-[#2a2f42] bg-[#0f1117]/50">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Novo Lançamento PEF</h4>
            {pefError && (
              <div className="mb-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {pefError}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Select
                label="Tipo"
                value={pefForm.tipo}
                onChange={e => setPefForm(f => ({ ...f, tipo: e.target.value }))}
                options={[
                  { value: 'adiantamento', label: 'Adiantamento' },
                  { value: 'complemento', label: 'Complemento' },
                  { value: 'pedagio', label: 'Pedágio' },
                  { value: 'combustivel', label: 'Combustível' },
                  { value: 'outros', label: 'Outros' },
                ]}
                required
              />
              <Input
                label="Valor (R$)"
                value={pefForm.valor}
                onChange={e => setPefForm(f => ({ ...f, valor: e.target.value }))}
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
              <Input
                label="Data"
                value={pefForm.data_pagamento}
                onChange={e => setPefForm(f => ({ ...f, data_pagamento: e.target.value }))}
                type="date"
                required
              />
              <Select
                label="Forma"
                value={pefForm.forma_pagamento}
                onChange={e => setPefForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                options={[
                  { value: 'pix', label: 'PIX' },
                  { value: 'ted', label: 'TED' },
                  { value: 'cartao_frete', label: 'Cartão Frete' },
                ]}
                required
              />
              <Select
                label="Status"
                value={pefForm.status}
                onChange={e => setPefForm(f => ({ ...f, status: e.target.value }))}
                options={[
                  { value: 'pendente', label: 'Pendente' },
                  { value: 'pago', label: 'Pago' },
                ]}
                required
              />
              <div className="col-span-2">
                <Input
                  label="Descrição"
                  value={pefForm.descricao}
                  onChange={e => setPefForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do lançamento"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="submit" loading={pefLoading} size="sm">Salvar</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowPefForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {lancamentos.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Nenhum lançamento PEF registrado</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2f42]">
                {['Tipo', 'Data', 'Valor', 'Forma', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/50">
              {lancamentos.map(l => (
                <tr key={l.id} className="hover:bg-[#2a2f42]/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-200">{tipoLabels[l.tipo] || l.tipo}</td>
                  <td className="px-5 py-3 text-sm font-mono text-slate-300">{formatDate(l.data_pagamento)}</td>
                  <td className="px-5 py-3 text-sm font-mono font-semibold text-slate-100">{formatCurrency(l.valor)}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{formaLabels[l.forma_pagamento] || l.forma_pagamento}</td>
                  <td className="px-5 py-3"><PefStatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
