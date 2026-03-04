'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'

export function ApiKeyDisplay({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayed = visible ? apiKey : apiKey.slice(0, 8) + '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'

  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      <code className="flex-1 text-xs text-green-400 font-mono truncate">{displayed}</code>
      <button
        onClick={() => setVisible(v => !v)}
        className="text-gray-400 hover:text-gray-200 transition-colors"
        title={visible ? 'Ocultar' : 'Mostrar'}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        onClick={handleCopy}
        className="text-gray-400 hover:text-gray-200 transition-colors"
        title="Copiar"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  )
}
