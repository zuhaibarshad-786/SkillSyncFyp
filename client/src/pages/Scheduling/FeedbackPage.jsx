// client/src/pages/Feedback/GiveFeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaPen, FaSpinner } from 'react-icons/fa';
import Button from '../../components/common/Button';
import api from '../../api/axios';

const GiveFeedbackPage = () => {
    const { sessionId } = useParams();
    const navigate      = useNavigate();

    const [rating, setRating]               = useState(0);
    const [hoveredStar, setHoveredStar]     = useState(0);
    const [comment, setComment]             = useState('');
    const [isLoading, setIsLoading]         = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [error, setError]                 = useState(null);

    useEffect(() => {
        // In production: fetch real session details from API
        setSessionDetails({
            partnerName: 'Your Partner',
            skillTaught: 'Session Skill',
            role:        'Learner',
        });
    }, [sessionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (rating === 0) { setError('Please select a star rating before submitting.'); return; }
        setIsLoading(true);
        try {
            await api.post(`/sessions/${sessionId}/feedback`, { rating, comment });
            alert('Thank you! Feedback submitted. Your reputation has been updated.');
            navigate('/schedule/history');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!sessionDetails) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin mr-2 inline" /> Loading session details...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FaPen className="text-indigo-600 shrink-0" /> Peer Review
            </h1>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <p className="text-base sm:text-lg font-semibold text-blue-800">{sessionDetails.skillTaught}</p>
                <p className="text-sm text-gray-700 mt-1">
                    Reviewing: <span className="font-semibold">{sessionDetails.partnerName}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
                {/* Star rating */}
                <div>
                    <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                        1. Rate Your Partner <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                className={`w-8 h-8 sm:w-10 sm:h-10 cursor-pointer transition-colors ${
                                    star <= (hoveredStar || rating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-300'
                                }`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                            />
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]} ({rating}/5)
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
                        2. Add a Comment <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                    </label>
                    <textarea
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength={500}
                        placeholder="Share your experience — clarity of instruction, punctuality, etc."
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <Button
                    type="submit"
                    isLoading={isLoading}
                    variant="primary"
                    className="w-full py-3 text-base justify-center"
                >
                    {isLoading ? 'Submitting...' : 'Submit Review & Update Reputation'}
                </Button>
            </form>
        </div>
    );
};

export default GiveFeedbackPage;