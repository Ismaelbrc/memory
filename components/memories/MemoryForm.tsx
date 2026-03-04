'use client'

import { useState } from 'react'
import { TagInput } from './TagInput'

type MemoryType = 'text' | 'kv' | 'message' | 'vector'

interface MemoryFormProps {
  apiKey: string
  defaultType?: MemoryType
  onCreated: (record: any) => void
  onCancel: () => void
}

const TYPE_LABELS: Record<MemoryType, string> = {
  text: 'Texto',
  kv: 'Chave-Valor',
  message: 'Mensagem',
  vector: 'Vetor',
}

const TYPE_DESCRIPTIONS: Record<MemoryType, string> = {
  text: 'Notas, contexto e instruções com busca semântica automática',
  kv: 'Preferências e configurações no formato chave → valor',
  message: 'Mensagens de conversas com papel (user/assistant/system)',
  vector: 'Documento para recuperação por similaridade semântica',
}

export function MemoryForm({ apiKey, defaultType = 'text', onCreated, onCancel }: MemoryFormProps) {
  const [type, setType] = useState<MemoryType>(defaultType)
  const [content, setContent] = useState('')
  const [keyName, setKeyName] = useState('')
  const [role, setRole] = useState<'user' | 'assistant' | 'system'>('user')
  const [sessionId, setSessionId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body: any = { type, content, tags }
      if (type === 'kv') body.key_name = keyName
      if (type === 'message') body.metadata = { role, ...(sessionId ? { session_id: sessionId } : {}) }

      const res = await fetch('/api/memories/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar memória')
        return
      }
      onCreated(data.record)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white">Nova Memória</h3>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(TYPE_LABELS) as MemoryType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">{TYPE_DESCRIPTIONS[type]}</p>

      {/* Key name for kv */}
      {type === 'kv' && (
        <div className="space-y-1">
          <label className="text-sm text-gray-400">Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            required
            placeholder="user.language"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Role and session for message */}
      {type === 'message' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Papel</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
            >
              <option value="user">user</option>
              <option value="assistant">assistant</option>
              <option value="system">system</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Session ID (opcional)</label>
            <input
              type="text"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              placeholder="sess_abc123"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">
          {type === 'kv' ? 'Valor' : 'Conteúdo'}
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          rows={4}
          placeholder={type === 'kv' ? 'pt-BR' : 'Digite o conteúdo da memória...'}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">Tags</label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar Memória'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-2 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
