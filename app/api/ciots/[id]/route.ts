import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ciots, transportadores, contratantes, veiculos, pef_lancamentos } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [ciot] = await db
      .select({
        id: ciots.id,
        numero: ciots.numero,
        data_emissao: ciots.data_emissao,
        tipo_operacao: ciots.tipo_operacao,
        origem_municipio: ciots.origem_municipio,
        origem_uf: ciots.origem_uf,
        destino_municipio: ciots.destino_municipio,
        destino_uf: ciots.destino_uf,
        produto: ciots.produto,
        tipo_carga: ciots.tipo_carga,
        peso_kg: ciots.peso_kg,
        valor_carga: ciots.valor_carga,
        valor_frete: ciots.valor_frete,
        adiantamento: ciots.adiantamento,
        complemento: ciots.complemento,
        observacoes: ciots.observacoes,
        status: ciots.status,
        created_at: ciots.created_at,
        updated_at: ciots.updated_at,
        contratante_id: ciots.contratante_id,
        transportador_id: ciots.transportador_id,
        veiculo_id: ciots.veiculo_id,
        contratante_nome: contratantes.razao_social,
        contratante_cnpj: contratantes.cnpj,
        transportador_nome: transportadores.nome,
        transportador_cpf: transportadores.cpf,
        transportador_rntrc: transportadores.rntrc,
        veiculo_placa: veiculos.placa,
        veiculo_tipo: veiculos.tipo,
        veiculo_rntrc: veiculos.rntrc,
      })
      .from(ciots)
      .leftJoin(contratantes, eq(ciots.contratante_id, contratantes.id))
      .leftJoin(transportadores, eq(ciots.transportador_id, transportadores.id))
      .leftJoin(veiculos, eq(ciots.veiculo_id, veiculos.id))
      .where(eq(ciots.id, id))
      .limit(1);

    if (!ciot) {
      return NextResponse.json({ error: 'CIOT não encontrado' }, { status: 404 });
    }

    // Get PEF lancamentos for this CIOT
    const lancamentos = await db
      .select()
      .from(pef_lancamentos)
      .where(eq(pef_lancamentos.ciot_id, id));

    const totalPago = lancamentos
      .filter((l) => l.status === 'pago')
      .reduce((sum, l) => sum + l.valor, 0);

    const totalPendente = lancamentos
      .filter((l) => l.status === 'pendente')
      .reduce((sum, l) => sum + l.valor, 0);

    return NextResponse.json({
      data: {
        ...ciot,
        lancamentos,
        financeiro: {
          total_pago: totalPago,
          total_pendente: totalPendente,
          saldo: (ciot.valor_frete || 0) - totalPago,
        },
      },
    });
  } catch (error) {
    console.error('GET ciot error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(ciots)
      .where(eq(ciots.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'CIOT não encontrado' }, { status: 404 });
    }

    const {
      status, observacoes,
      origem_municipio, origem_uf, destino_municipio, destino_uf,
      produto, tipo_carga, peso_kg, valor_carga, valor_frete,
      adiantamento, complemento,
    } = body;

    const [updated] = await db
      .update(ciots)
      .set({
        status: status || existing.status,
        observacoes: observacoes !== undefined ? observacoes : existing.observacoes,
        origem_municipio: origem_municipio || existing.origem_municipio,
        origem_uf: origem_uf || existing.origem_uf,
        destino_municipio: destino_municipio || existing.destino_municipio,
        destino_uf: destino_uf || existing.destino_uf,
        produto: produto || existing.produto,
        tipo_carga: tipo_carga || existing.tipo_carga,
        peso_kg: peso_kg !== undefined ? parseFloat(peso_kg) : existing.peso_kg,
        valor_carga: valor_carga !== undefined ? parseFloat(valor_carga) : existing.valor_carga,
        valor_frete: valor_frete !== undefined ? parseFloat(valor_frete) : existing.valor_frete,
        adiantamento: adiantamento !== undefined ? parseFloat(adiantamento) : existing.adiantamento,
        complemento: complemento !== undefined ? parseFloat(complemento) : existing.complemento,
        updated_at: nowISO(),
      })
      .where(eq(ciots.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PUT ciot error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [updated] = await db
      .update(ciots)
      .set({ status: 'cancelado', updated_at: nowISO() })
      .where(eq(ciots.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'CIOT não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('DELETE ciot error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
