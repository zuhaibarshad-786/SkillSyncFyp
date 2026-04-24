// client/src/pages/Scheduling/SessionHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { FaHistory, FaCheck, FaStar, FaPen, FaSpinner, FaTimes } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const SessionHistoryPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/sessions/history');
                setSessions(response.data.map(session => {
                    const isUserTeacher = session.teacher.name;
                    const partnerName   = isUserTeacher ? session.learner.name : session.teacher.name;
                    return {
                        id:            session._id,
                        skill:         session.skill,
                        partner:       partnerName,
                        date:          new Date(session.scheduledAt).toLocaleDateString(),
                        role:          isUserTeacher ? 'Teacher' : 'Learner',
                        rating:        session.feedback?.rating,
                        feedbackGiven: session.status === 'rated',
                        status:        session.status,
                    };
                }));
            } catch (error) {
                console.error('Failed to fetch session history:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin mr-2 inline" /> Loading session history...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaHistory className="text-purple-600 shrink-0" /> Session History
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    A record of all your completed skill exchange sessions.
                </p>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session.id} className="p-4 sm:p-5 border rounded-xl shadow-sm bg-purple-50 border-purple-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div className="min-w-0">
                                    <p className="text-base sm:text-xl font-bold text-gray-800 truncate">{session.skill}</p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Partner: <span className="font-semibold">{session.partner}</span> · {session.date}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center self-start px-2.5 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                                    session.role === 'Teacher' ? 'bg-indigo-200 text-indigo-800' : 'bg-pink-200 text-pink-800'
                                }`}>
                                    {session.role}
                                </span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-purple-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                {session.status === 'canceled' ? (
                                    <span className="flex items-center text-red-700 font-medium text-sm">
                                        <FaTimes className="mr-1.5" /> Canceled
                                    </span>
                                ) : session.feedbackGiven ? (
                                    <span className="flex items-center text-green-700 font-medium text-sm">
                                        <FaCheck className="mr-1.5" /> Feedback Provided
                                        {session.rating && (
                                            <span className="ml-2 flex items-center text-yellow-600">
                                                <FaStar className="mr-0.5" /> {session.rating}.0
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-red-700 font-medium text-sm">Feedback Required</span>
                                )}

                                {!session.feedbackGiven && session.role === 'Learner' && session.status === 'completed' && (
                                    <Button
                                        onClick={() => navigate(`/feedback/${session.id}`)}
                                        variant="primary"
                                        className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-sm justify-center"
                                    >
                                        <FaPen className="mr-2" /> Give Peer Review
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg text-sm">
                        No sessions found in history.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionHistoryPage;