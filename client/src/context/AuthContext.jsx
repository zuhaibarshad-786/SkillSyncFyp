// client/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios'; // Import the configured Axios instance

// 1. Create the Context
export const AuthContext = createContext();

// 2. Create a custom hook for easy access
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Create the Provider Component
export const AuthProvider = ({ children }) => {
    // Check local storage for initial token/user data
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoading, setIsLoading] = useState(true);

    // Set up Axios interceptor to manage the token (optional, but good practice)
    useEffect(() => {
        if (token) {
            // Set the token globally for subsequent requests
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
        setIsLoading(false);
    }, [token]);

    // --- Core Authentication Functions ---

    // Function to handle user login
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            const userData = response.data;
            const jwtToken = userData.token; // Assuming backend returns {..., token: 'jwt'}

            // Store in state and local storage
            setToken(jwtToken);
            setUser(userData);
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('user', JSON.stringify(userData));

            return userData;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    // Function to handle user logout
    const logout = () => {
        // Clear state and local storage
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Call backend logout endpoint (optional, primarily for clearing cookies)
        // api.post('/auth/logout'); 
    };

    // Check if the user is authenticated
    const isAuthenticated = !!token && !!user;

    const value = {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setUser // For updating user profile information
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};