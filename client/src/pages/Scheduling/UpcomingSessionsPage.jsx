// client/src/pages/Scheduling/UpcomingSessionsPage.jsx (UPDATED - Live Data and Cancel Action)
import React, { useState, useEffect } from 'react';
import { FaClock, FaVideo, FaTimes, FaCalendarAlt, FaSpinner, FaHistory, FaCheckCircle } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const UpcomingSessionsPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancellingId, setIsCancellingId] = useState(null);

    const fetchUpcomingSessions = async () => {
        setIsLoading(true);
        try {
            // 🚨 API Call: GET /api/sessions/upcoming (Fixes the 404 for this endpoint)
            const response = await api.get('/sessions/upcoming');
            setSessions(response.data.map(session => ({
                id: session._id,
                skill: session.skill,
                // Determine partner based on who the user is (Teacher or Learner)
                partner: session.teacher.name || session.learner.name, 
                date: new Date(session.scheduledAt).toLocaleDateString(),
                time: new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                role: session.teacher.name ? 'Teacher' : 'Learner', 
                chatId: session.chat
            })));
        } catch (error) {
            console.error("Failed to fetch upcoming sessions:", error);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcomingSessions();
    }, []);

    const handleJoinSession = (sessionId) => {
        // Navigate to VideoCallPage
        navigate(`/video/${sessionId}`);
    };

    const handleCancel = async (sessionId) => {
        if (!window.confirm(`Are you sure you want to cancel this session? This action will cancel the session for both parties and may impact your contribution ratio.`)) {
            return;
        }

        setIsCancellingId(sessionId);
        try {
            // 🚨 API Call: POST /api/sessions/cancel/:sessionId (Conceptual route)
            // Assuming we implement a new backend route for cancellation:
            await api.post(`/sessions/cancel/${sessionId}`); 
            
            alert(`Session canceled successfully.`);
            // Remove the canceled session from the list immediately
            setSessions(prev => prev.filter(s => s.id !== sessionId));

        } catch (error) {
             alert(`Failed to cancel session: ` + error.response?.data?.message || 'Server error.');
        } finally {
            setIsCancellingId(null);
        }
    };
    

    if (isLoading) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading upcoming sessions...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaClock className="mr-3 text-blue-600"/> Upcoming Sessions
            </h1>
            <p className="text-gray-600 mb-8">
                Your active sessions are listed here. Be ready for your scheduled time!
            </p>

            {/* SessionSubNav placeholder */}
            <div className="flex space-x-4 mb-8">
                <Button variant="primary">
                    <FaClock className="mr-2"/> Upcoming Sessions
                </Button>
                <Button onClick={() => navigate('/schedule/history')} variant="secondary">
                    <FaHistory className="mr-2"/> Session History
                </Button>
                <Button onClick={() => navigate('/schedule/confirm')} variant="secondary">
                    <FaCheckCircle className="mr-2"/> Confirm Sessions
                </Button>
            </div>


            <div className="space-y-6">
                {sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session.id} className="p-5 border rounded-xl shadow-sm hover:shadow-md transition bg-blue-50 border-blue-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-lg font-bold text-gray-800">{session.skill}</p>
                                    <p className="text-sm text-gray-600">
                                        Partner: <span className="font-semibold">{session.partner}</span> | Role: <span className={`font-semibold ${session.role === 'Teacher' ? 'text-indigo-600' : 'text-purple-600'}`}>{session.role}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-extrabold text-blue-700">{session.date}</p>
                                    <p className="text-sm text-gray-500">{session.time}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-blue-100 flex justify-end space-x-3">
                                <Button 
                                    onClick={() => handleJoinSession(session.id)}
                                    variant="primary"
                                    className="bg-green-600 hover:bg-green-700 text-sm"
                                >
                                    <FaVideo className="mr-2"/> Join Call
                                </Button>
                                <Button 
                                    onClick={() => handleCancel(session.id)}
                                    variant="secondary"
                                    isLoading={isCancellingId === session.id}
                                    className="text-sm border-red-500 text-red-500 hover:bg-red-50"
                                >
                                    {isCancellingId === session.id ? 'Cancelling...' : <><FaTimes className="mr-2"/> Cancel Session</>}
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        You have no sessions currently scheduled.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingSessionsPage;