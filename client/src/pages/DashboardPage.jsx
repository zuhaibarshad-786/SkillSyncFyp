// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaBookReader, FaHeart, FaDollarSign, FaUserCircle } from 'react-icons/fa';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dashboardData, setDashboardData] = useState({
        name: user?.name || 'User',
        currentListing: null,
        pendingMatches: 0,
        unseenMessages: 0,
        trustScore: user?.averageRating || 0,
        isPaymentUser: user?.isPaymentUser || false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const profileResponse = await api.get('/profile');
                const profileData     = profileResponse.data.profile;
                const listingData     = profileResponse.data.listing;

                const matchesResponse = await api.get('/matches/suggestions');
                const matchesCount    = Array.isArray(matchesResponse.data) ? matchesResponse.data.length : 0;

                const chatResponse = await api.get('/chat/conversations');
                const unseenCount  = Array.isArray(chatResponse.data)
                    ? chatResponse.data.reduce((sum, chat) => sum + chat.unread, 0)
                    : 0;

                const topTeach = listingData?.skillsToTeach?.find(s => s.priority === 1)?.name;
                const topLearn = listingData?.skillsToLearn?.find(s => s.priority === 1)?.name;

                setDashboardData({
                    name: profileData.name,
                    currentListing: (listingData?.skillsToTeach?.length > 0 || listingData?.skillsToLearn?.length > 0)
                        ? {
                            teach:      topTeach || 'None set',
                            learn:      topLearn || 'None set',
                            teachCount: listingData.skillsToTeach?.length || 0,
                            learnCount: listingData.skillsToLearn?.length || 0,
                          }
                        : null,
                    pendingMatches:  matchesCount,
                    unseenMessages:  unseenCount,
                    trustScore:      profileData.averageRating,
                    isPaymentUser:   profileData.isPaymentUser,
                });
            } catch (err) {
                console.error('Dashboard data fetching failed:', err);
                setError(err.response?.data?.message || 'Failed to load dashboard data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user?._id) fetchDashboardData();
    }, [user?._id]);

    const StatusCard = ({ icon: Icon, title, value, color, linkTo }) => (
        <div
            className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg border-t-4 ${color.border} hover:shadow-xl transition-all duration-300 cursor-pointer`}
            onClick={() => navigate(linkTo)}
        >
            <div className="flex justify-between items-center">
                <div className="min-w-0 mr-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
                    <h2 className={`text-2xl sm:text-3xl font-bold ${color.text} mt-1 truncate`}>{value}</h2>
                </div>
                <Icon className={`text-3xl sm:text-4xl ${color.icon} shrink-0`} />
            </div>
            <p className="text-xs text-indigo-500 mt-3 font-medium hover:text-indigo-600">View Details &rarr;</p>
        </div>
    );

    if (isLoading) return <div className="p-8 text-center text-gray-600">Loading your skill hub...</div>;
    if (error)     return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

    const { currentListing, pendingMatches, unseenMessages, trustScore, name, isPaymentUser } = dashboardData;

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
                    Welcome back, {name}!
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mt-1">Your personal skill exchange hub.</p>
            </div>

            {/* Stat cards — 2 cols on small, 4 on large */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatusCard
                    icon={FaHeart}
                    title="New Matches"
                    value={pendingMatches}
                    color={{ border: 'border-pink-500', text: 'text-pink-600', icon: 'text-pink-400' }}
                    linkTo="/matching"
                />
                <StatusCard
                    icon={FaChalkboardTeacher}
                    title="Unseen Messages"
                    value={unseenMessages}
                    color={{ border: 'border-blue-500', text: 'text-blue-600', icon: 'text-blue-400' }}
                    linkTo="/chat"
                />
                <StatusCard
                    icon={FaUserCircle}
                    title="Trust Score"
                    value={`${trustScore?.toFixed(1) || 'N/A'} / 5`}
                    color={{ border: 'border-green-500', text: 'text-green-600', icon: 'text-green-400' }}
                    linkTo="/profile"
                />
                <StatusCard
                    icon={FaDollarSign}
                    title={isPaymentUser ? 'Payment Status' : 'Teaching Credits'}
                    value={isPaymentUser ? 'Active' : 'Unlimited'}
                    color={{ border: 'border-yellow-500', text: 'text-yellow-600', icon: 'text-yellow-400' }}
                    linkTo="/payments"
                />
            </div>

            <hr />

            {/* Skill overview + Quick actions — stacked on mobile, side-by-side on lg */}
            <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">

                {/* Skill overview */}
                <div className="lg:w-2/3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Skill Overview</h2>

                    {currentListing ? (
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-indigo-600">
                            {/* Stacked on mobile, side-by-side on sm+ */}
                            <div className="flex flex-col sm:flex-row sm:gap-6 gap-4">
                                <div className="sm:w-1/2 sm:border-r sm:pr-4">
                                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center">
                                        <FaChalkboardTeacher className="mr-2" /> Top Priority: Teach
                                    </h3>
                                    <p className="text-xl sm:text-2xl font-extrabold text-gray-800 truncate">
                                        {currentListing.teach}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        You have <strong>{currentListing.teachCount}</strong> skills listed to teach.
                                    </p>
                                </div>
                                <div className="sm:w-1/2">
                                    <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center">
                                        <FaBookReader className="mr-2" /> Top Priority: Learn
                                    </h3>
                                    <p className="text-xl sm:text-2xl font-extrabold text-gray-800 truncate">
                                        {currentListing.learn}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        You have <strong>{currentListing.learnCount}</strong> skills you want to learn.
                                    </p>
                                </div>
                            </div>
                            <button
                                className="mt-6 w-full py-2.5 sm:py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md text-sm sm:text-base"
                                onClick={() => navigate('/listing')}
                            >
                                Manage All Skills
                            </button>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl border-2 border-dashed border-yellow-300 text-center">
                            <p className="text-yellow-800 font-bold mb-4 text-sm sm:text-base">
                                Your profile is empty! Create a listing to start matching.
                            </p>
                            <button
                                className="py-2 px-6 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition text-sm sm:text-base"
                                onClick={() => navigate('/listing')}
                            >
                                Create Your Listing
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:w-1/3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-3">
                        <button
                            className="w-full text-left p-3 sm:p-4 rounded-lg flex items-center justify-between bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition group"
                            onClick={() => navigate('/matching')}
                        >
                            <div className="flex items-center gap-3">
                                <FaHeart className="text-red-500 group-hover:scale-110 transition shrink-0" />
                                <span className="font-bold text-sm sm:text-base">Browse Matches</span>
                            </div>
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold shrink-0">
                                {pendingMatches}
                            </span>
                        </button>
                        <button
                            className="w-full text-left p-3 sm:p-4 rounded-lg flex items-center gap-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition"
                            onClick={() => navigate('/chat')}
                        >
                            <FaChalkboardTeacher className="text-blue-500 shrink-0" />
                            <span className="font-bold text-sm sm:text-base">Chat History</span>
                        </button>
                        <button
                            className="w-full text-left p-3 sm:p-4 rounded-lg flex items-center gap-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 transition"
                            onClick={() => navigate('/schedule')}
                        >
                            <FaBookReader className="text-green-500 shrink-0" />
                            <span className="font-bold text-sm sm:text-base">My Schedule</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;