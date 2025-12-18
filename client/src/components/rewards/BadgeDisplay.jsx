// client/src/components/rewards/BadgeDisplay.jsx
import React from 'react';
import { FaCertificate, FaStar, FaUserCheck, FaHandsHelping } from 'react-icons/fa';

// Map badge names to icons and styles
const badgeMap = {
    'Top Mentor': { icon: FaStar, color: 'text-yellow-500', label: 'High Rating' }, // cite: 61
    'Active Contributor': { icon: FaHandsHelping, color: 'text-green-500', label: 'High Activity' }, // cite: 61
    'Verified Profile': { icon: FaUserCheck, color: 'text-blue-500', label: 'ID Verified' }, // cite: 48
    'Referral Champion': { icon: FaCertificate, color: 'text-purple-500', label: 'Invited 5+ Users' }, 
};

const BadgeDisplay = ({ badges }) => {
    if (!badges || badges.length === 0) {
        return <p className="text-gray-500 italic">No badges earned yet. Start teaching and contributing!</p>;
    }

    return (
        <div className="flex flex-wrap gap-4">
            {badges.map(badgeName => {
                const badgeInfo = badgeMap[badgeName] || { icon: FaCertificate, color: 'text-gray-400', label: badgeName };
                const Icon = badgeInfo.icon;
                
                return (
                    <div 
                        key={badgeName} 
                        className="flex items-center p-3 bg-white border border-gray-200 rounded-full shadow-sm"
                        title={`${badgeName} (${badgeInfo.label})`}
                    >
                        <Icon className={`w-5 h-5 mr-2 ${badgeInfo.color}`} />
                        <span className="text-sm font-medium text-gray-700 hidden sm:inline">{badgeName}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default BadgeDisplay;