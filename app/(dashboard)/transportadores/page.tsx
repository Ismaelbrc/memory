'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { TransportadorStatusBadge } from '@/components/StatusBadge';
import { formatCPF, formatDate } from '@/lib/utils';

interface Transportador {
  id: string;
  nome: string;
  cpf: string;
  cnh_numero: string;
  cnh_categoria: string;
  cnh_vencimento: string;
  rntrc: string;
  status: string;
  created_at: string;
}

export default function TransportadoresPage() {
  const [data, setData] = useState<Transportador[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      const res = await fetch(`/api/transportadores?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (row: Transportador) => (
        <span className="font-medium text-slate-100">{row.nome}</span>
      ),
    },
    {
      key: 'cpf',
      header: 'CPF',
      render: (row: Transportador) => (
        <span className="font-mono text-slate-300">{formatCPF(row.cpf)}</span>
      ),
    },
    {
      key: 'rntrc',
      header: 'RNTRC',
      render: (row: Transportador) => (
        <span className="font-mono text-slate-400">{row.rntrc}</span>
      ),
    },
    {
      key: 'cnh_vencimento',
      header: 'CNH Vencimento',
      render: (row: Transportador) => {
        const expired = row.cnh_vencimento < today;
        const soon = !expired && row.cnh_vencimento <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        return (
          <span className={`font-mono text-sm ${expired ? 'text-red-400' : soon ? 'text-amber-400' : 'text-slate-300'}`}>
            {formatDate(row.cnh_vencimento)}
            {expired && ' ⚠'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Transportador) => <TransportadorStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Transportador) => (
        <div className="flex items-center gap-1">
          <Link href={`/transportadores/${row.id}`}>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Transportadores</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestão de motoristas e transportadores</p>
        </div>
        <Link href="/transportadores/novo">
          <Button icon={<Plus className="w-4 h-4" />}>Novo Transportador</Button>
        </Link>
      </div>

      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        data={data as unknown as Record<string, unknown>[]}
        pagination={pagination}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por nome, CPF ou RNTRC..."
        loading={loading}
        emptyMessage="Nenhum transportador encontrado"
      />
    </div>
  );
}
