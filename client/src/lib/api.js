import axios from 'axios';

export const API_URL = 'https://redflagcheck-database-manager.onrender.com';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Required for cross-origin sessions
});

export default api;
