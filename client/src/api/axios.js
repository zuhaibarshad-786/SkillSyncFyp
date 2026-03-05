// client/src/api/axios.js
// Base URL is driven entirely by the VITE_API_URL environment variable.
//   • Local dev  → .env sets VITE_API_URL=http://localhost:5000
//   • Vercel     → dashboard env var VITE_API_URL=https://skillsyncfyp.onrender.com
// No hardcoded production URLs live in source code.

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;