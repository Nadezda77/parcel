import api from '../api/axios';
import axios, {AxiosHeaders} from 'axios';

const TOKEN_KEY = 'tp_access_token';
const EXPIRES_AT_KEY = 'tp_expires_at';
const TOKEN_TYPE_KEY = 'tp_token_type';
const SERVICE_ACCOUNT_KEY = 'tp_service_account';


export interface TPServiceAccount {
  username: string;
  password: string;
}

/** Save service account in sessionStorage */
export function setServiceAccount(account: TPServiceAccount) {
  sessionStorage.setItem(SERVICE_ACCOUNT_KEY, JSON.stringify(account));
}

/** Get service account from sessionStorage */
export function getServiceAccount(): TPServiceAccount | null {
  const sa = sessionStorage.getItem(SERVICE_ACCOUNT_KEY);
  return sa ? JSON.parse(sa) : null;
}

export function setUserSession(accessToken: string, expiresIn: number, tokenType: string) {
  const expiresAt = Date.now() + expiresIn * 1000;
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
  sessionStorage.setItem(TOKEN_TYPE_KEY, tokenType);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/** Read token type */
export function getTokenType(): string {
  return sessionStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
}

export function isTokenExpired(): boolean {
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  return !expiresAt || Date.now() > Number(expiresAt) - 60_000;
}

export function removeUserSession() {
  sessionStorage.clear();
}

export async function refreshTPWToken(): Promise<string> {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) throw new Error('No TP service account in session');

  const authHeader =
    'Basic ' +
    Buffer.from(`${serviceAccount.username}:${serviceAccount.password}`).toString('base64');

  const headers = AxiosHeaders.from({
    Authorization: authHeader,
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const response = await axios.post(
    process.env.TP_TOKEN_URL!,
    new URLSearchParams({ grant_type: 'client_credentials' }),
    { headers }
  );

  const { access_token, expires_in, token_type } = response.data;
  setUserSession(access_token, expires_in, token_type);
  return access_token;
}
