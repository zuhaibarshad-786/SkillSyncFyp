// client/src/pages/MatchingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaWallet, FaPlusCircle } from 'react-icons/fa';
import SkillCard from '../components/common/SkillCard';
import Button from '../components/common/Button';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import NewUserWelcomeModal from './Credits/NewUserWelcomeModal';

const useCredits = () => ({
    skillCredits: 5,
    teachingLearningRatio: 0.5,
    isNewUser: true,
});

const MatchingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { skillCredits, isNewUser } = useCredits();

    const [matches, setMatches]         = useState([]);
    const [isLoading, setIsLoading]     = useState(false);
    const [error, setError]             = useState(null);
    const [fallbackData, setFallbackData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(isNewUser);

    const fetchMatches = async () => {
        setIsLoading(true);
        setError(null);
        setMatches([]);
        setFallbackData(null);
        try {
            const response = await api.get('/matches/suggestions');
            if (Array.isArray(response.data) && response.data.length > 0) {
                setMatches(response.data.map((m, i) => ({ ...m, isTwoWayBarter: i % 2 === 0 })));
            } else {
                const desiredSkill = response.data?.desiredSkill || 'Advanced Spanish';
                setFallbackData({ desiredSkill });
                setError(`No complementary matches found for ${desiredSkill} at this moment.`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch match suggestions.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user?._id) fetchMatches(); }, [user?._id]);

    const handleConnect = async (match) => {
        if (!match.isTwoWayBarter && skillCredits < 1) {
            alert('You need at least 1 Skill Credit for a one-sided session.');
            navigate('/credits/wallet');
            return;
        }
        try {
            await api.post(`/chat/connect/${match.user._id}`);
            const msg = match.isTwoWayBarter
                ? 'Connection request sent — FREE Two-Way Barter!'
                : 'Connection request sent. 1 Credit will be used upon confirmation.';
            setMatches(prev => prev.filter(m => m.user._id !== match.user._id));
            alert(msg);
            navigate('/chat');
        } catch (error) {
            alert('Failed to send connection request.');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <NewUserWelcomeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onNavigateToCredits={() => { setIsModalOpen(false); navigate('/credits/wallet'); }}
            />

            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Your Complementary Matches 🤝
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Partners who have what you need, and need what you have.
                </p>
            </div>

            {/* Credit status banner */}
            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-l-4 border-indigo-500">
                <div className="flex items-center gap-3">
                    <FaWallet className="text-indigo-600 text-xl sm:text-2xl shrink-0" />
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                        Credits: <span className="font-bold text-indigo-900">{skillCredits}</span>
                    </p>
                </div>
                <Button onClick={() => navigate('/credits/wallet')} variant="primary" className="text-sm py-2 px-3 sm:px-4 w-full sm:w-auto justify-center">
                    <FaPlusCircle className="mr-1.5" /> Acquire Credits
                </Button>
            </div>

            {/* Refresh */}
            <div className="flex justify-end">
                <Button onClick={fetchMatches} variant="secondary" isLoading={isLoading} className="text-sm">
                    <FaSyncAlt className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {/* Error / fallback */}
            {error && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    {error}
                </div>
            )}

            {/* Match cards — 1 col on mobile, 2 on sm, 3 on xl */}
            {matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {matches.map((match, index) => (
                        <SkillCard
                            key={match._id || index}
                            match={match}
                            onConnect={handleConnect}
                            isBarter={match.isTwoWayBarter}
                        />
                    ))}
                </div>
            )}

            {!isLoading && matches.length === 0 && !error && (
                <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    No matches found yet. Make sure your listing is up to date!
                </div>
            )}
        </div>
    );
};

export default MatchingPage;