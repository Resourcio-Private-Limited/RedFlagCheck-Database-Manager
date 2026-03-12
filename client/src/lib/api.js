import axios from 'axios';

export const API_URL = '';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Required for cross-origin sessions
});

export default api;
