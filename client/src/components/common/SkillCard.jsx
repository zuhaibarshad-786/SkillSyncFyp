// client/src/components/common/SkillCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaGraduationCap, FaHandsHelping, FaCheckCircle,
    FaExchangeAlt, FaCreditCard, FaStar, FaUser,
} from 'react-icons/fa';
import Button from './Button';

const SkillCard = ({ match, onConnect, isBarter }) => {
    const navigate = useNavigate();
    const { user, skillsToTeach, skillsToLearn, matchScore, matchReason, matchedOnPriority } = match;

    const exchangeStatus = isBarter
        ? { label: 'FREE Two-Way Barter',     icon: FaExchangeAlt, bgColor: 'bg-green-50', textColor: 'text-green-700', border: 'border-l-green-400' }
        : { label: 'Requires 1 Skill Credit', icon: FaCreditCard,  bgColor: 'bg-red-50',   textColor: 'text-red-600',   border: 'border-l-red-400'   };

    // Navigate to the MATCHED user's public profile — not the logged-in user's own /profile
    const goToProfile = (e) => {
        e.stopPropagation();
        if (user?._id) navigate(`/profile/${user._id}`);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between p-4 border-b gap-3">
                <div className="flex items-center gap-3 min-w-0">

                    {/* Avatar — clickable, navigates to /profile/:id */}
                    <button
                        onClick={goToProfile}
                        title={`View ${user?.name || 'user'}'s profile`}
                        aria-label={`View ${user?.name || 'user'}'s public profile`}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center
                                   text-indigo-600 font-bold text-lg shrink-0 cursor-pointer
                                   hover:bg-indigo-200 hover:ring-2 hover:ring-indigo-400 hover:scale-105
                                   transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {user?.name ? user.name[0].toUpperCase() : <FaUser className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0">
                        {/* Name — also clickable */}
                        <button
                            onClick={goToProfile}
                            className="block text-sm sm:text-base font-bold text-gray-800 truncate max-w-full
                                       hover:text-indigo-600 transition-colors text-left
                                       focus:outline-none focus:underline"
                        >
                            {user?.name || 'Anonymous Partner'}
                        </button>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                            <FaCheckCircle className="shrink-0" />
                            Match: {matchScore || 'N/A'}
                        </p>
                    </div>
                </div>

                {matchedOnPriority && (
                    <div className="flex flex-col items-center bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200 shrink-0">
                        <FaStar className="text-xs" />
                        <span className="text-[9px] font-bold uppercase leading-tight">P{matchedOnPriority}</span>
                    </div>
                )}
            </div>

            {/* ── Skills ─────────────────────────────────────────────────────── */}
            <div className="p-4 space-y-3 flex-1">
                <div className="flex items-start gap-2">
                    <FaHandsHelping className="text-purple-500 mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teaches</p>
                        {skillsToTeach?.slice(0, 2).map((s, i) => (
                            <div key={i} className="flex justify-between items-center gap-1">
                                <p className="text-sm font-bold text-purple-700 truncate">{s.name}</p>
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded shrink-0">{s.level}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <FaGraduationCap className="text-orange-500 mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Wants to Learn</p>
                        {skillsToLearn?.slice(0, 2).map((s, i) => (
                            <div key={i} className="flex justify-between items-center gap-1">
                                <p className="text-sm font-bold text-orange-700 truncate">{s.name}</p>
                                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded shrink-0">{s.level}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div className="p-4 border-t space-y-3">
                <div className={`p-2 rounded-lg flex items-center justify-center gap-2 border-l-4 ${exchangeStatus.bgColor} ${exchangeStatus.textColor} ${exchangeStatus.border}`}>
                    <exchangeStatus.icon className="shrink-0 text-sm" />
                    <span className="text-xs font-bold uppercase">{exchangeStatus.label}</span>
                </div>

                {matchReason && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border-l-2 border-indigo-400">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Why this match?</p>
                        <p className="text-xs text-gray-600 italic leading-snug line-clamp-2">{matchReason}</p>
                    </div>
                )}

                <Button
                    onClick={() => onConnect(match)}
                    variant="primary"
                    className="w-full justify-center font-bold shadow-sm active:scale-95 transition-transform"
                >
                    Connect &amp; Chat
                </Button>
            </div>
        </div>
    );
};

export default SkillCard;