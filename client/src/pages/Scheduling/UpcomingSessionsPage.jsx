// client/src/pages/Scheduling/UpcomingSessionsPage.jsx
import React, { useState, useEffect } from 'react';
import { FaClock, FaVideo, FaTimes, FaSpinner, FaHistory, FaCheckCircle } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const UpcomingSessionsPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions]         = useState([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [isCancellingId, setIsCancellingId] = useState(null);

    const fetchUpcomingSessions = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/sessions/upcoming');
            setSessions(response.data.map(session => ({
                id:      session._id,
                skill:   session.skill,
                partner: session.partner.name,
                role:    session.myRole,
                date:    new Date(session.scheduledAt).toLocaleDateString(),
                time:    new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                chatId:  session.chatId,
            })));
        } catch (error) {
            console.error('Failed to fetch upcoming sessions:', error);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUpcomingSessions(); }, []);

    const handleCancel = async (sessionId) => {
        if (!window.confirm('Are you sure you want to cancel this session?')) return;
        setIsCancellingId(sessionId);
        try {
            await api.post(`/sessions/cancel/${sessionId}`);
            alert('Session canceled successfully.');
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error) {
            alert(error.response?.data?.message || 'Cancel failed');
        } finally {
            setIsCancellingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin mr-2 inline" /> Loading upcoming sessions...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaClock className="text-blue-600 shrink-0" /> Upcoming Sessions
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Your active sessions are listed here.</p>
            </div>

            {/* Nav buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Button variant="primary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaClock className="mr-1.5" /> Upcoming
                </Button>
                <Button onClick={() => navigate('/schedule/history')} variant="secondary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaHistory className="mr-1.5" /> History
                </Button>
                <Button onClick={() => navigate('/schedule/confirm')} variant="secondary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaCheckCircle className="mr-1.5" /> Confirm
                </Button>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            className="p-4 sm:p-5 border rounded-xl shadow-sm hover:shadow-md transition bg-blue-50 border-blue-200"
                        >
                            {/* Top row: skill + date/time */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div className="min-w-0">
                                    <p className="text-base sm:text-lg font-bold text-gray-800 truncate">{session.skill}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                        Partner: <span className="font-semibold">{session.partner}</span>
                                        {' | '}Role:{' '}
                                        <span className={`font-semibold ${session.role === 'Teacher' ? 'text-indigo-600' : 'text-purple-600'}`}>
                                            {session.role}
                                        </span>
                                    </p>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <p className="text-lg sm:text-xl font-extrabold text-blue-700">{session.date}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">{session.time}</p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-3 pt-3 border-t border-blue-100 flex flex-col sm:flex-row justify-end gap-2">
                                <Button
                                    onClick={() => navigate(`/video/${session.id}`)}
                                    variant="primary"
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm justify-center"
                                >
                                    <FaVideo className="mr-2" /> Join Call
                                </Button>
                                <Button
                                    onClick={() => handleCancel(session.id)}
                                    variant="secondary"
                                    isLoading={isCancellingId === session.id}
                                    className="w-full sm:w-auto text-sm border-red-500 text-red-500 hover:bg-red-50 justify-center"
                                >
                                    {isCancellingId === session.id
                                        ? 'Cancelling...'
                                        : <><FaTimes className="mr-2" /> Cancel</>
                                    }
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg text-sm">
                        You have no sessions currently scheduled.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingSessionsPage;