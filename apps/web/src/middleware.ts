import { NextResponse, type NextRequest } from 'next/server';

/**
 * Soft auth gate. JWT lives in localStorage (Phase 1), so we can't see it from
 * middleware — but we DO put a small marker cookie on signin to allow this
 * middleware to make a fast redirect. Pages also re-check client-side.
 *
 * When we move to httpOnly cookies (Phase 2), this middleware becomes the
 * authoritative gate.
 */
const PROTECTED = ['/dashboard', '/profile', '/onboarding', '/post-class', '/live'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();
  // marker cookie set by /lib/auth (future). For now, allow through and let
  // page-level useEffect do the redirect.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
