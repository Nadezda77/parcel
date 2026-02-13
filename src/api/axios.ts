// src/api/axios.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, isTokenExpired, setUserSession, removeUserSession } from '../utils/Common';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // session cookie
});

async function refreshTPWToken(): Promise<string> {
  const resp = await api.post('/api/login/refresh'); // backend reads req.session.tpServiceAccount
  const token = resp.data;

  if (!token?.access_token) throw new Error('Invalid refresh response');

  setUserSession(token.access_token, token.expires_in, token.token_type);
  return token.access_token;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const url = config.url || '';

  // allow login + refresh calls without attaching Bearer (avoid loops)
  if (url.startsWith('/api/login')) return config;

  let token = getAccessToken();
  if (!token || isTokenExpired()) {
    token = await refreshTPWToken();
  }

  if (!config.headers) config.headers = new AxiosHeaders();
  config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('Accept', 'application/json');

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      removeUserSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
