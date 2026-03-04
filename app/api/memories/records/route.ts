import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/memories/auth'
import { createMemory, listMemories } from '@/lib/memories/service'
import { CreateMemorySchema } from '@/lib/memories/validation'
import type { MemoryType } from '@/lib/memories/types'

export async function GET(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { project } = auth
    const s = req.nextUrl.searchParams

    const result = await listMemories({
      projectId:  project.id,
      type:       (s.get('type') as MemoryType) || undefined,
      tags:       s.get('tags')?.split(',').filter(Boolean),
      key_name:   s.get('key_name') || undefined,
      session_id: s.get('session_id') || undefined,
      page:       Number(s.get('page') ?? 1),
      limit:      Math.min(Number(s.get('limit') ?? 50), 200),
    })

    const data = result.data.map(({ embedding, ...m }) => ({
      ...m,
      has_embedding: embedding !== null,
    }))

    return NextResponse.json({ ...result, data })
  } catch (error) {
    console.error('GET /api/memories/records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { project } = auth
    const body = await req.json()
    const parsed = CreateMemorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const forceEmbed = req.nextUrl.searchParams.get('embed') === 'true'
    const memory = await createMemory({ ...parsed.data, projectId: project.id, forceEmbed })

    const { embedding, ...response } = memory
    return NextResponse.json({ record: { ...response, has_embedding: embedding !== null } }, { status: 201 })
  } catch (error) {
    console.error('POST /api/memories/records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
