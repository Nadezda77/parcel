// utils/Common.ts
import axios from 'axios';

export const getUser = () => {
  const userStr = sessionStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

export const getServiceAccount = () => sessionStorage.getItem('service_account') || null;
export const getToken = () => sessionStorage.getItem('access_token') || null;

export const setUserSession = (
  serviceAccount: string,
  access_token?: string,
  expires_in?: number,
  refresh_expires_in?: number,
  token_type?: string,
  scope?: string
) => {
  sessionStorage.setItem('service_account', serviceAccount);

  if (access_token) sessionStorage.setItem('access_token', access_token);
  if (expires_in) sessionStorage.setItem('expires_in', expires_in.toString());
  if (refresh_expires_in) sessionStorage.setItem('refresh_expires_in', refresh_expires_in.toString());
  if (token_type) sessionStorage.setItem('token_type', token_type);
  if (scope) sessionStorage.setItem('scope', scope);

  sessionStorage.setItem('stored_at', Date.now().toString());
};

export const removeUserSession = () => sessionStorage.clear();

// Check token expiry
export const isTokenExpired = () => {
  const expiresIn = sessionStorage.getItem('expires_in');
  const storedAt = sessionStorage.getItem('stored_at');
  if (!expiresIn || !storedAt) return true;

  const expiryTime = parseInt(storedAt) + parseInt(expiresIn) * 1000;
  return Date.now() + 60000 > expiryTime; // 1 min buffer
};

// Request TPW token from backend proxy
export const fetchTPWToken = async (): Promise<string> => {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) throw new Error('No service account stored');

  try {
    const resp = await axios.post('/api/token', { serviceAccount });
    const { access_token, expires_in, refresh_expires_in, token_type, scope } = resp.data;

    setUserSession(serviceAccount, access_token, expires_in, refresh_expires_in, token_type, scope);

    return access_token;
  } catch (err) {
    console.error('Failed to fetch TPW token', err);
    throw err;
  }
};
