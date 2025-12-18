// client/src/pages/Scheduling/FeedbackPage.jsx (NEW - Complete Feedback Flow)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import Button from '../../components/common/Button';
import api from '../../api/axios';

const FeedbackPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                // Fetch session details from history
                const response = await api.get('/sessions/history');
                const targetSession = response.data.find(s => s._id === sessionId);
                
                if (!targetSession) {
                    setError('Session not found');
                    return;
                }

                if (targetSession.status === 'rated') {
                    setError('Feedback already submitted for this session');
                    return;
                }

                if (targetSession.status !== 'completed') {
                    setError('Session must be completed before submitting feedback');
                    return;
                }

                setSession(targetSession);
            } catch (err) {
                console.error('Error fetching session:', err);
                setError('Failed to load session details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, [sessionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/sessions/feedback/${sessionId}`, {
                rating,
                comment
            });

            alert('✅ Feedback submitted successfully! Your rewards have been applied.');
            navigate('/schedule/history');
        } catch (err) {
            console.error('Error submitting feedback:', err);
            alert('Failed to submit feedback: ' + (err.response?.data?.message || 'Server error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin inline mr-2"/> Loading session details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
                    {error}
                </div>
                <div className="mt-4">
                    <Button onClick={() => navigate('/schedule/history')} variant="primary">
                        Back to History
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaStar className="mr-3 text-yellow-500"/> Rate Your Session
            </h1>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Session with</p>
                <p className="text-xl font-bold text-gray-800">
                    {session?.teacher?.name || 'Unknown Teacher'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    {session?.skill} • {new Date(session?.scheduledAt).toLocaleDateString()}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                        How would you rate this session?
                    </label>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <FaStar
                                    className={`text-4xl ${
                                        star <= (hoverRating || rating)
                                            ? 'text-yellow-500'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                            {rating === 5 && '⭐ Excellent!'}
                            {rating === 4 && '😊 Great session!'}
                            {rating === 3 && '👍 Good session'}
                            {rating === 2 && '😐 Could be better'}
                            {rating === 1 && '☹️ Needs improvement'}
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                        Additional Comments (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this session..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows="4"
                    />
                </div>

                {/* Reward Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                        🎁 Your Rewards Upon Submission:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>✅ Session marked as complete</li>
                        <li>⭐ Teacher's reputation will be updated</li>
                        <li>💰 Credits will be awarded based on session type</li>
                        {session?.isBarter && <li>🔄 +0.5 credits for barter exchange</li>}
                    </ul>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={rating === 0}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <FaCheckCircle className="mr-2"/> Submit Feedback
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/schedule/history')}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default FeedbackPage;