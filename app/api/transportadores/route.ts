import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transportadores } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { generateId, nowISO } from '@/lib/utils';
import { eq, like, or, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');

    let query = db.select().from(transportadores);

    const results = await db
      .select()
      .from(transportadores)
      .orderBy(desc(transportadores.created_at));

    let filtered = results;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nome.toLowerCase().includes(s) ||
          t.cpf.includes(s) ||
          t.rntrc.includes(s)
      );
    }

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET transportadores error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      nome, cpf, cnh_numero, cnh_categoria, cnh_vencimento,
      rntrc, banco, agencia, conta, tipo_conta,
    } = body;

    if (!nome || !cpf || !cnh_numero || !cnh_categoria || !cnh_vencimento || !rntrc) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, cpf, cnh_numero, cnh_categoria, cnh_vencimento, rntrc' },
        { status: 400 }
      );
    }

    const now = nowISO();
    const id = generateId();

    const cleanCpf = cpf.replace(/\D/g, '');

    const [created] = await db
      .insert(transportadores)
      .values({
        id,
        nome: nome.trim(),
        cpf: cleanCpf,
        cnh_numero: cnh_numero.trim(),
        cnh_categoria: cnh_categoria.trim().toUpperCase(),
        cnh_vencimento,
        rntrc: rntrc.trim(),
        banco: banco?.trim() || null,
        agencia: agencia?.trim() || null,
        conta: conta?.trim() || null,
        tipo_conta: tipo_conta || null,
        status: 'ativo',
        created_at: now,
        updated_at: now,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    console.error('POST transportadores error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
