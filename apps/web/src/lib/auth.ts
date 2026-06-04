/** Token storage helpers. Plain localStorage in Phase 1 — moves to
 *  httpOnly cookies once we add SSR-protected pages. */

const TOKEN_KEY = 'ananta_token';
const USER_ID_KEY = 'ananta_user_id';

export function saveSession(token: string, userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, userId);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isSignedIn(): boolean {
  return !!getToken();
}
