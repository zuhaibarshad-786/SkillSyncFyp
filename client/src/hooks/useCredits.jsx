// client/src/hooks/useCredits.jsx (NEW)
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios'; 
import useAuth from './useAuth';

const CreditsContext = createContext();

export const useCredits = () => {
    return useContext(CreditsContext);
};

export const CreditsProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBalance = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const response = await api.get('/credits/balance');
            setBalance(response.data.creditBalance);
            setIsPremium(response.data.isPremium);
        } catch (err) {
            console.error("Failed to fetch credits:", err);
            setBalance(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [isAuthenticated, user]);

    const value = {
        balance,
        isPremium,
        isLoading,
        fetchBalance, // Function to manually refresh balance after purchase
        // TODO: Add function to consume credits (e.g., spendCredits(amount))
    };

    return (
        <CreditsContext.Provider value={value}>
            {children}
        </CreditsContext.Provider>
    );
};
export default useCredits;