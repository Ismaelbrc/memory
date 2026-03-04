'use client'

import { useEffect, useState } from 'react'
import { Plus, Brain } from 'lucide-react'
import { ProjectCard } from '@/components/memories/ProjectCard'
import { ProjectForm } from '@/components/memories/ProjectForm'

interface Project {
  id: string
  name: string
  slug: string
  api_key: string
  description: string | null
  created_at: string
}

export default function MemoriesPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/memories/projects')
      .then(r => r.json())
      .then(d => setProjects(d.projects ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(project: Project) {
    setProjects(prev => [project, ...prev])
    setShowForm(false)
  }

  function handleDeleted(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={28} className="text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Memory Repository</h1>
              <p className="text-sm text-gray-400">Repositório central de memórias para seus projetos</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Novo Projeto
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <ProjectForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Projects list */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-800 rounded-xl p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Brain size={48} className="text-gray-700 mx-auto" />
            <p className="text-gray-400">Nenhum projeto criado ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleted}
              />
            ))}
          </div>
        )}

        {/* API docs hint */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-300">Como usar a API</p>
          <pre className="text-xs text-green-400 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto">{`# Criar memória em outro projeto
curl -X POST /api/memories/records \\
  -H "X-API-Key: sua-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"text","content":"Usuário é VIP","tags":["vip"]}'

# Busca semântica
curl -X POST /api/memories/search \\
  -H "X-API-Key: sua-api-key" \\
  -d '{"query":"quem é VIP?","top_k":5}'`}</pre>
        </div>
      </div>
    </div>
  )
}
