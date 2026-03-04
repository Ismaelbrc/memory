import { NextRequest, NextResponse } from 'next/server'
import { getProjectByApiKey } from './service'
import type { MemoryProject } from './types'

export async function requireApiKey(
  req: NextRequest
): Promise<{ project: MemoryProject } | NextResponse> {
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })
  }

  const project = await getProjectByApiKey(apiKey)

  if (!project) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
  }

  return { project }
}
