import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/memories/auth'
import { getEmbeddableMemories } from '@/lib/memories/service'
import { generateEmbedding } from '@/lib/memories/embeddings'
import { rankByEmbedding } from '@/lib/memories/search'
import { SearchSchema } from '@/lib/memories/validation'
import type { MemoryType } from '@/lib/memories/types'

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = SearchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { query, top_k, type_filter, tags_filter, threshold } = parsed.data

    const queryEmbedding = await generateEmbedding(query)
    const candidates = await getEmbeddableMemories(
      auth.project.id,
      type_filter as MemoryType[] | undefined,
      tags_filter
    )

    const results = rankByEmbedding(queryEmbedding, candidates, {
      topK: top_k,
      threshold,
    })

    return NextResponse.json({
      query,
      results,
      total_candidates: candidates.length,
      returned: results.length,
    })
  } catch (error) {
    console.error('POST /api/memories/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
