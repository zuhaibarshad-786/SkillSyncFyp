// client/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css'; // Import your global styles (Tailwind base styles)
import { AuthProvider } from './context/AuthContext.jsx'; 
import { SocketProvider } from './context/SocketContext.jsx'; 
import { CreditsProvider } from './hooks/useCredits.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* AuthProvider must be the highest context as SocketProvider depends on it */}
        <AuthProvider>
            {/* 📢 NEW PROVIDER: Wrap the App here */}
            <CreditsProvider> 
                <SocketProvider>
                    <App />
                </SocketProvider>
            </CreditsProvider>
        </AuthProvider>
    </React.StrictMode>
);