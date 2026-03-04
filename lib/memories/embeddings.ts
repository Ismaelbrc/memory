import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const EMBEDDING_MODEL = 'text-embedding-3-small'

export async function generateEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 32000)
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
  })
  return response.data[0].embedding
}

export function embeddingToJson(embedding: number[]): string {
  return JSON.stringify(embedding)
}

export function jsonToEmbedding(json: string): number[] {
  return JSON.parse(json) as number[]
}

// Types that auto-embed on creation
export const ALWAYS_EMBED_TYPES = new Set<string>(['text', 'vector'])
