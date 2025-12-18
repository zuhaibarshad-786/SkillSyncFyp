// client/src/pages/RewardsPage.jsx
import React, { useState } from 'react';
import { FaTrophy, FaStar, FaAward, FaUserFriends, FaSyncAlt } from 'react-icons/fa';
import Leaderboard from '../components/rewards/Leaderboard';
import BadgeDisplay from '../components/rewards/BadgeDisplay';
import Button from '../components/common/Button';

const mockUserData = {
    points: 850,
    teachingLearningRatio: '1.5:1',
    badges: ['Active Contributor', 'Top Mentor', 'Verified Profile'], // cite: 61, 48
    referralCode: 'SKILLSYNC_001',
};

const RewardsPage = () => {
    const [userData, setUserData] = useState(mockUserData);
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        // Mock refresh
        setTimeout(() => {
            setUserData(prev => ({
                ...prev,
                points: prev.points + Math.floor(Math.random() * 50) 
            }));
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaTrophy className="mr-3 text-yellow-500"/> Your Rewards Hub
            </h1>
            <p className="text-gray-600 mb-8">
                Earn points, badges, and climb the leaderboard for consistent participation.
            </p>

            {/* User Stats & Badges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-blue-50 p-6 rounded-xl shadow-inner border-t-4 border-blue-500">
                    <h2 className="text-xl font-semibold text-blue-700 flex items-center"><FaStar className="mr-2"/> Reputation Points</h2>
                    <p className="text-5xl font-extrabold text-blue-900 mt-2">{userData.points}</p>
                    <p className="text-sm text-gray-600 mt-1">Gained from teaching and contributions.</p>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl shadow-inner border-t-4 border-purple-500">
                    <h2 className="text-xl font-semibold text-purple-700 flex items-center"><FaAward className="mr-2"/> T-L Ratio</h2>
                    <p className="text-4xl font-extrabold text-purple-900 mt-2">{userData.teachingLearningRatio}</p>
                    <p className="text-sm text-gray-600 mt-1">Teaching-to-Learning visibility builds trust.</p>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-xl shadow-inner border-t-4 border-yellow-500">
                    <h2 className="text-xl font-semibold text-yellow-700 flex items-center"><FaUserFriends className="mr-2"/> Referrals</h2>
                    <p className="text-lg font-bold text-yellow-800 mt-2">Code: {userData.referralCode}</p>
                    <p className="text-sm text-gray-600 mt-1">Get bonus credits for inviting new members.</p>
                    <Button variant="secondary" className="mt-3 text-sm">Copy Link</Button>
                </div>
            </div>

            <hr className="mb-10"/>

            {/* Badges Section */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Earned Badges</h2>
                <BadgeDisplay badges={userData.badges}/>
            </div>
            
            <hr className="mb-10"/>

            {/* Leaderboard Section */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Top Contributors Leaderboard</h2>
                <Button 
                    onClick={handleRefresh}
                    variant="secondary"
                    isLoading={isLoading}
                >
                    <FaSyncAlt className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>
            <Leaderboard />

        </div>
    );
};

export default RewardsPage;