import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pef_lancamentos, ciots } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { generateId, nowISO } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ciotId = searchParams.get('ciot_id');
    const status = searchParams.get('status');
    const formaPagamento = searchParams.get('forma_pagamento');
    const tipo = searchParams.get('tipo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const results = await db
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
      .orderBy(desc(pef_lancamentos.created_at));

    let filtered = results;

    if (ciotId) filtered = filtered.filter((l) => l.ciot_id === ciotId);
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (formaPagamento) filtered = filtered.filter((l) => l.forma_pagamento === formaPagamento);
    if (tipo) filtered = filtered.filter((l) => l.tipo === tipo);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET pef error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      ciot_id, tipo, valor, data_pagamento,
      forma_pagamento, status, descricao, observacao, comprovante_url,
    } = body;

    if (!ciot_id || !tipo || !valor || !data_pagamento || !forma_pagamento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: ciot_id, tipo, valor, data_pagamento, forma_pagamento' },
        { status: 400 }
      );
    }

    // Verify CIOT exists
    const [ciot] = await db.select().from(ciots).where(eq(ciots.id, ciot_id)).limit(1);
    if (!ciot) {
      return NextResponse.json({ error: 'CIOT não encontrado' }, { status: 404 });
    }

    const now = nowISO();
    const id = generateId();

    const [created] = await db
      .insert(pef_lancamentos)
      .values({
        id,
        ciot_id,
        tipo,
        valor: parseFloat(valor),
        data_pagamento,
        forma_pagamento,
        status: (status && ['pendente', 'pago', 'estornado'].includes(status)) ? status : 'pendente',
        comprovante_url: comprovante_url || null,
        descricao: descricao?.trim() || null,
        observacao: observacao?.trim() || null,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('POST pef error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
