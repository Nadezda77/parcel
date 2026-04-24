// src/api/axios.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, isTokenExpired, setUserSession, removeUserSession } from '../utils/Common';

const isLocalDevHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);


const api = axios.create({

  baseURL:  'http://localhost:4000' ,
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


const fullUrl = `${config.baseURL || ''}${url}`;
  console.log('[REQ]', config.method?.toUpperCase(), fullUrl);



  // allow login + refresh calls without attaching Bearer (avoid loops)
  if (url.startsWith('/api/login')) return config;

  let token = getAccessToken();
  if (!token || isTokenExpired()) {


 try {
    token = await refreshTPWToken();
  } catch (e) {
    console.warn('[REFRESH FAILED] forcing re-login');
    removeUserSession();
    // po želji: ovde redirect, ali sada bar znaš da je refresh fail
    window.location.href = '/login';
    throw e;
  }


    //token = await refreshTPWToken();
  }

  if (!config.headers) config.headers = new AxiosHeaders();
  config.headers.set('Authorization', `Bearer ${token}`);
  config.headers.set('Accept', 'application/json');

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {


const status = error.response?.status;
    const url = error.config?.url || '';

    
 // ✅ NE redirectuj za login rute (login, mfa, refresh),
    // da UI prikaže poruku (npr. Invalid OTP)
    if (status === 401 && !url.startsWith('/api/login')) {
      removeUserSession();
      window.location.href = '/login';
    }


    return Promise.reject(error);
  }
);


//     if (error.response?.status === 401) {
//       removeUserSession();
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default api;