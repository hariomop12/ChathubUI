import type { GoogleProfile } from "@/lib/types";

const TOKEN_KEY = "chathub:google_token";

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function setGoogleToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getGoogleToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGoogleProfile(): GoogleProfile | null {
  const token = getGoogleToken();
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload) return null;

  const exp = Number(payload.exp ?? 0);
  if (exp && Date.now() / 1000 > exp) {
    clearGoogleToken();
    return null;
  }

  const sub = String(payload.sub ?? "");
  if (!sub) return null;

  return {
    id: `google_${sub}`,
    username: String(payload.name ?? "ChatHub User"),
    email: String(payload.email ?? ""),
    avatar: String(payload.picture ?? ""),
    idToken: token,
  };
}
