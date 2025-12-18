// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { FaEdit, FaMapMarkerAlt, FaStar, FaSpinner, FaUserCircle, FaCheckCircle } from 'react-icons/fa';
import api from '../api/axios';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth.jsx'; // Ensure .jsx
import useCredits from '../hooks/useCredits.jsx'; // 👈 NEW: For premium status

const ProfilePage = () => {
    const { user, setUser } = useAuth();
    const { isPremium, isTeachingOnly } = useCredits(); // Use credit/role context
    
    const [profileData, setProfileData] = useState({ 
        name: user?.name || '', 
        bio: user?.bio || '', 
        location: user?.location || '',
        // Initialize contribution metrics if available in user context
        teachingCount: user?.teachingCount || 0,
        learningCount: user?.learningCount || 0,
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState(null);


    // --- Data Fetching on Mount ---
    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                // API Call: GET /api/profile (Returns user profile and potentially listing)
                const response = await api.get('/profile');
                const fetchedProfile = response.data.profile;
                
                // Update local state and AuthContext user state for consistency
                setProfileData({
                    name: fetchedProfile.name || '',
                    bio: fetchedProfile.bio || '',
                    location: fetchedProfile.location || '',
                    teachingCount: fetchedProfile.teachingCount || 0,
                    learningCount: fetchedProfile.learningCount || 0,
                });
                // Ensure AuthContext is up-to-date with non-sensitive fields
                setUser(fetchedProfile); 

            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [setUser]); 


    // --- Update Handler ---
    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setUpdateMessage(null);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateMessage(null);
        
        try {
            // API Call: PUT /api/profile
            const response = await api.put('/profile', {
                name: profileData.name,
                bio: profileData.bio,
                location: profileData.location
            });
            
            // Update AuthContext and local state
            setUser(response.data); 
            setIsEditing(false);
            setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });

        } catch (error) {
            setUpdateMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setIsUpdating(false);
        }
    };


    // --- Utility: Calculate Ratio (Reputation System) ---
    const calculateRatio = () => {
        const teach = profileData.teachingCount;
        const learn = profileData.learningCount;
        if (learn === 0 && teach === 0) return 0;
        if (learn === 0) return 100; // Arbitrarily high if only teaching
        return ((teach / learn) * 100).toFixed(0);
    };
    
    const ratio = calculateRatio();


    if (isLoading) {
        return <div className="p-8 text-center"><FaSpinner className="animate-spin mr-2 inline"/> Loading profile...</div>;
    }


    return (
        <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
            
            {updateMessage && (
                <div className={`p-3 mb-4 rounded-lg ${updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {updateMessage.text}
                </div>
            )}
            
            {/* --- 1. Trust and Reputation Metrics --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
                
                {/* Average Rating */}
                <div className="text-center border-r md:border-r-0">
                    <div className="flex items-center justify-center text-2xl text-yellow-500 font-extrabold">
                        <FaStar className="mr-2"/> {user.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                    <p className="text-sm text-gray-600">Trust Score ({user.ratingCount || 0} Reviews)</p>
                </div>
                
                {/* Teaching to Learning Ratio */}
                <div className="text-center border-r">
                    <div className="text-2xl font-extrabold text-indigo-600">{ratio}%</div>
                    <p className="text-sm text-gray-600">Contribution Ratio (Teach/Learn)</p>
                </div>

                {/* Premium Status */}
                <div className="text-center">
                    <div className={`text-sm font-bold ${isPremium ? 'text-yellow-600' : 'text-gray-400'} flex items-center justify-center`}>
                        {isPremium && <FaCheckCircle className="mr-1"/>}
                        {isPremium ? 'PREMIUM USER' : 'BASIC ACCOUNT'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">High visibility, faster matching.</p>
                </div>
            </div>

            {/* --- 2. Profile Display/Edit Toggle --- */}
            <Button onClick={() => setIsEditing(!isEditing)} variant="secondary" className="mt-4 mb-6">
                <FaEdit className="mr-2"/> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
            

            {/* --- 3. Profile Details Form --- */}
            <form onSubmit={handleUpdate} className="space-y-4">
                <div className="flex items-center space-x-4">
                    <FaUserCircle className="w-12 h-12 text-gray-400"/>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Editing Details' : profileData.name}
                    </h2>
                </div>

                <Input
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                />
                
                <Input
                    label="Location"
                    name="location"
                    icon={FaMapMarkerAlt}
                    value={profileData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                />
                
                {/* Bio/Description Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio/About Me</label>
                    <textarea
                        name="bio"
                        rows="4"
                        value={profileData.bio}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        maxLength={500}
                        disabled={!isEditing}
                    />
                </div>
                
                {isEditing && (
                    <Button type="submit" isLoading={isUpdating} variant="primary">
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </form>
            
            {/* --- 4. Reviews Placeholder (Session and Feedback) --- */}
            <div className="mt-10 pt-6 border-t">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Peer Reviews</h2>
                <p className="text-gray-600">
                    Your reputation is built through peer reviews. (Reviews for completed sessions will appear here.)
                </p>
                {/* Placeholder for fetching and displaying reviews (GET /api/profile/reviews) */}
            </div>
            
        </div>
    );
};

export default ProfilePage;