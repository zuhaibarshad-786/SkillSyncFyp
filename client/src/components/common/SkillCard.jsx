// client/src/components/common/SkillCard.jsx
import React from 'react';
import { FaGraduationCap, FaHandsHelping, FaCheckCircle, FaExchangeAlt, FaCreditCard } from 'react-icons/fa'; // 🆕 Added Icons
import Button from './Button'; 

// 🆕 Accept the new 'isBarter' prop
const SkillCard = ({ match, onConnect, isBarter }) => {
    // NOTE: 'user' here refers to the PARTNER's user object attached to the match
    const { user, skillToTeach, skillToLearn, score, matchReason } = match;

    // --- Exchange Status Logic ---
    const exchangeStatus = isBarter ? {
        label: "FREE Two-Way Barter",
        icon: FaExchangeAlt,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
    } : {
        label: "Requires 1 Skill Credit",
        icon: FaCreditCard,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 m-4 w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            
            {/* 1. Partner Details */}
            <div className="flex items-center space-x-4 mb-4 border-b pb-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {user.name ? user.name[0] : 'U'}
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">{user.name || 'Anonymous Partner'}</h3> 
                    <p className="text-sm text-green-600 font-medium flex items-center">
                        <FaCheckCircle className="mr-1" /> Match Score: {score || 'N/A'}%
                    </p>
                </div>
            </div>

            {/* 2. Skills Exchange Details */}
            <div className="space-y-3">
                <div className="flex items-start">
                    <FaHandsHelping className="text-purple-500 mt-1 mr-2 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-gray-500">Partner Teaches:</p>
                        <p className="text-lg font-bold text-purple-700">{skillToTeach.name}</p>
                        <span className="text-xs text-gray-400">({skillToTeach.level})</span>
                    </div>
                </div>

                <div className="flex items-start">
                    <FaGraduationCap className="text-orange-500 mt-1 mr-2 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-gray-500">Partner Wants to Learn:</p>
                        <p className="text-lg font-bold text-orange-700">{skillToLearn.name}</p>
                        <span className="text-xs text-gray-400">({skillToLearn.level})</span>
                    </div>
                </div>
            </div>
            
            {/* 🆕 3. Exchange Type Indicator */}
            <div className={`mt-4 pt-3 border-t border-dashed ${exchangeStatus.bgColor}`}>
                <div className={`text-sm font-semibold p-2 rounded flex items-center justify-center ${exchangeStatus.bgColor} ${exchangeStatus.textColor}`}>
                    <exchangeStatus.icon className="mr-2"/> 
                    {exchangeStatus.label}
                </div>
            </div>

            {/* 4. Match Reason */}
            <div className="mt-4 pt-3 border-t">
                <p className="text-sm font-semibold text-gray-700 mb-2">Why this match?</p>
                <blockquote className="text-sm text-gray-600 italic border-l-2 border-indigo-500 pl-3">
                    {matchReason}
                </blockquote>
            </div>

            {/* 5. Action Button */}
            <Button 
                onClick={() => onConnect(match)}
                variant="primary"
                className="mt-6 w-full"
            >
                Connect & Chat
            </Button>
        </div>
    );
};

export default SkillCard;