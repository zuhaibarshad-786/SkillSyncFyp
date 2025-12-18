// client/src/pages/Credits/ContributionCenterPage.jsx
import React, { useState } from 'react';
import { FaHandsHelping, FaBook, FaClipboardCheck, FaRegStar } from 'react-icons/fa';
import Button from '../../components/common/Button';

const ContributionCenterPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const contributions = [
        { id: 1, title: 'Write Learning Notes', description: 'Submit comprehensive notes for any completed session.', reward: '+2 Credits', icon: FaBook },
        { id: 2, title: 'Submit Skill Quiz', description: 'Create and submit a short quiz (5-10 questions) on a skill you learned.', reward: '+3 Credits', icon: FaClipboardCheck },
        { id: 3, title: 'Review Teachers', description: 'Write an in-depth review for a teacher based on their profile and style.', reward: '+1 Credit', icon: FaRegStar },
    ];

    const handleSubmitContribution = (title) => {
        setIsSubmitting(true);
        // Mock API Call to submit contribution request
        setTimeout(() => {
            setIsSubmitting(false);
            alert(`Contribution for "${title}" submitted for review. Credits will be awarded if approved.`);
        }, 1500);
    };

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaHandsHelping className="mr-3 text-indigo-600"/> Contribution Center
            </h1>
            <p className="text-gray-600 mb-8">
                If you are currently only learning, you can contribute to the community in non-teaching ways to earn credits.
            </p>

            <div className="space-y-6">
                {contributions.map(item => (
                    <div key={item.id} className="p-5 border rounded-xl shadow-sm bg-indigo-50 border-indigo-200">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                <item.icon className="w-8 h-8 mr-4 text-indigo-600"/>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">{item.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-extrabold text-green-700">{item.reward}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-end">
                            <Button 
                                onClick={() => handleSubmitContribution(item.title)}
                                variant="secondary"
                                isLoading={isSubmitting}
                                className="text-sm"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContributionCenterPage;