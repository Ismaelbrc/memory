import type { Memory, SearchResult } from './types'

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export interface SearchOptions {
  topK?: number
  threshold?: number
}

export function rankByEmbedding(
  queryEmbedding: number[],
  candidates: Memory[],
  options: SearchOptions = {}
): SearchResult[] {
  const { topK = 5, threshold = 0.7 } = options

  return candidates
    .filter(m => m.embedding !== null)
    .map(m => ({
      ...m,
      similarity: cosineSimilarity(queryEmbedding, m.embedding!),
    }))
    .filter(m => m.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(({ embedding: _e, ...rest }) => rest)
}
