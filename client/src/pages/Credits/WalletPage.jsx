// client/src/pages/Credits/WalletPage.jsx
import React, { useState } from 'react';
import { FaWallet, FaPlusCircle, FaHandsHelping, FaHistory, FaCrown } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import CreditSubNav from '../../components/credits/CreditSubNav';

const WalletPage = () => {
    const navigate = useNavigate();
    const [skillCredits]            = useState(15);
    const [teachingLearningRatio]   = useState('0.5:1');
    const [isPremium]               = useState(false);

    return (
        <div className="space-y-6">
            <CreditSubNav />

            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaWallet className="text-green-600 shrink-0" /> My Skill Wallet
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Manage your Skill Credits. You need credits to learn without teaching in return.
                </p>
            </div>

            {/* Balance cards — 1 col on mobile, 3 on md */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 sm:p-6 rounded-xl shadow-inner border-l-4 border-green-500">
                    <h2 className="text-sm sm:text-lg font-semibold text-green-700">Available Credits</h2>
                    <p className="text-4xl sm:text-5xl font-extrabold text-green-900 mt-2">{skillCredits}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">1 Credit = 1 Learning Session.</p>
                </div>
                <div className="bg-indigo-50 p-4 sm:p-6 rounded-xl shadow-inner border-l-4 border-indigo-500">
                    <h2 className="text-sm sm:text-lg font-semibold text-indigo-700">T-L Ratio</h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-indigo-900 mt-2">{teachingLearningRatio}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Teaching vs. Learning sessions.</p>
                </div>
                <div className={`p-4 sm:p-6 rounded-xl shadow-inner border-l-4 ${isPremium ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-400'}`}>
                    <h2 className="text-sm sm:text-lg font-semibold text-gray-700">Account Status</h2>
                    <p className={`text-lg sm:text-xl font-bold mt-2 flex items-center gap-1 ${isPremium ? 'text-yellow-700' : 'text-gray-700'}`}>
                        {isPremium && <FaCrown />} {isPremium ? 'PREMIUM' : 'BASIC'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Unlock faster matching perks.</p>
                </div>
            </div>

            {/* Action buttons — stack on mobile */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Need More Credits?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button onClick={() => navigate('/credits/buy')} variant="primary" className="bg-red-600 hover:bg-red-700 py-3 justify-center">
                        <FaPlusCircle className="mr-2" /> Buy Credits
                    </Button>
                    <Button onClick={() => navigate('/credits/contribute')} variant="secondary" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 py-3 justify-center">
                        <FaHandsHelping className="mr-2" /> Earn Credits
                    </Button>
                    <Button onClick={() => navigate('/credits/history')} variant="secondary" className="py-3 justify-center">
                        <FaHistory className="mr-2" /> Credit History
                    </Button>
                </div>
            </div>

            <hr />

            <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border-l-4 border-blue-500">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-800 mb-2">Are you a Frequent Teacher?</h2>
                <p className="text-blue-700 text-sm sm:text-base">
                    Users who teach regularly gain higher visibility and generally do not require credits to learn.
                </p>
            </div>
        </div>
    );
};

export default WalletPage;