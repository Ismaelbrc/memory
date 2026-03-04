'use client'

import Link from 'next/link'
import { Trash2, Database } from 'lucide-react'
import { ApiKeyDisplay } from './ApiKeyDisplay'

interface Project {
  id: string
  name: string
  slug: string
  api_key: string
  description: string | null
  created_at: string
}

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  async function handleDelete() {
    if (!confirm(`Excluir projeto "${project.name}" e todas as suas memórias?`)) return
    await fetch(`/api/memories/projects/${project.id}`, { method: 'DELETE' })
    onDelete(project.id)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/painel-zap/memories/${project.id}`}
            className="text-white font-semibold hover:text-blue-400 transition-colors"
          >
            {project.name}
          </Link>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{project.slug}</p>
          {project.description && (
            <p className="text-sm text-gray-400 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/painel-zap/memories/${project.id}`}
            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
            title="Ver memórias"
          >
            <Database size={16} />
          </Link>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            title="Excluir projeto"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-500">API Key</p>
        <ApiKeyDisplay apiKey={project.api_key} />
      </div>

      <p className="text-xs text-gray-600">
        Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
