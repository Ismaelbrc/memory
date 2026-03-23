import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ciots, pef_lancamentos, veiculos, transportadores } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { todayStr } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = todayStr();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    // Fetch all CIOTs
    const allCiots = await db.select().from(ciots).orderBy(desc(ciots.created_at));

    const ciotsHoje = allCiots.filter((c) => c.data_emissao === today).length;
    const ciotsSemana = allCiots.filter((c) => c.data_emissao >= weekAgoStr).length;
    const ciotsMes = allCiots.filter((c) => c.data_emissao >= monthAgoStr).length;
    const ciotsEmAndamento = allCiots.filter((c) => c.status === 'em_andamento').length;
    const ciotsConcluidos = allCiots.filter((c) => c.status === 'concluido').length;

    // Pending PEF payments
    const allLancamentos = await db.select().from(pef_lancamentos);
    const pendentes = allLancamentos.filter((l) => l.status === 'pendente');
    const totalPendente = pendentes.reduce((sum, l) => sum + l.valor, 0);

    // Recent CIOTs (last 5)
    const recentCiots = allCiots.slice(0, 10);

    // Alerts: documents expiring in 30 days
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

    const allVeiculos = await db.select().from(veiculos);
    const allTransportadores = await db.select().from(transportadores);

    const alerts: Array<{
      type: string;
      message: string;
      severity: 'warning' | 'danger';
      date: string;
    }> = [];

    // Check vehicle CRLV expiry
    for (const v of allVeiculos) {
      if (v.crlv_vencimento && v.crlv_vencimento <= thirtyDaysStr) {
        const isExpired = v.crlv_vencimento < today;
        alerts.push({
          type: 'crlv',
          message: `CRLV do veículo ${v.placa} ${isExpired ? 'vencido' : 'vence'} em ${v.crlv_vencimento}`,
          severity: isExpired ? 'danger' : 'warning',
          date: v.crlv_vencimento,
        });
      }
      if (v.seguro_vencimento && v.seguro_vencimento <= thirtyDaysStr) {
        const isExpired = v.seguro_vencimento < today;
        alerts.push({
          type: 'seguro',
          message: `Seguro do veículo ${v.placa} ${isExpired ? 'vencido' : 'vence'} em ${v.seguro_vencimento}`,
          severity: isExpired ? 'danger' : 'warning',
          date: v.seguro_vencimento,
        });
      }
    }

    // Check driver CNH expiry
    for (const t of allTransportadores) {
      if (t.status === 'ativo' && t.cnh_vencimento && t.cnh_vencimento <= thirtyDaysStr) {
        const isExpired = t.cnh_vencimento < today;
        alerts.push({
          type: 'cnh',
          message: `CNH de ${t.nome} ${isExpired ? 'vencida' : 'vence'} em ${t.cnh_vencimento}`,
          severity: isExpired ? 'danger' : 'warning',
          date: t.cnh_vencimento,
        });
      }
    }

    // Sort alerts by date
    alerts.sort((a, b) => a.date.localeCompare(b.date));

    // Financial summary
    const totalFreteEmitido = allCiots
      .filter((c) => c.status !== 'cancelado')
      .reduce((sum, c) => sum + (c.valor_frete || 0), 0);

    const totalPago = allLancamentos
      .filter((l) => l.status === 'pago')
      .reduce((sum, l) => sum + l.valor, 0);

    return NextResponse.json({
      stats: {
        ciots_hoje: ciotsHoje,
        ciots_semana: ciotsSemana,
        ciots_mes: ciotsMes,
        em_andamento: ciotsEmAndamento,
        concluidos: ciotsConcluidos,
        cancelados: allCiots.filter((c) => c.status === 'cancelado').length,
        pendencias_pef: pendentes.length,
        total_pendente: totalPendente,
        total_frete_emitido: totalFreteEmitido,
        total_pago: totalPago,
        transportadores_ativos: allTransportadores.filter((t) => t.status === 'ativo').length,
      },
      recent_ciots: recentCiots,
      alerts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
