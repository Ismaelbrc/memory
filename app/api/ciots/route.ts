import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ciots, transportadores, contratantes, veiculos } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { generateId, generateCiotNumber, nowISO, todayStr } from '@/lib/utils';
import { eq, desc, gte, lte, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const transportadorId = searchParams.get('transportador_id');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const results = await db
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
        transportador_nome: transportadores.nome,
        veiculo_placa: veiculos.placa,
      })
      .from(ciots)
      .leftJoin(contratantes, eq(ciots.contratante_id, contratantes.id))
      .leftJoin(transportadores, eq(ciots.transportador_id, transportadores.id))
      .leftJoin(veiculos, eq(ciots.veiculo_id, veiculos.id))
      .orderBy(desc(ciots.created_at));

    let filtered = results;

    if (status) filtered = filtered.filter((c) => c.status === status);
    if (transportadorId) filtered = filtered.filter((c) => c.transportador_id === transportadorId);
    if (dataInicio) filtered = filtered.filter((c) => c.data_emissao >= dataInicio);
    if (dataFim) filtered = filtered.filter((c) => c.data_emissao <= dataFim);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.numero.toLowerCase().includes(s) ||
          (c.transportador_nome || '').toLowerCase().includes(s) ||
          (c.contratante_nome || '').toLowerCase().includes(s) ||
          c.origem_municipio.toLowerCase().includes(s) ||
          c.destino_municipio.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET ciots error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      tipo_operacao,
      contratante_id,
      transportador_id,
      veiculo_id,
      origem_municipio,
      origem_uf,
      destino_municipio,
      destino_uf,
      produto,
      tipo_carga,
      peso_kg,
      valor_carga,
      valor_frete,
      adiantamento,
      complemento,
      observacoes,
      data_emissao,
    } = body;

    const required = [
      'contratante_id', 'transportador_id', 'veiculo_id',
      'origem_municipio', 'origem_uf', 'destino_municipio', 'destino_uf',
      'produto', 'tipo_carga', 'valor_frete',
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 }
        );
      }
    }

    const now = nowISO();
    const id = generateId();
    const numero = generateCiotNumber();

    const [created] = await db
      .insert(ciots)
      .values({
        id,
        numero,
        data_emissao: data_emissao || todayStr(),
        tipo_operacao: tipo_operacao || 'contratacao',
        contratante_id,
        transportador_id,
        veiculo_id,
        origem_municipio: origem_municipio.trim(),
        origem_uf: origem_uf.toUpperCase(),
        destino_municipio: destino_municipio.trim(),
        destino_uf: destino_uf.toUpperCase(),
        produto: produto.trim(),
        tipo_carga,
        peso_kg: peso_kg ? parseFloat(peso_kg) : 0,
        valor_carga: valor_carga ? parseFloat(valor_carga) : 0,
        valor_frete: parseFloat(valor_frete),
        adiantamento: adiantamento ? parseFloat(adiantamento) : 0,
        complemento: complemento ? parseFloat(complemento) : 0,
        observacoes: observacoes?.trim() || null,
        status: 'emitido',
        created_at: now,
        updated_at: now,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('POST ciots error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
