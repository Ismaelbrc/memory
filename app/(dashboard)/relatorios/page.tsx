'use client';

import { useState } from 'react';
import { Download, FileText, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportResult {
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, string | number>;
}

const UF_LIST = ['', 'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<'ciots' | 'pef' | 'conformidade'>('ciots');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');

  // CIOT filters
  const [ciotFilters, setCiotFilters] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    origem_uf: '',
    destino_uf: '',
  });

  // PEF filters
  const [pefFilters, setPefFilters] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    forma_pagamento: '',
  });

  async function handleGenerateReport(type: string) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let params = new URLSearchParams({ type });
      if (type === 'ciots') {
        Object.entries(ciotFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
      } else if (type === 'pef') {
        Object.entries(pefFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
      }

      // For now, fetch data from respective APIs and display
      let url = '';
      if (type === 'ciots') url = `/api/ciots?limit=1000&${params.toString().replace('type=ciots&', '')}`;
      else if (type === 'pef') url = `/api/pef?limit=1000&${params.toString().replace('type=pef&', '')}`;
      else url = `/api/ciots?limit=1000&conformidade=1`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) { setError(json.error || 'Erro ao gerar relatório'); return; }

      const data = json.data || [];

      if (type === 'ciots') {
        const rows = data.map((c: Record<string, unknown>) => [
          c.numero as string,
          formatDate(c.data_emissao as string),
          c.transportador_nome as string || '—',
          `${c.origem_municipio}/${c.origem_uf} → ${c.destino_municipio}/${c.destino_uf}`,
          c.produto as string,
          formatCurrency(c.valor_frete as number),
          c.status as string,
        ]);
        setResult({
          headers: ['Nº CIOT', 'Emissão', 'Transportador', 'Rota', 'Produto', 'Valor Frete', 'Status'],
          rows,
          summary: {
            'Total de CIOTs': data.length,
            'Valor Total': formatCurrency(data.reduce((s: number, c: Record<string, unknown>) => s + (c.valor_frete as number || 0), 0)),
          },
        });
      } else if (type === 'pef') {
        const rows = data.map((p: Record<string, unknown>) => [
          p.ciot_numero as string || (p.ciot_id as string || '').slice(0, 8),
          p.tipo as string,
          formatDate(p.data_pagamento as string),
          formatCurrency(p.valor as number),
          p.forma_pagamento as string,
          p.status as string,
        ]);
        setResult({
          headers: ['CIOT', 'Tipo', 'Data', 'Valor', 'Forma', 'Status'],
          rows,
          summary: {
            'Total de Lançamentos': data.length,
            'Total Pago': formatCurrency(data.filter((p: Record<string, unknown>) => p.status === 'pago').reduce((s: number, p: Record<string, unknown>) => s + (p.valor as number || 0), 0)),
            'Total Pendente': formatCurrency(data.filter((p: Record<string, unknown>) => p.status === 'pendente').reduce((s: number, p: Record<string, unknown>) => s + (p.valor as number || 0), 0)),
          },
        });
      } else {
        // Conformidade: CIOTs sem PEF
        const semPef = data.filter((c: Record<string, unknown>) => !c.has_pef);
        const rows = data.map((c: Record<string, unknown>) => [
          c.numero as string,
          formatDate(c.data_emissao as string),
          c.transportador_nome as string || '—',
          formatCurrency(c.valor_frete as number),
          c.status as string,
          c.has_pef ? 'Sim' : 'Não',
        ]);
        setResult({
          headers: ['Nº CIOT', 'Emissão', 'Transportador', 'Valor Frete', 'Status', 'Tem PEF'],
          rows,
          summary: {
            'Total CIOTs': data.length,
            'Com PEF': data.length - semPef.length,
            'Sem PEF': semPef.length,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!result) return;
    const rows = [result.headers, ...result.rows];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fretecontrol-relatorio-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { id: 'ciots', label: 'CIOTs', icon: FileText },
    { id: 'pef', label: 'Financeiro PEF', icon: DollarSign },
    { id: 'conformidade', label: 'Conformidade', icon: AlertCircle },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Relatórios</h1>
        <p className="text-sm text-slate-400 mt-0.5">Exportação e análise de dados</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2f42]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-4">Filtros</h3>

        {activeTab === 'ciots' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Input
              label="Data Início"
              type="date"
              value={ciotFilters.data_inicio}
              onChange={e => setCiotFilters(f => ({ ...f, data_inicio: e.target.value }))}
            />
            <Input
              label="Data Fim"
              type="date"
              value={ciotFilters.data_fim}
              onChange={e => setCiotFilters(f => ({ ...f, data_fim: e.target.value }))}
            />
            <Select
              label="Status"
              value={ciotFilters.status}
              onChange={e => setCiotFilters(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: '', label: 'Todos' },
                { value: 'emitido', label: 'Emitido' },
                { value: 'em_andamento', label: 'Em Andamento' },
                { value: 'concluido', label: 'Concluído' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
            <Select
              label="Origem UF"
              value={ciotFilters.origem_uf}
              onChange={e => setCiotFilters(f => ({ ...f, origem_uf: e.target.value }))}
              options={UF_LIST.map(u => ({ value: u, label: u || 'Todas' }))}
            />
            <Select
              label="Destino UF"
              value={ciotFilters.destino_uf}
              onChange={e => setCiotFilters(f => ({ ...f, destino_uf: e.target.value }))}
              options={UF_LIST.map(u => ({ value: u, label: u || 'Todas' }))}
            />
          </div>
        )}

        {activeTab === 'pef' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Data Início"
              type="date"
              value={pefFilters.data_inicio}
              onChange={e => setPefFilters(f => ({ ...f, data_inicio: e.target.value }))}
            />
            <Input
              label="Data Fim"
              type="date"
              value={pefFilters.data_fim}
              onChange={e => setPefFilters(f => ({ ...f, data_fim: e.target.value }))}
            />
            <Select
              label="Status"
              value={pefFilters.status}
              onChange={e => setPefFilters(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: '', label: 'Todos' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'pago', label: 'Pago' },
                { value: 'estornado', label: 'Estornado' },
              ]}
            />
            <Select
              label="Forma de Pagamento"
              value={pefFilters.forma_pagamento}
              onChange={e => setPefFilters(f => ({ ...f, forma_pagamento: e.target.value }))}
              options={[
                { value: '', label: 'Todas' },
                { value: 'pix', label: 'PIX' },
                { value: 'ted', label: 'TED' },
                { value: 'cartao_frete', label: 'Cartão Frete' },
              ]}
            />
          </div>
        )}

        {activeTab === 'conformidade' && (
          <p className="text-sm text-slate-400">
            Lista todos os CIOTs indicando se possuem lançamentos PEF vinculados.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={() => handleGenerateReport(activeTab)}
            loading={loading}
            icon={<BarChart3 className="w-4 h-4" />}
          >
            Gerar Relatório
          </Button>
          {result && (
            <Button
              variant="secondary"
              onClick={exportCSV}
              icon={<Download className="w-4 h-4" />}
            >
              Exportar CSV
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.summary && (
            <div className="flex flex-wrap gap-4">
              {Object.entries(result.summary).map(([key, val]) => (
                <div key={key} className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500">{key}</p>
                  <p className="text-base font-semibold font-mono text-slate-100 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2f42] flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">{result.rows.length} registros</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2f42]">
                    {result.headers.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2f42]/50">
                  {result.rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-[#2a2f42]/20 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-sm text-slate-300 whitespace-nowrap">
                          {j === 0 ? <span className="font-mono text-amber-400 text-xs">{cell}</span> : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {result.rows.length > 100 && (
                    <tr>
                      <td colSpan={result.headers.length} className="px-4 py-3 text-xs text-slate-500 text-center">
                        ... e mais {result.rows.length - 100} registros (exporte CSV para ver todos)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
