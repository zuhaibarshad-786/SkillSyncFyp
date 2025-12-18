// client/src/api/axios.js
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
const api = axios.create({
    baseURL: `${VITE_API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Add an interceptor to attach Authorization header (JWT)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;