import axios from 'axios';

const isLocalDevHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const backendApi = axios.create({
  baseURL: isLocalDevHost ? 'http://localhost:4000' : '',
  withCredentials: true, // ✅ session cookie ide sa requestom
});

export default backendApi;