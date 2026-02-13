// src/utils/Common.ts

const TOKEN_KEY = 'tp_access_token';
const EXPIRES_AT_KEY = 'tp_expires_at';
const TOKEN_TYPE_KEY = 'tp_token_type';

export function setUserSession(accessToken: string, expiresIn: number, tokenType: string = 'Bearer') {
  const expiresAt = Date.now() + expiresIn * 1000;

  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
  sessionStorage.setItem(TOKEN_TYPE_KEY, tokenType);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getTokenType(): string {
  return sessionStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
}

export function isTokenExpired(): boolean {
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAt) return true;
  // 1 min buffer
  return Date.now() > Number(expiresAt) - 60_000;
}

export function removeUserSession() {
  sessionStorage.clear();
}
