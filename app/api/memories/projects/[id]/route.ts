import { NextRequest, NextResponse } from 'next/server'
import { getProjectById, updateProject, deleteProject } from '@/lib/memories/service'
import { UpdateProjectSchema } from '@/lib/memories/validation'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await getProjectById(id)
    if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    return NextResponse.json({ project })
  } catch (error) {
    console.error('GET /api/memories/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const project = await updateProject(id, parsed.data)
    if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    return NextResponse.json({ project })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 })
    }
    console.error('PUT /api/memories/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = await deleteProject(id)
    if (!deleted) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/memories/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
