'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { formatCNPJ } from '@/lib/utils';

interface Contratante {
  id: string;
  razao_social: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  responsavel: string | null;
}

export default function ContratantesPage() {
  const [data, setData] = useState<Contratante[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      const res = await fetch(`/api/contratantes?${params}`);
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

  const columns = [
    {
      key: 'razao_social',
      header: 'Razão Social',
      sortable: true,
      render: (row: Contratante) => (
        <span className="font-medium text-slate-100">{row.razao_social}</span>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      render: (row: Contratante) => (
        <span className="font-mono text-slate-300 text-xs">{formatCNPJ(row.cnpj)}</span>
      ),
    },
    {
      key: 'responsavel',
      header: 'Responsável',
      render: (row: Contratante) => (
        <span className="text-slate-400">{row.responsavel || '—'}</span>
      ),
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (row: Contratante) => (
        <span className="text-slate-400">{row.email || '—'}</span>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (row: Contratante) => (
        <span className="font-mono text-slate-400 text-xs">{row.telefone || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Contratante) => (
        <Link href={`/contratantes/${row.id}`}>
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
          <h1 className="text-xl font-bold text-slate-100">Contratantes</h1>
          <p className="text-sm text-slate-400 mt-0.5">Empresas que contratam o frete</p>
        </div>
        <Link href="/contratantes/novo">
          <Button icon={<Plus className="w-4 h-4" />}>Novo Contratante</Button>
        </Link>
      </div>

      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        data={data as unknown as Record<string, unknown>[]}
        pagination={pagination}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por razão social, CNPJ..."
        loading={loading}
        emptyMessage="Nenhum contratante encontrado"
      />
    </div>
  );
}
