// // client/src/components/common/SkillCard.jsx
// import React from 'react';
// import { FaGraduationCap, FaHandsHelping, FaCheckCircle, FaExchangeAlt, FaCreditCard } from 'react-icons/fa'; // 🆕 Added Icons
// import Button from './Button'; 

// // 🆕 Accept the new 'isBarter' prop
// const SkillCard = ({ match, onConnect, isBarter }) => {
//     // NOTE: 'user' here refers to the PARTNER's user object attached to the match
//     const { user, skillToTeach, skillToLearn, score, matchReason } = match;

//     // --- Exchange Status Logic ---
//     const exchangeStatus = isBarter ? {
//         label: "FREE Two-Way Barter",
//         icon: FaExchangeAlt,
//         bgColor: 'bg-green-100',
//         textColor: 'text-green-700'
//     } : {
//         label: "Requires 1 Skill Credit",
//         icon: FaCreditCard,
//         bgColor: 'bg-red-100',
//         textColor: 'text-red-700'
//     };

//     return (
//         <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 m-4 w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            
//             {/* 1. Partner Details */}
//             <div className="flex items-center space-x-4 mb-4 border-b pb-3">
//                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
//                     {user.name ? user.name[0] : 'U'}
//                 </div>
//                 <div>
//                     <h3 className="text-xl font-semibold text-gray-800">{user.name || 'Anonymous Partner'}</h3> 
//                     <p className="text-sm text-green-600 font-medium flex items-center">
//                         <FaCheckCircle className="mr-1" /> Match Score: {score || 'N/A'}%
//                     </p>
//                 </div>
//             </div>

//             {/* 2. Skills Exchange Details */}
//             <div className="space-y-3">
//                 <div className="flex items-start">
//                     <FaHandsHelping className="text-purple-500 mt-1 mr-2 flex-shrink-0" />
//                     <div>
//                         <p className="text-sm font-medium text-gray-500">Partner Teaches:</p>
//                         <p className="text-lg font-bold text-purple-700">{skillToTeach.name}</p>
//                         <span className="text-xs text-gray-400">({skillToTeach.level})</span>
//                     </div>
//                 </div>

//                 <div className="flex items-start">
//                     <FaGraduationCap className="text-orange-500 mt-1 mr-2 flex-shrink-0" />
//                     <div>
//                         <p className="text-sm font-medium text-gray-500">Partner Wants to Learn:</p>
//                         <p className="text-lg font-bold text-orange-700">{skillToLearn.name}</p>
//                         <span className="text-xs text-gray-400">({skillToLearn.level})</span>
//                     </div>
//                 </div>
//             </div>
            
//             {/* 🆕 3. Exchange Type Indicator */}
//             <div className={`mt-4 pt-3 border-t border-dashed ${exchangeStatus.bgColor}`}>
//                 <div className={`text-sm font-semibold p-2 rounded flex items-center justify-center ${exchangeStatus.bgColor} ${exchangeStatus.textColor}`}>
//                     <exchangeStatus.icon className="mr-2"/> 
//                     {exchangeStatus.label}
//                 </div>
//             </div>

//             {/* 4. Match Reason */}
//             <div className="mt-4 pt-3 border-t">
//                 <p className="text-sm font-semibold text-gray-700 mb-2">Why this match?</p>
//                 <blockquote className="text-sm text-gray-600 italic border-l-2 border-indigo-500 pl-3">
//                     {matchReason}
//                 </blockquote>
//             </div>

//             {/* 5. Action Button */}
//             <Button 
//                 onClick={() => onConnect(match)}
//                 variant="primary"
//                 className="mt-6 w-full"
//             >
//                 Connect & Chat
//             </Button>
//         </div>
//     );
// };

// export default SkillCard;

// client/src/components/common/SkillCard.jsx
import React from 'react';
import { FaGraduationCap, FaHandsHelping, FaCheckCircle, FaExchangeAlt, FaCreditCard, FaStar } from 'react-icons/fa';
import Button from './Button'; 

const SkillCard = ({ match, onConnect, isBarter }) => {
    // Destructuring new fields from the matching engine
    const { 
        user, 
        skillsToTeach, 
        skillsToLearn, 
        matchScore, 
        matchReason, 
        matchedOnPriority 
    } = match;

    // --- Exchange Status Logic ---
    const exchangeStatus = isBarter ? {
        label: "FREE Two-Way Barter",
        icon: FaExchangeAlt,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
    } : {
        label: "Requires 1 Skill Credit",
        icon: FaCreditCard,
        bgColor: 'bg-red-50',
        textColor: 'text-red-600'
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 m-4 w-full max-w-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
            
            <div>
                {/* 1. Partner Details & Priority Badge */}
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {user.name ? user.name[0] : 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{user.name || 'Anonymous Partner'}</h3> 
                            <p className="text-xs text-green-600 font-medium flex items-center">
                                <FaCheckCircle className="mr-1" /> Match Score: {matchScore || 'N/A'}
                            </p>
                        </div>
                    </div>
                    {/* Priority Indicator */}
                    {matchedOnPriority && (
                        <div className="flex flex-col items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200">
                            <FaStar className="text-xs" />
                            <span className="text-[10px] font-bold uppercase">Priority {matchedOnPriority}</span>
                        </div>
                    )}
                </div>

                {/* 2. Skills Exchange Details (Top 2 for visual clarity) */}
                <div className="space-y-4 mb-4">
                    <div className="flex items-start">
                        <FaHandsHelping className="text-purple-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="w-full">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partner Teaches:</p>
                            {skillsToTeach?.slice(0, 2).map((s, i) => (
                                <div key={i} className="flex justify-between items-center mb-1">
                                    <p className="text-md font-bold text-purple-700">{s.name}</p>
                                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded">{s.level}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start">
                        <FaGraduationCap className="text-orange-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="w-full">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partner Wants to Learn:</p>
                            {skillsToLearn?.slice(0, 2).map((s, i) => (
                                <div key={i} className="flex justify-between items-center mb-1">
                                    <p className="text-md font-bold text-orange-700">{s.name}</p>
                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded">{s.level}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                {/* 3. Exchange Type Indicator */}
                <div className={`mt-2 mb-4 p-2 rounded-lg flex items-center justify-center border-l-4 ${exchangeStatus.bgColor} ${exchangeStatus.textColor}`}>
                    <exchangeStatus.icon className="mr-2"/> 
                    <span className="text-xs font-bold uppercase">{exchangeStatus.label}</span>
                </div>

                {/* 4. Match Reason (Explaining the Priority Match) */}
                <div className="bg-gray-50 p-3 rounded-lg border-l-2 border-indigo-400">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Why this match?</p>
                    <p className="text-sm text-gray-600 italic leading-snug">
                        {matchReason}
                    </p>
                </div>

                {/* 5. Action Button */}
                <Button 
                    onClick={() => onConnect(match)}
                    variant="primary"
                    className="mt-5 w-full font-bold shadow-md transform active:scale-95 transition-transform"
                >
                    Connect & Chat
                </Button>
            </div>
        </div>
    );
};

export default SkillCard;