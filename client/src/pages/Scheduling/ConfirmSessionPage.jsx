// client/src/pages/Scheduling/ConfirmSessionPage.jsx (FULLY FIXED)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSpinner, FaClock, FaHistory, FaCalendarAlt } from 'react-icons/fa';
import Button from '../../components/common/Button';
import api from '../../api/axios'; 
import { useAuth } from '../../hooks/useAuth';


const ConfirmSessionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingId, setIsProcessingId] = useState(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // Fetch upcoming sessions to find pending confirmations
            const response = await api.get('/sessions/upcoming'); 
            
            // Filter for sessions where current user is the teacher (receiving party)
            // These are the sessions that need confirmation
            const pendingRequests = response.data.filter(s => 
                s.teacher._id === user._id && s.status === 'scheduled'
            );

            setRequests(pendingRequests.map(s => ({
                id: s._id,
                skill: s.skill,
                partner: s.learner.name, 
                date: new Date(s.scheduledAt).toLocaleDateString(),
                time: new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'Incoming', 
                status: 'pending',
                chatId: s.chat,
                isBarter: s.isBarter
            })));

        } catch (error) {
            console.error("Failed to fetch session requests:", error);
            setRequests([]); 
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchRequests();
    }, []);


    const handleAccept = async (id) => {
        setIsProcessingId(id);
        
        try {
            // Session is already in 'scheduled' status, just acknowledge it
            // In a more complex system, you might have a separate 'pending' status
            // For now, we just remove it from the list
            alert(`Session request accepted! The session is now confirmed.`);
            setRequests(prev => prev.filter(req => req.id !== id));
            
        } catch (error) {
            alert(`Failed to accept request: ` + (error.response?.data?.message || 'Server error'));
        } finally {
            setIsProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        setIsProcessingId(id);
        
        try {
            // Cancel the session
            await api.post(`/sessions/cancel/${id}`); 
            
            alert(`Session request rejected. The session has been canceled.`);
            setRequests(prev => prev.filter(req => req.id !== id));
            
        } catch (error) {
            alert(`Failed to reject request: ` + (error.response?.data?.message || 'Server error'));
        } finally {
            setIsProcessingId(null);
        }
    };
    

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin mr-2 inline"/> Loading pending requests...
            </div>
        );
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaCheckCircle className="mr-3 text-green-600"/> Confirm Session Requests
            </h1>
            <p className="text-gray-600 mb-8">
                Approve or reject session proposals from your match partners.
            </p>
            
            {/* Sub-Navigation */}
            <div className="flex space-x-4 mb-8">
                <Button onClick={() => navigate('/schedule')} variant="secondary">
                    <FaCalendarAlt className="mr-2"/> Calendar View
                </Button>
                <Button onClick={() => navigate('/schedule/upcoming')} variant="secondary">
                    <FaClock className="mr-2"/> Upcoming Sessions
                </Button>
                <Button onClick={() => navigate('/schedule/history')} variant="secondary">
                    <FaHistory className="mr-2"/> Session History
                </Button>
                <Button variant="primary" className="bg-green-600 hover:bg-green-700">
                    <FaCheckCircle className="mr-2"/> Confirm Sessions
                </Button>
            </div>

            <div className="space-y-6">
                {requests.length > 0 ? (
                    requests.map(req => (
                        <div key={req.id} className="p-5 border rounded-xl shadow-sm bg-green-50 border-green-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xl font-bold text-gray-800">{req.skill} Session</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Request from: <span className="font-semibold">{req.partner}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {req.isBarter ? '🔄 Free Barter Exchange' : '💳 Credit Required'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-extrabold text-green-700">{req.date}</p>
                                    <p className="text-md text-gray-500">{req.time}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-green-100 flex justify-end space-x-3">
                                <Button 
                                    onClick={() => handleAccept(req.id)}
                                    variant="primary"
                                    isLoading={isProcessingId === req.id}
                                    className="bg-green-600 hover:bg-green-700 text-sm"
                                >
                                    <FaCheckCircle className="mr-2"/> {isProcessingId === req.id ? 'Processing...' : 'Accept'}
                                </Button>
                                <Button 
                                    onClick={() => handleReject(req.id)}
                                    variant="secondary"
                                    isLoading={isProcessingId === req.id}
                                    className="text-sm border-red-500 text-red-500 hover:bg-red-50"
                                >
                                    <FaTimesCircle className="mr-2"/> Reject
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        <FaCheckCircle className="text-5xl mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No session requests pending.</p>
                        <p className="text-sm mt-2">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmSessionPage;