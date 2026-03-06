import axios from 'axios';

const backendApi = axios.create({
  baseURL: '',
  withCredentials: true, // ✅ session cookie ide sa requestom
});

export default backendApi;