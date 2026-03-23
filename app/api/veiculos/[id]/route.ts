import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { veiculos, transportadores } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [veiculo] = await db
      .select({
        id: veiculos.id,
        placa: veiculos.placa,
        tipo: veiculos.tipo,
        rntrc: veiculos.rntrc,
        proprietario_id: veiculos.proprietario_id,
        crlv_vencimento: veiculos.crlv_vencimento,
        seguro_vencimento: veiculos.seguro_vencimento,
        created_at: veiculos.created_at,
        updated_at: veiculos.updated_at,
        proprietario_nome: transportadores.nome,
      })
      .from(veiculos)
      .leftJoin(transportadores, eq(veiculos.proprietario_id, transportadores.id))
      .where(eq(veiculos.id, id))
      .limit(1);

    if (!veiculo) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: veiculo });
  } catch (error) {
    console.error('GET veiculo error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { placa, tipo, rntrc, proprietario_id, crlv_vencimento, seguro_vencimento } = body;

    const [existing] = await db.select().from(veiculos).where(eq(veiculos.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    const [updated] = await db
      .update(veiculos)
      .set({
        placa: placa ? placa.trim().toUpperCase().replace(/\s/g, '') : existing.placa,
        tipo: tipo || existing.tipo,
        rntrc: rntrc?.trim() || existing.rntrc || '',
        proprietario_id: proprietario_id || existing.proprietario_id,
        crlv_vencimento: crlv_vencimento || existing.crlv_vencimento || '',
        seguro_vencimento: seguro_vencimento || existing.seguro_vencimento || '',
        updated_at: nowISO(),
      })
      .where(eq(veiculos.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('PUT veiculo error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Placa já cadastrada' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const deleted = await db.delete(veiculos).where(eq(veiculos.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE veiculo error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
