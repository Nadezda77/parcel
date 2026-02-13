import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // ✅ session cookie ide sa requestom
});

export default backendApi;