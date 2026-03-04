import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import pool, { query, queryOne } from '../db'
import type { Memory, MemoryProject, MemoryRow, MemoryType } from './types'
import { generateEmbedding, embeddingToJson, ALWAYS_EMBED_TYPES } from './embeddings'

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

function parseMemoryRow(row: MemoryRow): Memory {
  return {
    ...row,
    tags:      JSON.parse(row.tags ?? '[]'),
    metadata:  JSON.parse(row.metadata ?? '{}'),
    embedding: row.embedding ? JSON.parse(row.embedding) : null,
  }
}

// ─── Projects ───────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Omit<MemoryProject, 'api_key'>[]> {
  return query(
    'SELECT id, name, slug, description, created_at, updated_at FROM memory_projects ORDER BY created_at DESC'
  )
}

export async function getProjectById(id: string): Promise<MemoryProject | null> {
  return queryOne('SELECT * FROM memory_projects WHERE id = ?', [id])
}

export async function getProjectByApiKey(apiKey: string): Promise<MemoryProject | null> {
  return queryOne('SELECT * FROM memory_projects WHERE api_key = ?', [apiKey])
}

export async function createProject(data: {
  name: string
  slug: string
  description?: string
}): Promise<MemoryProject> {
  const id = uuidv4()
  const api_key = generateApiKey()
  const now = new Date()

  await pool.execute(
    `INSERT INTO memory_projects (id, name, slug, api_key, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.slug, api_key, data.description ?? null, now, now]
  )

  return { id, name: data.name, slug: data.slug, api_key, description: data.description ?? null, created_at: now, updated_at: now }
}

export async function updateProject(id: string, data: {
  name?: string
  slug?: string
  description?: string
}): Promise<MemoryProject | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined)        { fields.push('name = ?');        values.push(data.name) }
  if (data.slug !== undefined)        { fields.push('slug = ?');        values.push(data.slug) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }

  if (fields.length === 0) return getProjectById(id)

  values.push(id)
  await pool.execute(`UPDATE memory_projects SET ${fields.join(', ')} WHERE id = ?`, values as any)
  return getProjectById(id)
}

export async function deleteProject(id: string): Promise<boolean> {
  const [result] = await pool.execute('DELETE FROM memory_projects WHERE id = ?', [id]) as any
  return result.affectedRows > 0
}

// ─── Memories ───────────────────────────────────────────────────────────────

export interface ListMemoriesOptions {
  projectId: string
  type?: MemoryType
  tags?: string[]
  key_name?: string
  session_id?: string
  page?: number
  limit?: number
}

export async function listMemories(opts: ListMemoriesOptions): Promise<{ data: Memory[]; total: number }> {
  const { projectId, type, tags, key_name, session_id, page = 1, limit = 50 } = opts
  const offset = (page - 1) * limit

  const conditions: string[] = ['project_id = ?']
  const params: unknown[] = [projectId]

  if (type)       { conditions.push('type = ?');     params.push(type) }
  if (key_name)   { conditions.push('key_name = ?'); params.push(key_name) }
  if (session_id) {
    conditions.push("JSON_EXTRACT(metadata, '$.session_id') = ?")
    params.push(session_id)
  }
  if (tags?.length) {
    tags.forEach(tag => {
      conditions.push('JSON_CONTAINS(tags, ?)')
      params.push(JSON.stringify(tag))
    })
  }

  const where = conditions.join(' AND ')

  const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM memories WHERE ${where}`, params as any) as any
  const total = Number(countRows[0].total)

  const rows = await query<MemoryRow>(
    `SELECT * FROM memories WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  return { data: rows.map(parseMemoryRow), total }
}

export async function getMemoryById(id: string, projectId: string): Promise<Memory | null> {
  const row = await queryOne<MemoryRow>('SELECT * FROM memories WHERE id = ? AND project_id = ?', [id, projectId])
  return row ? parseMemoryRow(row) : null
}

export interface CreateMemoryData {
  projectId: string
  type: MemoryType
  content: string
  key_name?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  forceEmbed?: boolean
}

export async function createMemory(data: CreateMemoryData): Promise<Memory> {
  const id = uuidv4()
  const now = new Date()
  const shouldEmbed = ALWAYS_EMBED_TYPES.has(data.type) || data.forceEmbed

  let embeddingJson: string | null = null
  if (shouldEmbed) {
    const vector = await generateEmbedding(data.content)
    embeddingJson = embeddingToJson(vector)
  }

  await pool.execute(
    `INSERT INTO memories (id, project_id, type, key_name, content, tags, metadata, embedding, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.projectId, data.type, data.key_name ?? null, data.content,
     JSON.stringify(data.tags ?? []), JSON.stringify(data.metadata ?? {}), embeddingJson, now, now]
  )

  return {
    id, project_id: data.projectId, type: data.type, key_name: data.key_name ?? null,
    content: data.content, tags: data.tags ?? [], metadata: data.metadata ?? {},
    embedding: embeddingJson ? JSON.parse(embeddingJson) : null, created_at: now, updated_at: now,
  }
}

export async function updateMemory(
  id: string,
  projectId: string,
  data: { content?: string; key_name?: string; tags?: string[]; metadata?: Record<string, unknown> }
): Promise<Memory | null> {
  const existing = await getMemoryById(id, projectId)
  if (!existing) return null

  const fields: string[] = []
  const values: unknown[] = []

  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
    if (existing.embedding || ALWAYS_EMBED_TYPES.has(existing.type)) {
      const vector = await generateEmbedding(data.content)
      fields.push('embedding = ?')
      values.push(embeddingToJson(vector))
    }
  }
  if (data.key_name !== undefined)  { fields.push('key_name = ?');  values.push(data.key_name) }
  if (data.tags !== undefined)      { fields.push('tags = ?');      values.push(JSON.stringify(data.tags)) }
  if (data.metadata !== undefined)  { fields.push('metadata = ?');  values.push(JSON.stringify(data.metadata)) }

  if (fields.length === 0) return existing

  values.push(id, projectId)
  await pool.execute(`UPDATE memories SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`, values as any)
  return getMemoryById(id, projectId)
}

export async function deleteMemory(id: string, projectId: string): Promise<boolean> {
  const [result] = await pool.execute('DELETE FROM memories WHERE id = ? AND project_id = ?', [id, projectId]) as any
  return result.affectedRows > 0
}

export async function getEmbeddableMemories(
  projectId: string,
  typeFilter?: MemoryType[],
  tags?: string[]
): Promise<Memory[]> {
  const conditions: string[] = ['project_id = ?', 'embedding IS NOT NULL']
  const params: unknown[] = [projectId]

  if (typeFilter?.length) {
    const placeholders = typeFilter.map(() => '?').join(', ')
    conditions.push(`type IN (${placeholders})`)
    params.push(...typeFilter)
  }
  if (tags?.length) {
    tags.forEach(tag => {
      conditions.push('JSON_CONTAINS(tags, ?)')
      params.push(JSON.stringify(tag))
    })
  }

  const rows = await query<MemoryRow>(`SELECT * FROM memories WHERE ${conditions.join(' AND ')}`, params)
  return rows.map(parseMemoryRow)
}
