'use client'

import { useState } from 'react'

interface ProjectFormProps {
  onCreated: (project: any) => void
  onCancel: () => void
}

export function ProjectForm({ onCreated, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function autoSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/memories/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description: description || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar projeto')
        return
      }
      onCreated(data.project)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white">Novo Projeto</h3>

      <div className="space-y-1">
        <label className="text-sm text-gray-400">Nome</label>
        <input
          type="text"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (!slug) setSlug(autoSlug(e.target.value))
          }}
          required
          placeholder="Meu Bot de WhatsApp"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-400">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={e => setSlug(autoSlug(e.target.value))}
          required
          placeholder="meu-bot-whatsapp"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-400">Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descrição do projeto..."
          rows={2}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? 'Criando...' : 'Criar Projeto'}
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
