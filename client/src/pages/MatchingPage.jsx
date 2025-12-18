// client/src/pages/MatchingPage.jsx (MODIFIED)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaExclamationCircle, FaYoutube, FaLink, FaWallet, FaPlusCircle } from 'react-icons/fa'; 
import SkillCard from '../components/common/SkillCard';
import Button from '../components/common/Button';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import NewUserWelcomeModal from './Credits/NewUserWelcomeModal';

// 🚨 MOCK HOOK: Assuming this provides essential user metrics
const useCredits = () => ({
    skillCredits: 5, // Mock: User has 5 credits
    teachingLearningRatio: 0.5, // Mock: User's ratio is 0.5
    isNewUser: true, // 🆕 Mock: Flag to determine if the welcome modal should show
});

const MatchingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { skillCredits, isNewUser } = useCredits(); // 🆕 Get Credit Status & New User Flag
    
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fallbackData, setFallbackData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(isNewUser); // 🆕 Control Modal state

    // --- Data Fetching Logic (Remains largely the same) ---
    const fetchMatches = async () => {
        setIsLoading(true);
        setError(null);
        setMatches([]);
        setFallbackData(null); 

        try {
            const response = await api.get('/matches/suggestions');
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                // 🚨 Enhancement: The match object from the backend must include a flag
                // indicating if the match is a complementary (two-way) barter.
                // Mocking this flag here:
                const enhancedMatches = response.data.map((m, index) => ({
                    ...m,
                    isTwoWayBarter: index % 2 === 0 // Mock: Every other match is a free barter
                }));
                setMatches(enhancedMatches);
            } else {
                 const desiredSkill = response.data?.desiredSkill || 'Advanced Spanish'; 
                 setFallbackData({
                     desiredSkill: desiredSkill,
                     relatedSkills: ['Beginner Spanish', 'Basic Grammar'],
                     externalResources: [
                         { name: 'Coursera Spanish Mini-Course', url: '#', type: 'Coursera' },
                         { name: 'Top 10 Spanish Tutorials', url: '#', type: 'YouTube' },
                     ]
                 });
                 setError(`No complementary matches found for ${desiredSkill} at this moment.`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch match suggestions. Check network or token validity.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchMatches();
        }
    }, [user?._id]);

    // --- Handle Match Connection (Barter vs. Credit Check) ---
    const handleConnect = async (match) => {
        // 🚨 1. DETERMINE EXCHANGE TYPE:
        const requiresCredit = !match.isTwoWayBarter;
        const MIN_REQUIRED_CREDITS = 1;

        if (requiresCredit && skillCredits < MIN_REQUIRED_CREDITS) {
            // One-sided learner attempts connection without credits
            alert("You must have at least 1 Skill Credit to start a one-sided learning session. Please acquire credits.");
            navigate('/credits/wallet'); 
            return;
        }

        try {
            // 2. PROCEED WITH CONNECTION
            await api.post(`/chat/connect/${match.user._id}`);
            
            // 3. INFORM USER OF EXCHANGE TYPE
            let message;
            if (requiresCredit) {
                message = `Connection request sent. 1 Skill Credit will be consumed upon session confirmation.`;
            } else {
                message = `Connection request sent. This is a FREE Two-Way Barter exchange!`;
            }

            setMatches(prev => prev.filter(m => m.user._id !== match.user._id));
            alert(message);
            navigate(`/chat`); 

        } catch (error) {
            alert('Failed to send connection request. Check network or server.');
            console.error("Connection error:", error);
        }
    };
    
    // --- UI INTERFACE ---
    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            {/* 🆕 1. New User Welcome Modal */}
            <NewUserWelcomeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onNavigateToCredits={() => {
                    setIsModalOpen(false);
                    navigate('/credits/wallet');
                }}
            />

            {/* Existing Header */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Your Complementary Matches 🤝
            </h1>
            
            {/* 🆕 2. Credit Status Banner */}
            <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center mb-6 border-l-4 border-indigo-500">
                <div className="flex items-center space-x-4">
                    <FaWallet className="text-indigo-600 text-2xl"/>
                    <p className="font-medium text-gray-700">
                        Current Credits: <span className="font-bold text-indigo-900">{skillCredits}</span>
                    </p>
                </div>
                <Button onClick={() => navigate('/credits/wallet')} variant="primary" className="text-sm py-2 px-4">
                    <FaPlusCircle className="mr-2"/> Acquire Credits
                </Button>
            </div>
            
            <p className="text-gray-600 mb-6">
                Showing potential partners who have the skills you need and need the skills you offer.
            </p>

            {/* ... (Refresh button, Loading, Error, and Fallback Content remains the same) ... */}

            {/* Match Cards Display */}
            <div className="flex flex-wrap justify-start gap-6">
                {matches.map((match, index) => (
                    <SkillCard 
                        key={match._id || index}
                        match={match} 
                        onConnect={handleConnect}
                        // 🆕 Indicate if the connection will be free
                        isBarter={match.isTwoWayBarter}
                    />
                ))}
            </div>
        </div>
    );
};
export default MatchingPage;