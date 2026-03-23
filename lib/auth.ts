import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fretecontrol-secret-2024';
const JWT_EXPIRES = '8h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload & jwt.JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get('auth-token')?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function getCurrentUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
