// client/src/pages/ListingPage.jsx
import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaBookReader, FaSave } from 'react-icons/fa';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const skillLevels = ['Beginner', 'Intermediate', 'Expert'];

const ListingPage = () => {
    const { user } = useAuth();
    const [listing, setListing] = useState({
        skillToTeach: { name: '', level: 'Beginner', description: '' },
        skillToLearn: { name: '', level: 'Beginner', description: '' },
    });
    const [skillsList, setSkillsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // --- Fetch Master Skills List and Current Listing ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch master skill list for dropdown/autocomplete
                // const skillsRes = await api.get('/skills');
                // setSkillsList(skillsRes.data.map(s => s.name));
                setSkillsList(['React', 'Node.js', 'Advanced Spanish', 'Photography', 'Financial Modeling']); // Mock data

                // 2. Fetch current listing
                const listingRes = await api.get('/api/profile'); // Assuming profile endpoint returns listing
                setListing(listingRes.data.listing || listing);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e, type) => {
        const { name, value } = e.target;
        setListing(prev => ({
            ...prev,
            [type]: { ...prev[type], [name]: value }
        }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            await api.post('/profile/listing', listing);
            setMessage('Skill listing saved successfully!');
        } catch (error) {
            setMessage('Error saving listing. Please try again.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Simple filter for suggestion list
    const filterSkills = (currentName) => {
        if (!currentName) return skillsList;
        return skillsList.filter(s => 
            s.toLowerCase().includes(currentName.toLowerCase()) && 
            s !== listing.skillToTeach.name && 
            s !== listing.skillToLearn.name
        );
    };


    if (isLoading) {
        return <div className="p-8 text-center">Loading listing data...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Your Skill Exchange Listing
            </h1>
            <p className="text-gray-600 mb-8">
                Define what you can offer and what you hope to gain. This is used by the complementary matching engine.
            </p>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* --- I WANT TO TEACH --- */}
                    <div className="border p-6 rounded-lg bg-indigo-50 border-indigo-200">
                        <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
                            <FaChalkboardTeacher className="mr-3"/> I Can Teach
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Skill Name"
                                name="name"
                                value={listing.skillToTeach.name}
                                onChange={(e) => handleChange(e, 'skillToTeach')}
                                placeholder="e.g., Python, Piano, Yoga"
                                required
                            />
                            {/* Simple Dropdown for Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Expertise Level
                                </label>
                                <select
                                    name="level"
                                    value={listing.skillToTeach.level}
                                    onChange={(e) => handleChange(e, 'skillToTeach')}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {skillLevels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Text Area for Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (What exactly will you teach?)
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={listing.skillToTeach.description}
                                    onChange={(e) => handleChange(e, 'skillToTeach')}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    maxLength={500}
                                    placeholder="Briefly describe the scope of your instruction."
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- I WANT TO LEARN --- */}
                    <div className="border p-6 rounded-lg bg-purple-50 border-purple-200">
                        <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
                            <FaBookReader className="mr-3"/> I Want to Learn
                        </h2>
                         <div className="space-y-4">
                            <Input
                                label="Skill Name"
                                name="name"
                                value={listing.skillToLearn.name}
                                onChange={(e) => handleChange(e, 'skillToLearn')}
                                placeholder="e.g., Mandarin, Web Design, Cooking"
                                required
                            />
                            {/* Simple Dropdown for Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Proficiency Level
                                </label>
                                <select
                                    name="level"
                                    value={listing.skillToLearn.level}
                                    onChange={(e) => handleChange(e, 'skillToLearn')}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {skillLevels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Text Area for Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Why do you want to learn this?)
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={listing.skillToLearn.description}
                                    onChange={(e) => handleChange(e, 'skillToLearn')}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    maxLength={500}
                                    placeholder="Describe your learning goal to find the best match."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg font-medium ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="text-center">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        className="text-lg px-10 py-3"
                    >
                        <FaSave className="mr-2"/> Save Listing & Find Matches
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ListingPage;