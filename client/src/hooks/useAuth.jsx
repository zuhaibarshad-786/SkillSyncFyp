// client/src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Custom hook to consume the authentication context.
 * Returns the authentication state (user, token, isAuthenticated) 
 * and actions (login, logout, setUser).
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default useAuth;

// NOTE: Ensure you update AuthContext.js to remove the direct export of useAuth 
// if you want to enforce using this file structure.