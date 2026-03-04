'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Brain, Search } from 'lucide-react'
import { ApiKeyDisplay } from '@/components/memories/ApiKeyDisplay'
import { MemoryList } from '@/components/memories/MemoryList'
import { MemoryForm } from '@/components/memories/MemoryForm'
import { SearchPanel } from '@/components/memories/SearchPanel'

type Tab = 'all' | 'text' | 'kv' | 'message' | 'vector' | 'search'

interface Project {
  id: string
  name: string
  slug: string
  api_key: string
  description: string | null
}

interface Memory {
  id: string
  type: any
  key_name: string | null
  content: string
  tags: string[]
  metadata: Record<string, any>
  has_embedding: boolean
  created_at: string
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',     label: 'Todas' },
  { key: 'text',    label: 'Texto' },
  { key: 'kv',      label: 'Chave-Valor' },
  { key: 'message', label: 'Mensagens' },
  { key: 'vector',  label: 'Vetores' },
  { key: 'search',  label: 'Busca Semântica' },
]

export default function ProjectMemoriesPage() {
  const { projectId } = useParams() as { projectId: string }
  const [project, setProject] = useState<Project | null>(null)
  const [records, setRecords] = useState<Memory[]>([])
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState<Tab>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/memories/projects/${projectId}`)
      .then(r => r.json())
      .then(d => setProject(d.project ?? null))
  }, [projectId])

  useEffect(() => {
    if (!project) return
    setLoading(true)

    const params = new URLSearchParams({ limit: '100' })
    if (tab !== 'all' && tab !== 'search') params.set('type', tab)

    fetch(`/api/memories/records?${params}`, {
      headers: { 'X-API-Key': project.api_key },
    })
      .then(r => r.json())
      .then(d => {
        setRecords(d.data ?? [])
        setTotal(d.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [project, tab])

  function handleCreated(record: Memory) {
    setRecords(prev => [record, ...prev])
    setTotal(t => t + 1)
    setShowForm(false)
  }

  function handleDeleted(id: string) {
    setRecords(prev => prev.filter(r => r.id !== id))
    setTotal(t => t - 1)
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Link href="/painel-zap/memories" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors w-fit">
            <ArrowLeft size={14} />
            Todos os projetos
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-blue-400" />
                <h1 className="text-xl font-bold">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-sm text-gray-400 mt-1">{project.description}</p>
              )}
              <p className="text-xs text-gray-600 font-mono mt-1">{project.slug}</p>
            </div>
            {tab !== 'search' && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0"
              >
                <Plus size={14} />
                Nova Memória
              </button>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500">API Key</p>
            <ApiKeyDisplay apiKey={project.api_key} />
          </div>
        </div>

        {/* New memory form */}
        {showForm && (
          <MemoryForm
            apiKey={project.api_key}
            defaultType={tab !== 'all' && tab !== 'search' ? tab as any : 'text'}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {t.key === 'search' && <Search size={12} />}
              {t.label}
              {t.key !== 'search' && tab === t.key && (
                <span className="text-xs opacity-70">({total})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'search' ? (
          <SearchPanel apiKey={project.api_key} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <MemoryList
            records={records}
            apiKey={project.api_key}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </div>
  )
}
