export type MemoryType = 'text' | 'kv' | 'message' | 'vector'

export interface MemoryProject {
  id: string
  name: string
  slug: string
  api_key: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface Memory {
  id: string
  project_id: string
  type: MemoryType
  key_name: string | null
  content: string
  tags: string[]
  metadata: Record<string, unknown>
  embedding: number[] | null
  created_at: Date
  updated_at: Date
}

export interface MemoryRow extends Omit<Memory, 'tags' | 'metadata' | 'embedding'> {
  tags: string
  metadata: string
  embedding: string | null
}

export interface SearchResult extends Omit<Memory, 'embedding'> {
  similarity: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
