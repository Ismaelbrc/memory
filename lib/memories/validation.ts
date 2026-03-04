import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name:        z.string().min(1).max(255),
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().max(1000).optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

export const CreateMemorySchema = z.object({
  type:     z.enum(['text', 'kv', 'message', 'vector']),
  content:  z.string().min(1).max(100000),
  key_name: z.string().max(255).optional(),
  tags:     z.array(z.string().max(100)).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const UpdateMemorySchema = z.object({
  content:  z.string().min(1).max(100000).optional(),
  key_name: z.string().max(255).optional(),
  tags:     z.array(z.string().max(100)).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const SearchSchema = z.object({
  query:       z.string().min(1).max(1000),
  top_k:       z.number().int().min(1).max(50).default(5),
  type_filter: z.array(z.enum(['text', 'kv', 'message', 'vector'])).optional(),
  tags_filter: z.array(z.string()).optional(),
  threshold:   z.number().min(0).max(1).default(0.7),
})
