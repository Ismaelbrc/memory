const PROVIDER = process.env.EMBEDDING_PROVIDER ?? 'ollama'
const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '')
const OLLAMA_MODEL = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text'

// Types that auto-embed on creation
export const ALWAYS_EMBED_TYPES = new Set<string>(['text', 'vector'])

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const truncated = text.slice(0, 32000)

  if (PROVIDER === 'ollama') {
    return generateOllamaEmbedding(truncated)
  }

  // PROVIDER === 'none' or unknown — skip embedding
  return null
}

async function generateOllamaEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      console.warn(`Ollama embeddings failed: ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json()
    return data.embedding as number[]
  } catch (err) {
    console.warn('Ollama embeddings unavailable, skipping:', (err as Error).message)
    return null
  }
}

export function embeddingToJson(embedding: number[]): string {
  return JSON.stringify(embedding)
}

export function jsonToEmbedding(json: string): number[] {
  return JSON.parse(json) as number[]
}
