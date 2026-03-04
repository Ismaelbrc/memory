import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/memories/auth'
import { getMemoryById, updateMemory, deleteMemory } from '@/lib/memories/service'
import { UpdateMemorySchema } from '@/lib/memories/validation'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const memory = await getMemoryById(id, auth.project.id)
    if (!memory) return NextResponse.json({ error: 'Memória não encontrada' }, { status: 404 })
    return NextResponse.json({ record: memory })
  } catch (error) {
    console.error('GET /api/memories/records/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateMemorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const memory = await updateMemory(id, auth.project.id, parsed.data)
    if (!memory) return NextResponse.json({ error: 'Memória não encontrada' }, { status: 404 })

    const { embedding, ...response } = memory
    return NextResponse.json({ record: { ...response, has_embedding: embedding !== null } })
  } catch (error) {
    console.error('PUT /api/memories/records/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const deleted = await deleteMemory(id, auth.project.id)
    if (!deleted) return NextResponse.json({ error: 'Memória não encontrada' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/memories/records/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
