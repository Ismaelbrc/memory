'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface SearchResult {
  id: string
  type: string
  content: string
  tags: string[]
  metadata: Record<string, any>
  similarity: number
  created_at: string
}

export function SearchPanel({ apiKey }: { apiKey: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [totalCandidates, setTotalCandidates] = useState(0)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(false)

    try {
      const res = await fetch('/api/memories/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ query, top_k: 5, threshold: 0.6 }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.results)
        setTotalCandidates(data.total_candidates)
        setSearched(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por significado... ex: qual o idioma do usuário?"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors"
        >
          <Search size={14} />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {searched && (
        <p className="text-xs text-gray-500">
          {results.length} resultado(s) de {totalCandidates} candidatos
        </p>
      )}

      <div className="space-y-3">
        {results.map(result => (
          <div key={result.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">{result.type}</span>
              <span className="text-xs font-medium text-blue-400">
                {(result.similarity * 100).toFixed(1)}% similaridade
              </span>
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{result.content}</p>
            {result.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {result.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {searched && results.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">
            Nenhuma memória semelhante encontrada. Tente alterar a busca ou o threshold.
          </p>
        )}
      </div>
    </div>
  )
}
