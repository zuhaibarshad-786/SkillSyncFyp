// client/src/pages/Feedback/GiveFeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaPen, FaSpinner } from 'react-icons/fa';
import Button from '../../components/common/Button';
import api from '../../api/axios'; // Use your configured axios instance

const GiveFeedbackPage = () => {
    const { sessionId } = useParams(); // Get the session ID from the URL
    const navigate = useNavigate();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null); // To display partner/skill
    const [error, setError] = useState(null);

    // --- Mock Session Data Fetch ---
    useEffect(() => {
        // In a real app, fetch session data here: GET /api/sessions/:sessionId
        // Use this data to show the partner's name and skill for context.
        setSessionDetails({
            partnerName: 'Zohaib Arshad', // Example partner name
            skillTaught: 'Financial Modeling', // Example skill
            role: 'Learner'
        });
    }, [sessionId]);

    const handleRatingClick = (newRating) => {
        setRating(newRating);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError('Please select a star rating before submitting.');
            return;
        }

        setIsLoading(true);

        try {
            // API Call: POST /api/sessions/feedback (This should update reputation and award credits)
            await api.post(`/sessions/${sessionId}/feedback`, {
                rating,
                comment,
            });

            // 🚨 Crucial Step: Backend must handle reputation update (FR-8) and credit award (FR-9).
            // Teacher (The partner who taught) gets 1 credit.
            // Learner (The user giving feedback) gets partial credit/points.

            alert(`Thank you! Feedback submitted for session ${sessionId}. Your reputation has been updated.`);
            // Redirect back to history or dashboard
            navigate('/schedule/history'); 

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!sessionDetails) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading session details...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaPen className="mr-3 text-indigo-600"/> Peer Review for Session
            </h1>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-400">
                <p className="text-lg font-semibold text-blue-800">
                    Session: {sessionDetails.skillTaught}
                </p>
                <p className="text-sm text-gray-700">
                    Reviewing Partner: <span className="font-semibold">{sessionDetails.partnerName}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Input */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                        1. Rate Your Partner (Required)
                    </label>
                    <div className="flex justify-start space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                className={`w-8 h-8 cursor-pointer transition-colors ${
                                    star <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                }`}
                                onClick={() => handleRatingClick(star)}
                            />
                        ))}
                    </div>
                </div>

                {/* Comment Input */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                        2. Add a Comment (Optional)
                    </label>
                    <textarea
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength={500}
                        placeholder="Share your experience (e.g., clarity of instruction, punctuality)."
                    />
                </div>
                
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                <Button type="submit" isLoading={isLoading} variant="primary" className="text-lg py-3">
                    {isLoading ? 'Submitting Review...' : 'Submit Review & Update Reputation'}
                </Button>
            </form>
        </div>
    );
};

export default GiveFeedbackPage;