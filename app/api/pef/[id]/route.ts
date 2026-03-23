import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pef_lancamentos, ciots } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [lancamento] = await db
      .select({
        id: pef_lancamentos.id,
        ciot_id: pef_lancamentos.ciot_id,
        tipo: pef_lancamentos.tipo,
        valor: pef_lancamentos.valor,
        data_pagamento: pef_lancamentos.data_pagamento,
        forma_pagamento: pef_lancamentos.forma_pagamento,
        status: pef_lancamentos.status,
        comprovante_url: pef_lancamentos.comprovante_url,
        descricao: pef_lancamentos.descricao,
        observacao: pef_lancamentos.observacao,
        created_at: pef_lancamentos.created_at,
        updated_at: pef_lancamentos.updated_at,
        ciot_numero: ciots.numero,
      })
      .from(pef_lancamentos)
      .leftJoin(ciots, eq(pef_lancamentos.ciot_id, ciots.id))
      .where(eq(pef_lancamentos.id, id))
      .limit(1);

    if (!lancamento) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: lancamento });
  } catch (error) {
    console.error('GET pef error:', error);
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
      .from(pef_lancamentos)
      .where(eq(pef_lancamentos.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    const { status, comprovante_url, observacao, valor, data_pagamento, forma_pagamento } = body;

    const [updated] = await db
      .update(pef_lancamentos)
      .set({
        status: status || existing.status,
        comprovante_url: comprovante_url !== undefined ? comprovante_url : existing.comprovante_url,
        observacao: observacao !== undefined ? observacao : existing.observacao,
        valor: valor !== undefined ? parseFloat(valor) : existing.valor,
        data_pagamento: data_pagamento || existing.data_pagamento,
        forma_pagamento: forma_pagamento || existing.forma_pagamento,
        updated_at: nowISO(),
      })
      .where(eq(pef_lancamentos.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PUT pef error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [updated] = await db
      .update(pef_lancamentos)
      .set({ status: 'estornado', updated_at: nowISO() })
      .where(eq(pef_lancamentos.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('DELETE pef error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
