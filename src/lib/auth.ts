const TOKEN_KEY = "kachkivun_token";
const LEGACY_TOKEN_KEY = "mishlahat_token";
const ROLE_KEY = "kachkivun_role";

export type AuthRole = "user" | "admin";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getStoredRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ROLE_KEY);
  return role === "admin" || role === "user" ? role : null;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function setStoredRole(role: AuthRole | undefined) {
  if (typeof window === "undefined") return;
  if (role) localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
}

/** Save JWT and optional role after OTP verify. */
export function setAuthSession(token: string, role?: AuthRole) {
  setToken(token);
  setStoredRole(role);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem("kk-query-cache-v1");
}

export function isStoredAdmin(): boolean {
  return getStoredRole() === "admin";
}
