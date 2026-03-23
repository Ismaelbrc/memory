'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { PefStatusBadge } from '@/components/StatusBadge';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PefLancamento {
  id: string;
  ciot_id: string;
  ciot_numero?: string;
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

export default function PefPage() {
  const [data, setData] = useState<PefLancamento[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      if (statusFilter) params.set('status', statusFilter);
      if (tipoFilter) params.set('tipo', tipoFilter);
      const res = await fetch(`/api/pef?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, tipoFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await fetch(`/api/pef/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  const columns = [
    {
      key: 'ciot_numero',
      header: 'CIOT',
      render: (row: PefLancamento) => (
        <a href={`/ciots/${row.ciot_id}`} className="font-mono text-xs text-amber-400 hover:text-amber-300">
          {row.ciot_numero || row.ciot_id.slice(0, 8) + '...'}
        </a>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row: PefLancamento) => (
        <span className="text-slate-200">{tipoLabels[row.tipo] || row.tipo}</span>
      ),
    },
    {
      key: 'data_pagamento',
      header: 'Data',
      render: (row: PefLancamento) => (
        <span className="font-mono text-sm text-slate-300">{formatDate(row.data_pagamento)}</span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (row: PefLancamento) => (
        <span className="font-mono font-semibold text-slate-100">{formatCurrency(row.valor)}</span>
      ),
    },
    {
      key: 'forma_pagamento',
      header: 'Forma',
      render: (row: PefLancamento) => (
        <span className="text-slate-400 text-sm">{formaLabels[row.forma_pagamento] || row.forma_pagamento}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: PefLancamento) => <PefStatusBadge status={row.status} />,
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (row: PefLancamento) => (
        <span className="text-xs text-slate-500 truncate max-w-32 block">{row.descricao || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: PefLancamento) => (
        <div className="flex items-center gap-1">
          {row.status === 'pendente' && (
            <button
              onClick={() => handleStatusChange(row.id, 'pago')}
              className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              Marcar Pago
            </button>
          )}
          {row.status === 'pago' && (
            <button
              onClick={() => handleStatusChange(row.id, 'estornado')}
              className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Estornar
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalPago = data.filter(d => d.status === 'pago').reduce((s, d) => s + d.valor, 0);
  const totalPendente = data.filter(d => d.status === 'pendente').reduce((s, d) => s + d.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">PEF — Pagamento Eletrônico de Frete</h1>
          <p className="text-sm text-slate-400 mt-0.5">Lançamentos vinculados a CIOTs</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Pago (página)</p>
          <p className="text-lg font-mono font-bold text-green-400">{formatCurrency(totalPago)}</p>
        </div>
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Pendente (página)</p>
          <p className="text-lg font-mono font-bold text-amber-400">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Registros</p>
          <p className="text-lg font-bold text-slate-100">{pagination.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'pendente', label: 'Pendente' },
              { value: 'pago', label: 'Pago' },
              { value: 'estornado', label: 'Estornado' },
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos os tipos' },
              { value: 'adiantamento', label: 'Adiantamento' },
              { value: 'complemento', label: 'Complemento' },
              { value: 'pedagio', label: 'Pedágio' },
              { value: 'combustivel', label: 'Combustível' },
              { value: 'outros', label: 'Outros' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        data={data as unknown as Record<string, unknown>[]}
        pagination={pagination}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por CIOT, descrição..."
        loading={loading}
        emptyMessage="Nenhum lançamento PEF encontrado"
      />
    </div>
  );
}
