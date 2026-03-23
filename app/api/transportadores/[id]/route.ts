import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transportadores } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [transportador] = await db
      .select()
      .from(transportadores)
      .where(eq(transportadores.id, id))
      .limit(1);

    if (!transportador) {
      return NextResponse.json({ error: 'Transportador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: transportador });
  } catch (error) {
    console.error('GET transportador error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      nome, cpf, cnh_numero, cnh_categoria, cnh_vencimento,
      rntrc, banco, agencia, conta, tipo_conta, status,
    } = body;

    const [existing] = await db
      .select()
      .from(transportadores)
      .where(eq(transportadores.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transportador não encontrado' }, { status: 404 });
    }

    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : existing.cpf;

    const [updated] = await db
      .update(transportadores)
      .set({
        nome: nome?.trim() || existing.nome,
        cpf: cleanCpf,
        cnh_numero: cnh_numero?.trim() || existing.cnh_numero,
        cnh_categoria: cnh_categoria?.trim().toUpperCase() || existing.cnh_categoria,
        cnh_vencimento: cnh_vencimento || existing.cnh_vencimento,
        rntrc: rntrc?.trim() || existing.rntrc,
        banco: banco?.trim() || null,
        agencia: agencia?.trim() || null,
        conta: conta?.trim() || null,
        tipo_conta: tipo_conta || null,
        status: status || existing.status,
        updated_at: nowISO(),
      })
      .where(eq(transportadores.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('PUT transportador error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [updated] = await db
      .update(transportadores)
      .set({ status: 'inativo', updated_at: nowISO() })
      .where(eq(transportadores.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Transportador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('DELETE transportador error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
