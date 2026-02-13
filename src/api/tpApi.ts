import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import backendApi from './backend';
import { getAccessToken, isTokenExpired, removeUserSession, setUserSession } from '../utils/Common';

const tpApi = axios.create({
  baseURL: 'https://iot.mts.rs/thingpark/wireless/rest',
  withCredentials: false,
});

let refreshPromise: Promise<string> | null = null;

async function refreshTPWToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = backendApi
      .post('/api/login/refresh')
      .then((resp) => {
        const token = resp.data;
        if (!token?.access_token) throw new Error('Invalid refresh response');

        setUserSession(token.access_token, token.expires_in, token.token_type);
        return token.access_token as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

tpApi.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = getAccessToken();

  // ✅ nema tokena ili ističe -> refresh
  if (!token || isTokenExpired()) {
    token = await refreshTPWToken();
  }

  if (!config.headers) config.headers = new AxiosHeaders();
  config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('Accept', 'application/json');

  return config;
});

tpApi.interceptors.response.use(
  (r) => r,
  async (error) => {
    // ✅ ako TP vrati 401, pokušaj refresh 1x i ponovi request
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const token = await refreshTPWToken();
        if (!original.headers) original.headers = new AxiosHeaders();
        (original.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
        return tpApi(original);
      } catch {
        removeUserSession();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default tpApi;
