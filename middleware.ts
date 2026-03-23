import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs in Edge Runtime - cannot use jsonwebtoken (Node.js only)
// We do basic token format check here; full JWT verification happens in API routes
function isValidTokenFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    // Check required fields
    return !!(payload.userId && payload.email && payload.role);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/seed') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token || !isValidTokenFormat(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
