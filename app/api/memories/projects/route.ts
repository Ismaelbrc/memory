import { NextRequest, NextResponse } from 'next/server'
import { listProjects, createProject } from '@/lib/memories/service'
import { CreateProjectSchema } from '@/lib/memories/validation'

export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('GET /api/memories/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const project = await createProject(parsed.data)
    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 })
    }
    console.error('POST /api/memories/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
