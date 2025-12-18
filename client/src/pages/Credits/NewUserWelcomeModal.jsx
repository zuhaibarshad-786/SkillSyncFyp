// client/src/components/credits/NewUserWelcomeModal.jsx
import React from 'react';
import { FaSyncAlt, FaCreditCard, FaCheckCircle, FaTimes, FaChalkboardTeacher, FaBookReader } from 'react-icons/fa';
import Button from '../../components/common/Button';

const NewUserWelcomeModal = ({ isOpen, onClose, onNavigateToCredits }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
                <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center">
                    <FaSyncAlt className="mr-3"/> Welcome to Skill Sync!
                </h2>
                <p className="text-gray-600 mb-6">
                    Our platform is built on two core exchange principles: **Barter (Free)** and **Credits (Fairness)**.
                </p>

                <div className="space-y-4">
                    {/* Barter Explanation */}
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <h3 className="font-bold text-green-700 flex items-center mb-1">
                            <FaCheckCircle className="mr-2"/> 1. Two-Way Cross Match (Barter)
                        </h3>
                        <p className="text-sm text-gray-700">
                            If you teach skill **X** and want to learn **Y**, and your partner does the reverse, the exchange is **FREE**. No credits are used.
                        </p>
                    </div>

                    {/* Credits Explanation */}
                    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <h3 className="font-bold text-red-700 flex items-center mb-1">
                            <FaCreditCard className="mr-2"/> 2. One-Sided Learner (Credits Required)
                        </h3>
                        <p className="text-sm text-gray-700">
                            If you **only want to learn** and cannot offer a complementary skill, you must use a **Skill Credit** for the session.
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <Button onClick={onClose} variant="secondary" className="text-sm">
                        I Understand
                    </Button>
                    <Button onClick={onNavigateToCredits} variant="primary" className="text-sm bg-red-600 hover:bg-red-700">
                        <FaCreditCard className="mr-2"/> Acquire Credits Now
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewUserWelcomeModal;