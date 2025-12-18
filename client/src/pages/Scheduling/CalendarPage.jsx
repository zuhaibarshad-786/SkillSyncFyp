// client/src/pages/Scheduling/CalendarPage.jsx (FIXED - Real-time Updates)
import React, { useState, useEffect } from 'react';
import { FaCalendarPlus, FaClock, FaHistory, FaCheckCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/axios';

const CalendarPage = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllSessions = async () => {
        setIsLoading(true);
        try {
            const [upcomingRes, historyRes] = await Promise.all([
                api.get('/sessions/upcoming'),
                api.get('/sessions/history')
            ]);
            
            const allSessions = [...upcomingRes.data, ...historyRes.data];
            
            setSessions(allSessions.map(session => ({
                id: session._id,
                scheduledAt: new Date(session.scheduledAt),
                title: session.skill,
                status: session.status,
                partner: session.teacher?.name || session.learner?.name || 'Unknown',
            })));
        } catch (error) {
            console.error("Error fetching all sessions:", error);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllSessions();
    }, []);

    // 🚨 CRITICAL: Listen for real-time session updates
    useEffect(() => {
        if (!socket) return;

        const handleSessionUpdate = (data) => {
            console.log('📢 Session update on calendar:', data);
            fetchAllSessions();
        };

        socket.on('newSessionRequest', handleSessionUpdate);
        socket.on('sessionScheduled', handleSessionUpdate);
        socket.on('sessionCanceled', handleSessionUpdate);
        socket.on('sessionFinalized', handleSessionUpdate);

        return () => {
            socket.off('newSessionRequest', handleSessionUpdate);
            socket.off('sessionScheduled', handleSessionUpdate);
            socket.off('sessionCanceled', handleSessionUpdate);
            socket.off('sessionFinalized', handleSessionUpdate);
        };
    }, [socket]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDay = firstDayOfMonth.getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { startDay, daysInMonth, year, month };
    };

    const { startDay, daysInMonth, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarDays = [];
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }
    
    const getSessionsForDay = (day) => {
        return sessions.filter(session => {
            const sessionDay = session.scheduledAt.getDate();
            const sessionMonth = session.scheduledAt.getMonth();
            const sessionYear = session.scheduledAt.getFullYear();
            
            return sessionDay === day && sessionMonth === month && sessionYear === year;
        });
    };
    
    if (isLoading) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading calendar data...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FaCalendarPlus className="mr-3 text-indigo-600"/> Session Scheduler
            </h1>
            <p className="text-gray-600 mb-8">
                View your scheduled sessions and coordinate new times with your match partners.
            </p>

            <div className="flex space-x-4 mb-8">
                <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
                    <FaCalendarPlus className="mr-2"/> Calendar View
                </Button>
                <Button onClick={() => navigate('/schedule/upcoming')} variant="secondary">
                    <FaClock className="mr-2"/> Upcoming Sessions
                </Button>
                <Button onClick={() => navigate('/schedule/history')} variant="secondary">
                    <FaHistory className="mr-2"/> Session History
                </Button>
                <Button onClick={() => navigate('/schedule/confirm')} variant="secondary">
                    <FaCheckCircle className="mr-2"/> Confirm Sessions
                </Button>
            </div>

            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-t-lg mb-4">
                <Button onClick={() => setCurrentDate(new Date(year, month - 1))} variant="tertiary" className="text-gray-700"><FaChevronLeft/></Button>
                <h2 className="text-xl font-semibold text-gray-800">{monthName}</h2>
                <Button onClick={() => setCurrentDate(new Date(year, month + 1))} variant="tertiary" className="text-gray-700"><FaChevronRight/></Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-600 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                    <div 
                        key={index}
                        className={`min-h-24 p-1 border rounded-lg overflow-y-auto ${
                            day !== null ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 border-dashed'
                        }`}
                    >
                        {day !== null && (
                            <>
                                <p className="text-sm font-bold text-gray-800">{day}</p>
                                {getSessionsForDay(day).map(session => (
                                    <div 
                                        key={session.id}
                                        className={`mt-1 p-1 rounded-md text-xs cursor-pointer hover:shadow-lg transition ${
                                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                            session.status === 'rated' ? 'bg-green-100 text-green-800' :
                                            session.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}
                                        onClick={() => navigate('/schedule/upcoming')}
                                    >
                                        <p className="font-medium truncate">{session.title}</p>
                                        <p className="text-[10px]">{session.partner}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarPage;