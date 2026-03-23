'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, FileText } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { CiotStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Select } from '@/components/ui/Select';

interface Ciot {
  id: string;
  numero: string;
  data_emissao: string;
  tipo_operacao: string;
  origem_municipio: string;
  origem_uf: string;
  destino_municipio: string;
  destino_uf: string;
  valor_frete: number;
  status: string;
  transportador_nome?: string;
  contratante_nome?: string;
}

export default function CiotsPage() {
  const [data, setData] = useState<Ciot[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/ciots?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const columns = [
    {
      key: 'numero',
      header: 'Nº CIOT',
      render: (row: Ciot) => (
        <span className="font-mono text-xs text-amber-400">{row.numero}</span>
      ),
    },
    {
      key: 'data_emissao',
      header: 'Emissão',
      render: (row: Ciot) => (
        <span className="font-mono text-sm text-slate-300">{formatDate(row.data_emissao)}</span>
      ),
    },
    {
      key: 'transportador_nome',
      header: 'Transportador',
      render: (row: Ciot) => (
        <span className="text-slate-200 font-medium">{row.transportador_nome || '—'}</span>
      ),
    },
    {
      key: 'rota',
      header: 'Rota',
      render: (row: Ciot) => (
        <span className="text-slate-400 text-xs">
          {row.origem_municipio}/{row.origem_uf} → {row.destino_municipio}/{row.destino_uf}
        </span>
      ),
    },
    {
      key: 'valor_frete',
      header: 'Valor Frete',
      render: (row: Ciot) => (
        <span className="font-mono font-semibold text-slate-100">{formatCurrency(row.valor_frete)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Ciot) => <CiotStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Ciot) => (
        <div className="flex items-center gap-1">
          <Link href={`/ciots/${row.id}`}>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </button>
          </Link>
          <Link href={`/ciots/${row.id}`}>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">CIOTs</h1>
          <p className="text-sm text-slate-400 mt-0.5">Código Identificador de Operação de Transporte</p>
        </div>
        <Link href="/ciots/novo">
          <Button icon={<Plus className="w-4 h-4" />}>Novo CIOT</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'emitido', label: 'Emitido' },
              { value: 'em_andamento', label: 'Em Andamento' },
              { value: 'concluido', label: 'Concluído' },
              { value: 'cancelado', label: 'Cancelado' },
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
        searchPlaceholder="Buscar por número, transportador, rota..."
        loading={loading}
        emptyMessage="Nenhum CIOT encontrado"
      />
    </div>
  );
}
