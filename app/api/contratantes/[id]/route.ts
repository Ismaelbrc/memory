import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contratantes } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [contratante] = await db
      .select()
      .from(contratantes)
      .where(eq(contratantes.id, id))
      .limit(1);

    if (!contratante) {
      return NextResponse.json({ error: 'Contratante não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: contratante });
  } catch (error) {
    console.error('GET contratante error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { razao_social, cnpj, email, telefone, responsavel, endereco } = body;

    const [existing] = await db
      .select()
      .from(contratantes)
      .where(eq(contratantes.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Contratante não encontrado' }, { status: 404 });
    }

    const cleanCnpj = cnpj ? cnpj.replace(/\D/g, '') : existing.cnpj;

    const [updated] = await db
      .update(contratantes)
      .set({
        razao_social: razao_social?.trim() || existing.razao_social,
        cnpj: cleanCnpj,
        email: email?.trim() || existing.email || '',
        telefone: telefone?.trim() || existing.telefone || '',
        responsavel: responsavel?.trim() || existing.responsavel || '',
        endereco: endereco?.trim() || existing.endereco || '',
        updated_at: nowISO(),
      })
      .where(eq(contratantes.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('PUT contratante error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deleted = await db.delete(contratantes).where(eq(contratantes.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Contratante não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE contratante error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
