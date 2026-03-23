import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { generateId, nowISO } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@fretecontrol.com'))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        message: 'Admin user already exists',
        email: 'admin@fretecontrol.com',
      });
    }

    const password_hash = await hashPassword('Admin@2024');
    const now = nowISO();

    await db.insert(users).values({
      id: generateId(),
      name: 'Administrador',
      email: 'admin@fretecontrol.com',
      password_hash,
      role: 'admin',
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@fretecontrol.com',
        password: 'Admin@2024',
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário admin' }, { status: 500 });
  }
}
