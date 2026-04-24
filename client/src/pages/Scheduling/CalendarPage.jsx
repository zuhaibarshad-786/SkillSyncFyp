// client/src/pages/Scheduling/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarPlus, FaClock, FaHistory, FaCheckCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/axios';

const CalendarPage = () => {
    const navigate     = useNavigate();
    const { socket }   = useSocket();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions]       = useState([]);
    const [isLoading, setIsLoading]     = useState(true);

    const fetchAllSessions = async () => {
        setIsLoading(true);
        try {
            const [upcomingRes, historyRes] = await Promise.all([
                api.get('/sessions/upcoming'),
                api.get('/sessions/history'),
            ]);
            const allSessions = [...upcomingRes.data, ...historyRes.data];
            setSessions(allSessions.map(session => ({
                id:          session._id,
                scheduledAt: new Date(session.scheduledAt),
                title:       session.skill,
                status:      session.status,
                partner:     session.teacher?.name || session.learner?.name || 'Unknown',
            })));
        } catch (error) {
            console.error('Error fetching all sessions:', error);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAllSessions(); }, []);

    useEffect(() => {
        if (!socket) return;
        const handleSessionUpdate = () => fetchAllSessions();
        socket.on('newSessionRequest',  handleSessionUpdate);
        socket.on('sessionScheduled',   handleSessionUpdate);
        socket.on('sessionCanceled',    handleSessionUpdate);
        socket.on('sessionFinalized',   handleSessionUpdate);
        return () => {
            socket.off('newSessionRequest',  handleSessionUpdate);
            socket.off('sessionScheduled',   handleSessionUpdate);
            socket.off('sessionCanceled',    handleSessionUpdate);
            socket.off('sessionFinalized',   handleSessionUpdate);
        };
    }, [socket]);

    const getDaysInMonth = (date) => {
        const year  = date.getFullYear();
        const month = date.getMonth();
        return {
            startDay:    new Date(year, month, 1).getDay(),
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            year,
            month,
        };
    };

    const { startDay, daysInMonth, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarDays = [
        ...Array(startDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const getSessionsForDay = (day) =>
        sessions.filter(s => {
            const d = s.scheduledAt;
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="animate-spin mr-2 inline" /> Loading calendar data...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaCalendarPlus className="text-indigo-600 shrink-0" /> Session Scheduler
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    View your scheduled sessions and coordinate new times.
                </p>
            </div>

            {/* Nav buttons — scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Button variant="primary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaCalendarPlus className="mr-1.5" /> Calendar
                </Button>
                <Button onClick={() => navigate('/schedule/upcoming')} variant="secondary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaClock className="mr-1.5" /> Upcoming
                </Button>
                <Button onClick={() => navigate('/schedule/history')} variant="secondary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaHistory className="mr-1.5" /> History
                </Button>
                <Button onClick={() => navigate('/schedule/confirm')} variant="secondary" className="whitespace-nowrap text-xs sm:text-sm shrink-0">
                    <FaCheckCircle className="mr-1.5" /> Confirm
                </Button>
            </div>

            {/* Month navigation */}
            <div className="flex justify-between items-center bg-gray-100 p-3 sm:p-4 rounded-t-lg">
                <Button
                    onClick={() => setCurrentDate(new Date(year, month - 1))}
                    variant="tertiary"
                    className="text-gray-700 p-2"
                >
                    <FaChevronLeft />
                </Button>
                <h2 className="text-base sm:text-xl font-semibold text-gray-800">{monthName}</h2>
                <Button
                    onClick={() => setCurrentDate(new Date(year, month + 1))}
                    variant="tertiary"
                    className="text-gray-700 p-2"
                >
                    <FaChevronRight />
                </Button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center font-bold text-gray-500 text-[10px] sm:text-sm -mt-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="py-1">{d}</div>
                ))}
            </div>

            {/* Calendar grid — horizontally scrollable on very small screens */}
            <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[300px]">
                    {calendarDays.map((day, index) => {
                        const daySessions = day ? getSessionsForDay(day) : [];
                        return (
                            <div
                                key={index}
                                className={`min-h-[60px] sm:min-h-24 p-0.5 sm:p-1 border rounded-lg overflow-hidden ${
                                    day !== null ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 border-dashed'
                                }`}
                            >
                                {day !== null && (
                                    <>
                                        <p className="text-[10px] sm:text-sm font-bold text-gray-700 leading-tight">{day}</p>
                                        {daySessions.map(session => (
                                            <div
                                                key={session.id}
                                                onClick={() => navigate('/schedule/upcoming')}
                                                className={`mt-0.5 sm:mt-1 p-0.5 sm:p-1 rounded text-[9px] sm:text-xs cursor-pointer truncate ${
                                                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    session.status === 'rated'     ? 'bg-green-100 text-green-800' :
                                                    session.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                <span className="hidden sm:inline">{session.title}</span>
                                                <span className="sm:hidden">●</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;