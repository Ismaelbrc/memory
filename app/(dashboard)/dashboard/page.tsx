'use client';

import { useEffect, useState } from 'react';
import { FileText, Truck, Clock, AlertTriangle, TrendingUp, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CiotStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardData {
  stats: {
    ciots_hoje: number;
    ciots_semana: number;
    ciots_mes: number;
    em_andamento: number;
    concluidos: number;
    cancelados: number;
    pendencias_pef: number;
    total_pendente: number;
    total_frete_emitido: number;
    total_pago: number;
    transportadores_ativos: number;
  };
  recent_ciots: Array<{
    id: string;
    numero: string;
    data_emissao: string;
    origem_municipio: string;
    origem_uf: string;
    destino_municipio: string;
    destino_uf: string;
    valor_frete: number;
    status: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'warning' | 'danger';
    date: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recent_ciots, alerts } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Visão geral das operações de frete</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CIOTs Hoje"
          value={stats.ciots_hoje}
          icon={<FileText className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          subtitle={`${stats.ciots_semana} esta semana`}
        />
        <StatCard
          title="Em Andamento"
          value={stats.em_andamento}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
          subtitle={`${stats.ciots_mes} no mês`}
        />
        <StatCard
          title="Concluídos"
          value={stats.concluidos}
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          iconBg="bg-green-500/10"
          subtitle="Total"
        />
        <StatCard
          title="Pendências PEF"
          value={stats.pendencias_pef}
          icon={<DollarSign className="w-5 h-5 text-red-400" />}
          iconBg="bg-red-500/10"
          subtitle={formatCurrency(stats.total_pendente)}
          subtitleColor="text-red-400"
        />
      </div>

      {/* Financial cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Financeiro</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Emitido</span>
              <span className="text-sm font-mono font-semibold text-slate-200">{formatCurrency(stats.total_frete_emitido)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Pago</span>
              <span className="text-sm font-mono font-semibold text-green-400">{formatCurrency(stats.total_pago)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">A Receber</span>
              <span className="text-sm font-mono font-semibold text-amber-400">{formatCurrency(stats.total_frete_emitido - stats.total_pago)}</span>
            </div>
            <div className="pt-2 border-t border-[#2a2f42]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Transportadores Ativos</span>
                <span className="text-sm font-semibold text-slate-200">{stats.transportadores_ativos}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent CIOTs */}
        <Card className="col-span-1 lg:col-span-2" padding="none">
          <div className="px-5 py-4 border-b border-[#2a2f42] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">CIOTs Recentes</h3>
            <a href="/ciots" className="text-xs text-amber-400 hover:text-amber-300">Ver todos →</a>
          </div>
          <div className="divide-y divide-[#2a2f42]/50">
            {recent_ciots.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">Nenhum CIOT encontrado</p>
            ) : (
              recent_ciots.slice(0, 6).map((ciot) => (
                <a
                  key={ciot.id}
                  href={`/ciots/${ciot.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#2a2f42]/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400">{ciot.numero}</span>
                      <CiotStatusBadge status={ciot.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {ciot.origem_municipio}/{ciot.origem_uf} → {ciot.destino_municipio}/{ciot.destino_uf}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-slate-200">{formatCurrency(ciot.valor_frete)}</p>
                    <p className="text-xs text-slate-500">{formatDate(ciot.data_emissao)}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-[#2a2f42] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300">Alertas ({alerts.length})</h3>
          </div>
          <div className="divide-y divide-[#2a2f42]/50">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                {alert.severity === 'danger' ? (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${alert.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  subtitle,
  subtitleColor = 'text-slate-500',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  subtitle?: string;
  subtitleColor?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value.toLocaleString('pt-BR')}</p>
      <p className="text-xs font-medium text-slate-400 mt-0.5">{title}</p>
      {subtitle && <p className={`text-xs mt-1 ${subtitleColor}`}>{subtitle}</p>}
    </Card>
  );
}
