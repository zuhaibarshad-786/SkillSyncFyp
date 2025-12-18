// client/src/pages/Scheduling/SessionHistoryPage.jsx (UPDATED)
import React, { useState, useEffect } from 'react'; // 🆕 Import hooks
import { FaHistory, FaCheck, FaStar, FaPen, FaSpinner, FaTimes } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // 🆕 Import axios

const SessionHistoryPage = () => {
    const navigate = useNavigate();
    // 🆕 Replace mock data with state
    const [sessions, setSessions] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // 🚨 API Call: GET /api/sessions/history (Uses the new Session Controller)
                const response = await api.get('/sessions/history');
                setSessions(response.data.map(session => {
                    // Normalize the backend data to fit the UI needs
                    const isUserTeacher = session.teacher.name; // Simplified check
                    const partnerName = isUserTeacher ? session.learner.name : session.teacher.name;
                    
                    return {
                        id: session._id,
                        skill: session.skill,
                        partner: partnerName,
                        date: new Date(session.scheduledAt).toLocaleDateString(),
                        role: isUserTeacher ? 'Teacher' : 'Learner',
                        rating: session.feedback?.rating,
                        feedbackGiven: session.status === 'rated', // Check if the session has been rated
                        status: session.status // Can be 'completed', 'rated', or 'canceled'
                    };
                }));
            } catch (error) {
                console.error("Failed to fetch session history:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);
    
    const handleGiveFeedback = (sessionId) => {
        // Navigate to the Feedback page, passing the session ID as a parameter
        navigate(`/feedback/${sessionId}`); 
    };

    if (isLoading) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading session history...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaHistory className="mr-3 text-purple-600"/> Session History
            </h1>
            <p className="text-gray-600 mb-8">
                A record of all your completed skill exchange sessions.
            </p>

            <div className="space-y-6">
                {sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session.id} className="p-5 border rounded-xl shadow-sm bg-purple-50 border-purple-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xl font-bold text-gray-800">{session.skill}</p>
                                    <p className="text-sm text-gray-600">
                                        Partner: <span className="font-semibold">{session.partner}</span> | Completed: {session.date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${session.role === 'Teacher' ? 'bg-indigo-200 text-indigo-800' : 'bg-pink-200 text-pink-800'}`}>
                                        {session.role}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-purple-100 flex justify-between items-center">
                                {session.status === 'canceled' ? (
                                    <span className="flex items-center text-red-700 font-medium">
                                        <FaTimes className="mr-2"/> Canceled
                                    </span>
                                ) : session.feedbackGiven ? (
                                    <span className="flex items-center text-green-700 font-medium">
                                        <FaCheck className="mr-2"/> Feedback Provided 
                                        {session.rating && (
                                            <span className="ml-3 flex items-center text-yellow-600">
                                                <FaStar className="mr-1"/> {session.rating}.0
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-red-700 font-medium">Feedback Required</span>
                                )}
                                
                                {/* Only prompt Learners to give feedback if status is 'completed' */}
                                {!session.feedbackGiven && session.role === 'Learner' && session.status === 'completed' && (
                                    <Button 
                                        onClick={() => handleGiveFeedback(session.id)}
                                        variant="primary"
                                        className="bg-yellow-600 hover:bg-yellow-700 text-sm"
                                    >
                                        <FaPen className="mr-2"/> Give Peer Review
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        No sessions found in history.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionHistoryPage;