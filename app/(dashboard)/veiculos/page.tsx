'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  rntrc: string | null;
  proprietario_id: string | null;
  proprietario_nome: string | null;
  crlv_vencimento: string | null;
  seguro_vencimento: string | null;
}

const tipoLabels: Record<string, string> = {
  truck: 'Truck',
  carreta: 'Carreta',
  bitrem: 'Bitrem',
  reboque: 'Reboque',
  vanderleia: 'Vanderleia',
  outros: 'Outros',
};

export default function VeiculosPage() {
  const [data, setData] = useState<Veiculo[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      const res = await fetch(`/api/veiculos?${params}`);
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
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const columns = [
    {
      key: 'placa',
      header: 'Placa',
      sortable: true,
      render: (row: Veiculo) => (
        <span className="font-mono font-bold text-slate-100 tracking-widest">{row.placa}</span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row: Veiculo) => (
        <Badge variant="info">{tipoLabels[row.tipo] || row.tipo}</Badge>
      ),
    },
    {
      key: 'rntrc',
      header: 'RNTRC',
      render: (row: Veiculo) => (
        <span className="font-mono text-slate-400 text-xs">{row.rntrc || '—'}</span>
      ),
    },
    {
      key: 'proprietario_nome',
      header: 'Proprietário',
      render: (row: Veiculo) => (
        <span className="text-slate-300">{row.proprietario_nome || '—'}</span>
      ),
    },
    {
      key: 'crlv_vencimento',
      header: 'CRLV Venc.',
      render: (row: Veiculo) => {
        if (!row.crlv_vencimento) return <span className="text-slate-600">—</span>;
        const expired = row.crlv_vencimento < today;
        const expiringSoon = !expired && row.crlv_vencimento <= soon;
        return (
          <span className={`font-mono text-sm ${expired ? 'text-red-400' : expiringSoon ? 'text-amber-400' : 'text-slate-300'}`}>
            {formatDate(row.crlv_vencimento)}
          </span>
        );
      },
    },
    {
      key: 'seguro_vencimento',
      header: 'Seguro Venc.',
      render: (row: Veiculo) => {
        if (!row.seguro_vencimento) return <span className="text-slate-600">—</span>;
        const expired = row.seguro_vencimento < today;
        const expiringSoon = !expired && row.seguro_vencimento <= soon;
        return (
          <span className={`font-mono text-sm ${expired ? 'text-red-400' : expiringSoon ? 'text-amber-400' : 'text-slate-300'}`}>
            {formatDate(row.seguro_vencimento)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row: Veiculo) => (
        <Link href={`/veiculos/${row.id}`}>
          <button className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Veículos</h1>
          <p className="text-sm text-slate-400 mt-0.5">Frota cadastrada no sistema</p>
        </div>
        <Link href="/veiculos/novo">
          <Button icon={<Plus className="w-4 h-4" />}>Novo Veículo</Button>
        </Link>
      </div>

      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        data={data as unknown as Record<string, unknown>[]}
        pagination={pagination}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por placa, proprietário..."
        loading={loading}
        emptyMessage="Nenhum veículo encontrado"
      />
    </div>
  );
}
