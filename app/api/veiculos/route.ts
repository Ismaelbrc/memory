import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { veiculos, transportadores } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { generateId, nowISO } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const proprietarioId = searchParams.get('proprietario_id');

    const results = await db
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
      .orderBy(desc(veiculos.created_at));

    let filtered = results;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.placa.toLowerCase().includes(s) ||
          (v.rntrc || '').includes(s) ||
          (v.proprietario_nome || '').toLowerCase().includes(s)
      );
    }

    if (proprietarioId) {
      filtered = filtered.filter((v) => v.proprietario_id === proprietarioId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET veiculos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { placa, tipo, rntrc, proprietario_id, crlv_vencimento, seguro_vencimento } = body;

    if (!placa || !tipo || !proprietario_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: placa, tipo, proprietario_id' },
        { status: 400 }
      );
    }

    const now = nowISO();
    const id = generateId();

    const [created] = await db
      .insert(veiculos)
      .values({
        id,
        placa: placa.trim().toUpperCase().replace(/\s/g, ''),
        tipo,
        rntrc: rntrc?.trim() || '',
        proprietario_id,
        crlv_vencimento: crlv_vencimento || '',
        seguro_vencimento: seguro_vencimento || '',
        created_at: now,
        updated_at: now,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    console.error('POST veiculos error:', error);
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Placa já cadastrada' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
