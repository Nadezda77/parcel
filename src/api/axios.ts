import axios, {
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  isTokenExpired,
  removeUserSession,
  setUserSession,
} from '../utils/Common';

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // REQUIRED for session cookies
});

/**
 * Refresh TPW token via backend
 */
async function refreshTPWToken(): Promise<string> {
  try {
    const resp = await api.post('/api/login/refresh');

    const token = resp.data;

    if (!token?.access_token) {
      throw new Error('Invalid refresh response');
    }

    setUserSession(
      token.access_token,
      token.expires_in,
      token.token_type
    );

    return token.access_token;
  } catch (err) {
    console.error('Token refresh failed', err);
    removeUserSession();
    window.location.href = '/login';
    throw err;
  }
}

/**
 * Request interceptor
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getAccessToken();

    if (!token || isTokenExpired()) {
      token = await refreshTPWToken();
    }

    if (!config.headers) config.headers = new AxiosHeaders();

    config.headers.set('Authorization', `Bearer ${token}`);

    return config;
  },
 
);

/**
 * Axios response interceptor
 */
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401) {
      removeUserSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;