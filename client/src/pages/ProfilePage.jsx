// client/src/pages/ProfilePage.jsx
//
// Dual-mode profile page:
//   /profile          → logged-in user's own editable profile  (GET /api/profile)
//   /profile/:userId  → any other user's read-only public profile (GET /api/profile/:userId)
//
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaEdit, FaMapMarkerAlt, FaStar, FaSpinner, FaUserCircle,
    FaCheckCircle, FaArrowLeft, FaChalkboardTeacher, FaBookReader,
} from 'react-icons/fa';
import api from '../api/axios';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth.jsx';
import useCredits from '../hooks/useCredits.jsx';

// ── helpers ───────────────────────────────────────────────────────────────────
const calcRatio = (teach = 0, learn = 0) => {
    if (teach === 0 && learn === 0) return 0;
    if (learn === 0) return 100;
    return ((teach / learn) * 100).toFixed(0);
};

// ── Skill chip ────────────────────────────────────────────────────────────────
const SkillChip = ({ name, level, color }) => (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${color}`}>
        <span className="font-semibold truncate">{name}</span>
        <span className="text-xs opacity-70 ml-2 shrink-0">{level}</span>
    </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }) => (
    <div className="text-center py-3 px-2">
        <div className="text-xl sm:text-2xl font-extrabold text-indigo-600">{value}</div>
        <div className="text-xs font-semibold text-gray-700 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const ProfilePage = () => {
    const { userId }            = useParams();          // present only on /profile/:userId
    const isOwnProfile          = !userId;              // no param → own profile
    const { user: authUser, setUser } = useAuth();
    const { isPremium }         = useCredits();
    const navigate              = useNavigate();

    const [profileData, setProfileData]     = useState(null);
    const [listing, setListing]             = useState(null);
    const [isEditing, setIsEditing]         = useState(false);
    const [isLoading, setIsLoading]         = useState(true);
    const [isUpdating, setIsUpdating]       = useState(false);
    const [updateMessage, setUpdateMessage] = useState(null);

    // Local edit state — only used when isOwnProfile
    const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' });

    // ── Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        setIsLoading(true);
        setIsEditing(false);
        setUpdateMessage(null);

        const fetchProfile = async () => {
            try {
                if (isOwnProfile) {
                    // Own profile — uses the existing authenticated endpoint
                    const res = await api.get('/profile');
                    setProfileData(res.data.profile);
                    setListing(res.data.listing);
                    setEditForm({
                        name:     res.data.profile.name     || '',
                        bio:      res.data.profile.bio      || '',
                        location: res.data.profile.location || '',
                    });
                    setUser(res.data.profile);
                } else {
                    // Public profile — new endpoint GET /api/profile/:userId
                    const res = await api.get(`/profile/${userId}`);
                    setProfileData(res.data.profile);
                    setListing(res.data.listing);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setProfileData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userId, isOwnProfile]);

    // ── Save own profile ──────────────────────────────────────────────────────
    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateMessage(null);
        try {
            const res = await api.put('/profile', editForm);
            setUser(res.data);
            setProfileData(prev => ({ ...prev, ...editForm }));
            setIsEditing(false);
            setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setUpdateMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
        } finally {
            setIsUpdating(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (isLoading) return (
        <div className="p-8 text-center text-gray-500">
            <FaSpinner className="animate-spin mr-2 inline text-indigo-500 text-2xl" />
            <span className="text-base">Loading profile…</span>
        </div>
    );

    if (!profileData) return (
        <div className="max-w-lg mx-auto p-8 text-center space-y-4">
            <FaUserCircle className="text-6xl text-gray-300 mx-auto" />
            <p className="text-gray-600 font-medium">Profile not found or you don't have permission to view it.</p>
            <Button onClick={() => navigate(-1)} variant="secondary">
                <FaArrowLeft className="mr-2" /> Go Back
            </Button>
        </div>
    );

    const teachSkills = listing?.skillsToTeach || [];
    const learnSkills = listing?.skillsToLearn || [];
    const ratio       = calcRatio(profileData.teachingCount, profileData.learningCount);
    const rating      = profileData.averageRating?.toFixed(1) ?? 'N/A';
    const reviews     = profileData.ratingCount ?? 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-8">

            {/* Back button for public profiles */}
            {!isOwnProfile && (
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                    <FaArrowLeft /> Back to matches
                </button>
            )}

            {/* ── Hero card ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                {/* Colour band */}
                <div className="h-20 sm:h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="px-4 sm:px-6 pb-6 -mt-10 sm:-mt-12">
                    {/* Avatar */}
                    <div className="flex items-end justify-between gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-white shadow-lg
                                        flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-indigo-600 shrink-0">
                            {profileData.name?.[0]?.toUpperCase() ?? '?'}
                        </div>

                        {isOwnProfile && (
                            <Button
                                onClick={() => setIsEditing(v => !v)}
                                variant="secondary"
                                className="mb-1 text-sm"
                            >
                                <FaEdit className="mr-1.5" />
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </Button>
                        )}
                    </div>

                    {/* Name + location */}
                    <div className="mt-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                                {profileData.name}
                            </h1>
                            {isPremium && isOwnProfile && (
                                <span className="flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                                    <FaCheckCircle className="shrink-0" /> PREMIUM
                                </span>
                            )}
                        </div>
                        {profileData.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <FaMapMarkerAlt className="shrink-0" /> {profileData.location}
                            </p>
                        )}
                    </div>

                    {/* Bio */}
                    {profileData.bio && !isEditing && (
                        <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
                            {profileData.bio}
                        </p>
                    )}

                    {/* Success / error message */}
                    {updateMessage && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${
                            updateMessage.type === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {updateMessage.text}
                        </div>
                    )}

                    {/* ── Inline edit form (own profile only) ─────────────────── */}
                    {isOwnProfile && isEditing && (
                        <form onSubmit={handleUpdate} className="mt-4 space-y-3 border-t pt-4">
                            <Input
                                label="Full Name"
                                name="name"
                                value={editForm.name}
                                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                required
                            />
                            <Input
                                label="Location"
                                name="location"
                                value={editForm.location}
                                onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                                icon={FaMapMarkerAlt}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About Me</label>
                                <textarea
                                    rows="4"
                                    maxLength={500}
                                    value={editForm.bio}
                                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm
                                               focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Tell others about yourself…"
                                />
                                <p className="text-xs text-right text-gray-400 mt-0.5">{editForm.bio.length}/500</p>
                            </div>
                            <Button type="submit" isLoading={isUpdating} variant="primary" className="w-full sm:w-auto">
                                {isUpdating ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Stats row ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm">
                <div className="grid grid-cols-3 divide-x">
                    <StatCard
                        label="Trust Score"
                        value={
                            <span className="flex items-center justify-center gap-1 text-yellow-500">
                                <FaStar className="text-lg" /> {rating}
                            </span>
                        }
                        sub={`${reviews} review${reviews !== 1 ? 's' : ''}`}
                    />
                    <StatCard
                        label="T/L Ratio"
                        value={`${ratio}%`}
                        sub="Teach vs. Learn"
                    />
                    <StatCard
                        label="Sessions"
                        value={(profileData.teachingCount ?? 0) + (profileData.learningCount ?? 0)}
                        sub="Total completed"
                    />
                </div>
            </div>

            {/* ── Skills ─────────────────────────────────────────────────────── */}
            {(teachSkills.length > 0 || learnSkills.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Teaches */}
                    {teachSkills.length > 0 && (
                        <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5 space-y-3">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FaChalkboardTeacher className="text-purple-500" /> Teaches
                            </h2>
                            {teachSkills.map((s, i) => (
                                <SkillChip key={i} name={s.name} level={s.level} color="bg-purple-50 text-purple-800" />
                            ))}
                        </div>
                    )}

                    {/* Wants to Learn */}
                    {learnSkills.length > 0 && (
                        <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5 space-y-3">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FaBookReader className="text-orange-500" /> Wants to Learn
                            </h2>
                            {learnSkills.map((s, i) => (
                                <SkillChip key={i} name={s.name} level={s.level} color="bg-orange-50 text-orange-800" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Reviews section ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    Peer Reviews
                </h2>
                <p className="text-gray-500 text-sm">
                    {reviews > 0
                        ? `${reviews} review${reviews !== 1 ? 's' : ''} from completed sessions.`
                        : 'No reviews yet. Reviews appear after completed skill exchange sessions.'}
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;