/**
 * Memory Client - SDK para consumir o Memory Repository em outros projetos.
 *
 * Uso:
 *   import { MemoryClient } from '@/lib/memory-client'
 *   const memory = new MemoryClient(process.env.MEMORY_API_KEY!)
 *
 *   await memory.add('Usuário é VIP', ['user-123', 'vip'])
 *   const results = await memory.search('quem é VIP?')
 *   await memory.kvSet('user.language', 'pt-BR')
 */

type MemoryType = 'text' | 'kv' | 'message' | 'vector'

interface CreateMemoryOpts {
  type: MemoryType
  content: string
  key_name?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

interface SearchOpts {
  query: string
  top_k?: number
  type_filter?: MemoryType[]
  tags_filter?: string[]
  threshold?: number
}

interface ListOpts {
  type?: MemoryType
  tags?: string[]
  key_name?: string
  session_id?: string
  page?: number
  limit?: number
}

export class MemoryClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(apiKey: string, baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '') {
    this.baseUrl = `${baseUrl}/api/memories`
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers, ...init.headers },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`Memory API ${res.status}: ${JSON.stringify(data)}`)
    return data
  }

  /** Criar uma memória */
  async create(opts: CreateMemoryOpts) {
    return this.request<{ record: any }>('/records', {
      method: 'POST',
      body: JSON.stringify(opts),
    })
  }

  /** Texto livre com embedding automático */
  async add(content: string, tags: string[] = [], metadata?: Record<string, unknown>) {
    return this.create({ type: 'text', content, tags, metadata })
  }

  /** Documento para busca semântica */
  async addVector(content: string, tags: string[] = [], metadata?: Record<string, unknown>) {
    return this.create({ type: 'vector', content, tags, metadata })
  }

  /** Mensagem de conversa */
  async addMessage(content: string, role: 'user' | 'assistant' | 'system', session_id?: string) {
    return this.create({
      type: 'message',
      content,
      metadata: { role, ...(session_id ? { session_id } : {}) },
    })
  }

  /** Listar memórias */
  async list(opts: ListOpts = {}) {
    const qs = new URLSearchParams()
    if (opts.type)        qs.set('type', opts.type)
    if (opts.key_name)    qs.set('key_name', opts.key_name)
    if (opts.session_id)  qs.set('session_id', opts.session_id)
    if (opts.page)        qs.set('page', String(opts.page))
    if (opts.limit)       qs.set('limit', String(opts.limit))
    if (opts.tags?.length) qs.set('tags', opts.tags.join(','))
    return this.request<{ data: any[]; total: number }>(`/records?${qs}`)
  }

  /** Buscar uma memória por ID */
  async get(id: string) {
    return this.request<{ record: any }>(`/records/${id}`)
  }

  /** Deletar uma memória */
  async delete(id: string) {
    return this.request<{ deleted: boolean }>(`/records/${id}`, { method: 'DELETE' })
  }

  /** Busca semântica por significado */
  async search(query: string, opts: Omit<SearchOpts, 'query'> = {}) {
    return this.request<{ results: any[]; total_candidates: number; returned: number }>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: opts.top_k ?? 5, threshold: opts.threshold ?? 0.7, ...opts }),
    })
  }

  /** Ler um valor por chave */
  async kvGet(key: string): Promise<any | null> {
    const data = await this.list({ type: 'kv', key_name: key, limit: 1 })
    return data.data[0] ?? null
  }

  /** Gravar ou atualizar um valor por chave (upsert) */
  async kvSet(key: string, value: string, tags?: string[]) {
    const existing = await this.kvGet(key)
    if (existing) await this.delete(existing.id)
    return this.create({ type: 'kv', key_name: key, content: value, tags })
  }

  /** Buscar histórico de uma sessão */
  async getMessages(session_id: string, limit = 50) {
    return this.list({ type: 'message', session_id, limit })
  }
}
