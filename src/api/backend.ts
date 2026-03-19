import axios from 'axios';

const isLocalDevHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const backendApi = axios.create({
  // Local dev: backend radi na :4000. Produkcija: isti origin + Nginx /api proxy.
  baseURL: isLocalDevHost ? 'http://localhost:4000' : '',
  withCredentials: true,
});

export default backendApi;
