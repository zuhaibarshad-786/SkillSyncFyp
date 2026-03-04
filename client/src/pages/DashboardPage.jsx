// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaBookReader, FaHeart, FaDollarSign, FaUserCircle } from 'react-icons/fa';
import api from '../api/axios'; // Configured Axios instance
import useAuth from '../hooks/useAuth'; // Custom Auth Hook

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get authenticated user data from context

    const [dashboardData, setDashboardData] = useState({
        name: user?.name || 'User',
        currentListing: null,
        pendingMatches: 0,
        unseenMessages: 0,
        trustScore: user?.averageRating || 0,
        isPaymentUser: user?.isPaymentUser || false,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // 1. Fetch User Profile and Current Listing
                const profileResponse = await api.get('/profile');
                const profileData = profileResponse.data.profile;
                const listingData = profileResponse.data.listing;

                // 2. Fetch Match Count
                const matchesResponse = await api.get('/matches/suggestions');
                const matchesCount = Array.isArray(matchesResponse.data) 
                    ? matchesResponse.data.length 
                    : 0;

                // 3. Fetch Unseen Message Count
                const chatResponse = await api.get('/chat/conversations');
                const unseenCount = Array.isArray(chatResponse.data) 
                    ? chatResponse.data.reduce((sum, chat) => sum + chat.unread, 0)
                    : 0;

                // --- PRIORITY LOGIC UPDATE ---
                // We extract the name of the skill marked as Priority 1
                const topTeach = listingData?.skillsToTeach?.find(s => s.priority === 1)?.name;
                const topLearn = listingData?.skillsToLearn?.find(s => s.priority === 1)?.name;

                setDashboardData({
                    name: profileData.name,
                    currentListing: (listingData?.skillsToTeach?.length > 0 || listingData?.skillsToLearn?.length > 0) 
                        ? {
                            teach: topTeach || 'None set',
                            learn: topLearn || 'None set',
                            teachCount: listingData.skillsToTeach?.length || 0,
                            learnCount: listingData.skillsToLearn?.length || 0
                          } 
                        : null,
                    pendingMatches: matchesCount,
                    unseenMessages: unseenCount,
                    trustScore: profileData.averageRating,
                    isPaymentUser: profileData.isPaymentUser,
                });

            } catch (err) {
                console.error("Dashboard data fetching failed:", err);
                setError(err.response?.data?.message || "Failed to load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user?._id) {
            fetchDashboardData();
        }
    }, [user?._id]);

    const StatusCard = ({ icon: Icon, title, value, color, linkTo }) => (
        <div 
            className={`bg-white p-6 rounded-xl shadow-lg border-t-4 ${color.border} hover:shadow-xl transition-all duration-300 cursor-pointer`}
            onClick={() => navigate(linkTo)}
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h2 className={`text-3xl font-bold ${color.text} mt-1`}>{value}</h2>
                </div>
                <Icon className={`text-4xl ${color.icon}`} />
            </div>
            <p className="text-xs text-indigo-500 mt-3 font-medium hover:text-indigo-600">View Details &rarr;</p>
        </div>
    );

    if (isLoading) {
        return <div className="p-8 text-center text-gray-600">Loading your skill hub...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
    }

    const { currentListing, pendingMatches, unseenMessages, trustScore, name, isPaymentUser } = dashboardData;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                Welcome back, {name}!
            </h1>
            <p className="text-lg text-gray-600 mb-10">Your personal skill exchange hub.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                    value={`${trustScore?.toFixed(1) || 'N/A'} / 5.0`}
                    color={{ border: 'border-green-500', text: 'text-green-600', icon: 'text-green-400' }}
                    linkTo="/profile"
                />
                 <StatusCard
                    icon={FaDollarSign}
                    title={isPaymentUser ? "Payment Status" : "Teaching Credits"}
                    value={isPaymentUser ? "Active" : "Unlimited"}
                    color={{ border: 'border-yellow-500', text: 'text-yellow-600', icon: 'text-yellow-400' }}
                    linkTo="/payments"
                />
            </div>

            <hr className="mb-10"/>

            <div className="lg:flex lg:space-x-8">
                <div className="lg:w-2/3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Skill Overview</h2>
                    
                    {currentListing ? (
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-600">
                            <div className="flex space-x-6">
                                {/* Teach Section */}
                                <div className="w-1/2 border-r pr-4">
                                    <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center">
                                        <FaChalkboardTeacher className="mr-2"/> Top Priority: Teach
                                    </h3>
                                    <p className="text-2xl font-extrabold text-gray-800 truncate">{currentListing.teach}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        You have <strong>{currentListing.teachCount}</strong> skills listed to teach.
                                    </p>
                                </div>

                                {/* Learn Section */}
                                <div className="w-1/2">
                                    <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center">
                                        <FaBookReader className="mr-2"/> Top Priority: Learn
                                    </h3>
                                    <p className="text-2xl font-extrabold text-gray-800 truncate">{currentListing.learn}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        You have <strong>{currentListing.learnCount}</strong> skills you want to learn.
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="mt-8 w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                                onClick={() => navigate('/listing')}
                            >
                                Manage All Skills
                            </button>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-8 rounded-xl border-2 border-dashed border-yellow-300 text-center">
                            <p className="text-yellow-800 font-bold mb-4">
                                Your profile is empty! Create a listing to start matching.
                            </p>
                            <button 
                                className="py-2 px-6 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition"
                                onClick={() => navigate('/listing')}
                            >
                                Create Your Listing
                            </button>
                        </div>
                    )}
                </div>

                <div className="lg:w-1/3 mt-8 lg:mt-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <button 
                            className="w-full text-left p-4 rounded-lg flex items-center justify-between bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition group"
                            onClick={() => navigate('/matching')}
                        >
                            <div className="flex items-center space-x-3">
                                <FaHeart className="text-red-500 group-hover:scale-110 transition"/> 
                                <span className="font-bold">Browse Matches</span>
                            </div>
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">{pendingMatches}</span>
                        </button>
                        <button 
                            className="w-full text-left p-4 rounded-lg flex items-center space-x-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition"
                            onClick={() => navigate('/chat')}
                        >
                            <FaChalkboardTeacher className="text-blue-500"/> <span className="font-bold">Chat History</span>
                        </button>
                        <button 
                            className="w-full text-left p-4 rounded-lg flex items-center space-x-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 transition"
                            onClick={() => navigate('/schedule')}
                        >
                            <FaBookReader className="text-green-500"/> <span className="font-bold">My Schedule</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;