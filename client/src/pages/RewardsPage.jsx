// client/src/pages/RewardsPage.jsx
import React, { useState } from 'react';
import { FaTrophy, FaStar, FaAward, FaUserFriends, FaSyncAlt } from 'react-icons/fa';
import Leaderboard from '../components/rewards/Leaderboard';
import BadgeDisplay from '../components/rewards/BadgeDisplay';
import Button from '../components/common/Button';

const mockUserData = {
    points: 850,
    teachingLearningRatio: '1.5:1',
    badges: ['Active Contributor', 'Top Mentor', 'Verified Profile'],
    referralCode: 'SKILLSYNC_001',
};

const RewardsPage = () => {
    const [userData, setUserData] = useState(mockUserData);
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setUserData(prev => ({ ...prev, points: prev.points + Math.floor(Math.random() * 50) }));
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaTrophy className="text-yellow-500 shrink-0" /> Your Rewards Hub
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Earn points, badges, and climb the leaderboard for consistent participation.
                </p>
            </div>

            {/* Stat cards — 1 col on mobile, 3 on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-xl shadow-inner border-t-4 border-blue-500">
                    <h2 className="text-base sm:text-xl font-semibold text-blue-700 flex items-center gap-2">
                        <FaStar /> Reputation Points
                    </h2>
                    <p className="text-4xl sm:text-5xl font-extrabold text-blue-900 mt-2">{userData.points}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Gained from teaching and contributions.</p>
                </div>
                <div className="bg-purple-50 p-4 sm:p-6 rounded-xl shadow-inner border-t-4 border-purple-500">
                    <h2 className="text-base sm:text-xl font-semibold text-purple-700 flex items-center gap-2">
                        <FaAward /> T-L Ratio
                    </h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-purple-900 mt-2">{userData.teachingLearningRatio}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Teaching-to-Learning builds trust.</p>
                </div>
                <div className="bg-yellow-50 p-4 sm:p-6 rounded-xl shadow-inner border-t-4 border-yellow-500">
                    <h2 className="text-base sm:text-xl font-semibold text-yellow-700 flex items-center gap-2">
                        <FaUserFriends /> Referrals
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-yellow-800 mt-2 break-all">Code: {userData.referralCode}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Get bonus credits for inviting members.</p>
                    <Button variant="secondary" className="mt-3 text-sm">Copy Link</Button>
                </div>
            </div>

            <hr />

            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Earned Badges</h2>
                <BadgeDisplay badges={userData.badges} />
            </div>

            <hr />

            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Top Contributors</h2>
                    <Button onClick={handleRefresh} variant="secondary" isLoading={isLoading} className="w-full sm:w-auto justify-center">
                        <FaSyncAlt className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
                <Leaderboard />
            </div>
        </div>
    );
};

export default RewardsPage;