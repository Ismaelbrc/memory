import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contratantes } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { generateId, nowISO } from '@/lib/utils';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(contratantes)
      .orderBy(desc(contratantes.created_at));

    let filtered = results;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.razao_social.toLowerCase().includes(s) ||
          c.cnpj.includes(s) ||
          (c.responsavel || '').toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET contratantes error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { razao_social, cnpj, email, telefone, responsavel, endereco } = body;

    if (!razao_social || !cnpj) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: razao_social, cnpj' },
        { status: 400 }
      );
    }

    const now = nowISO();
    const id = generateId();
    const cleanCnpj = cnpj.replace(/\D/g, '');

    const [created] = await db
      .insert(contratantes)
      .values({
        id,
        razao_social: razao_social.trim(),
        cnpj: cleanCnpj,
        email: email?.trim() || '',
        telefone: telefone?.trim() || '',
        responsavel: responsavel?.trim() || '',
        endereco: endereco?.trim() || '',
        created_at: now,
        updated_at: now,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    console.error('POST contratantes error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
