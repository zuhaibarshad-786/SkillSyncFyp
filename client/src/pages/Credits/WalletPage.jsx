// client/src/pages/Credits/WalletPage.jsx
import React, { useState } from 'react';
import { FaWallet, FaPlusCircle, FaHandsHelping, FaHistory, FaCrown } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import CreditSubNav from '../../components/credits/CreditSubNav';

const WalletPage = () => {
    const navigate = useNavigate();
    const [skillCredits, setSkillCredits] = useState(15); // Mock credit balance
    const [teachingLearningRatio, setTeachingLearningRatio] = useState('0.5:1'); // Mock ratio
    const [isPremium, setIsPremium] = useState(false); // Mock premium status

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <CreditSubNav />
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaWallet className="mr-3 text-green-600"/> My Skill Wallet & Balance
            </h1>
            <p className="text-gray-600 mb-8">
                Manage your Skill Credits. You need credits to consume learning sessions without teaching in return.
            </p>

            {/* Credit Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-green-50 p-6 rounded-xl shadow-inner border-l-4 border-green-500">
                    <h2 className="text-lg font-semibold text-green-700">Available Credits</h2>
                    <p className="text-5xl font-extrabold text-green-900 mt-2">{skillCredits}</p>
                    <p className="text-sm text-gray-600 mt-1">1 Credit = 1 Learning Session[cite: 157].</p>
                </div>

                <div className="bg-indigo-50 p-6 rounded-xl shadow-inner border-l-4 border-indigo-500">
                    <h2 className="text-lg font-semibold text-indigo-700">T-L Ratio (Reputation)</h2>
                    <p className="text-4xl font-extrabold text-indigo-900 mt-2">{teachingLearningRatio}</p>
                    <p className="text-sm text-gray-600 mt-1">Teaching vs. Learning sessions[cite: 249].</p>
                </div>
                
                <div className={`p-6 rounded-xl shadow-inner border-l-4 ${isPremium ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-400'}`}>
                    <h2 className="text-lg font-semibold text-gray-700">Account Status</h2>
                    <p className={`text-xl font-bold mt-2 flex items-center ${isPremium ? 'text-yellow-700' : 'text-gray-700'}`}>
                        {isPremium && <FaCrown className="mr-2"/>} {isPremium ? 'PREMIUM' : 'BASIC'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Unlock perks like faster matching[cite: 205].</p>
                </div>
            </div>

            {/* Actions for Learners (Need Credits) */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Need More Credits?</h2>
            <p className="text-gray-600 mb-6">
                If you are a one-sided learner, you can obtain credits by contributing or purchasing them[cite: 166, 215].
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Button 
                    onClick={() => navigate('/credits/buy')}
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700 text-lg py-3"
                >
                    <FaPlusCircle className="mr-2"/> Buy Credits Now
                </Button>
                <Button 
                    onClick={() => navigate('/credits/contribute')}
                    variant="secondary"
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 text-lg py-3"
                >
                    <FaHandsHelping className="mr-2"/> Earn Credits (Contribute)
                </Button>
                <Button 
                    onClick={() => navigate('/credits/history')}
                    variant="secondary"
                    className="text-lg py-3"
                >
                    <FaHistory className="mr-2"/> View Credit History
                </Button>
            </div>
            
            <hr className="my-10"/>

            {/* Message for Frequent Teachers (Who only want to Teach) */}
            <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-blue-800 mb-2">Are you a Frequent Teacher?</h2>
                <p className="text-blue-700">
                    Users who teach regularly automatically gain higher visibility and ranking, and generally do not require credits to learn[cite: 249, 166]. Check your full reputation on the rewards page.
                </p>
            </div>
        </div>
    );
};

export default WalletPage;