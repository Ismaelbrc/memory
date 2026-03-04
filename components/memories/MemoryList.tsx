'use client'

import { Trash2, Tag, Key } from 'lucide-react'

type MemoryType = 'text' | 'kv' | 'message' | 'vector'

interface Memory {
  id: string
  type: MemoryType
  key_name: string | null
  content: string
  tags: string[]
  metadata: Record<string, any>
  has_embedding: boolean
  created_at: string
}

interface MemoryListProps {
  records: Memory[]
  apiKey: string
  onDeleted: (id: string) => void
}

const TYPE_COLORS: Record<MemoryType, string> = {
  text:    'bg-purple-500/20 text-purple-300 border-purple-500/30',
  kv:      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  message: 'bg-green-500/20 text-green-300 border-green-500/30',
  vector:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

const ROLE_COLORS: Record<string, string> = {
  user:      'text-blue-400',
  assistant: 'text-green-400',
  system:    'text-yellow-400',
}

export function MemoryList({ records, apiKey, onDeleted }: MemoryListProps) {
  async function handleDelete(id: string) {
    if (!confirm('Excluir esta memória?')) return
    await fetch(`/api/memories/records/${id}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
    })
    onDeleted(id)
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma memória encontrada.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map(record => (
        <div key={record.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[record.type]}`}>
                {record.type}
              </span>
              {record.type === 'message' && record.metadata?.role && (
                <span className={`text-xs font-mono ${ROLE_COLORS[record.metadata.role] ?? 'text-gray-400'}`}>
                  {record.metadata.role}
                </span>
              )}
              {record.has_embedding && (
                <span className="text-xs text-blue-400 opacity-60">⚡ embedding</span>
              )}
            </div>
            <button
              onClick={() => handleDelete(record.id)}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {record.key_name && (
            <div className="flex items-center gap-1 text-xs text-orange-400 font-mono">
              <Key size={10} />
              {record.key_name}
            </div>
          )}

          <p className="text-sm text-gray-200 whitespace-pre-wrap line-clamp-4">{record.content}</p>

          {record.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag size={10} className="text-gray-500" />
              {record.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {record.metadata?.session_id && (
            <p className="text-xs text-gray-600 font-mono">session: {record.metadata.session_id}</p>
          )}

          <p className="text-xs text-gray-600">
            {new Date(record.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </div>
  )
}
