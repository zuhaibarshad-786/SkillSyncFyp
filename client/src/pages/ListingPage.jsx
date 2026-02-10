// // client/src/pages/ListingPage.jsx
// import React, { useState, useEffect } from 'react';
// import { FaChalkboardTeacher, FaBookReader, FaSave } from 'react-icons/fa';
// import Input from '../components/common/Input';
// import Button from '../components/common/Button';
// import api from '../api/axios';
// import useAuth from '../hooks/useAuth';

// const skillLevels = ['Beginner', 'Intermediate', 'Expert'];

// const ListingPage = () => {
//     const { user } = useAuth();
//     const [listing, setListing] = useState({
//         skillToTeach: { name: '', level: 'Beginner', description: '' },
//         skillToLearn: { name: '', level: 'Beginner', description: '' },
//     });
//     const [skillsList, setSkillsList] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [message, setMessage] = useState('');

//     // --- Fetch Master Skills List and Current Listing ---
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 // 1. Fetch master skill list for dropdown/autocomplete
//                 // const skillsRes = await api.get('/skills');
//                 // setSkillsList(skillsRes.data.map(s => s.name));
//                 setSkillsList(['React', 'Node.js', 'Advanced Spanish', 'Photography', 'Financial Modeling']); // Mock data

//                 // 2. Fetch current listing
//                 const listingRes = await api.get('/api/profile'); // Assuming profile endpoint returns listing
//                 setListing(listingRes.data.listing || listing);

//             } catch (error) {
//                 console.error("Error fetching data:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, []);

//     const handleChange = (e, type) => {
//         const { name, value } = e.target;
//         setListing(prev => ({
//             ...prev,
//             [type]: { ...prev[type], [name]: value }
//         }));
//         setMessage('');
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsSubmitting(true);
//         setMessage('');

//         try {
//             await api.post('/profile/listing', listing);
//             setMessage('Skill listing saved successfully!');
//         } catch (error) {
//             setMessage('Error saving listing. Please try again.');
//             console.error(error);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
    
//     // Simple filter for suggestion list
//     const filterSkills = (currentName) => {
//         if (!currentName) return skillsList;
//         return skillsList.filter(s => 
//             s.toLowerCase().includes(currentName.toLowerCase()) && 
//             s !== listing.skillToTeach.name && 
//             s !== listing.skillToLearn.name
//         );
//     };


//     if (isLoading) {
//         return <div className="p-8 text-center">Loading listing data...</div>;
//     }

//     return (
//         <div className="p-6 bg-white min-h-full rounded-lg shadow-xl">
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">
//                 Your Skill Exchange Listing
//             </h1>
//             <p className="text-gray-600 mb-8">
//                 Define what you can offer and what you hope to gain. This is used by the complementary matching engine.
//             </p>

//             <form onSubmit={handleSubmit} className="space-y-10">
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
//                     {/* --- I WANT TO TEACH --- */}
//                     <div className="border p-6 rounded-lg bg-indigo-50 border-indigo-200">
//                         <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center">
//                             <FaChalkboardTeacher className="mr-3"/> I Can Teach
//                         </h2>

//                         <div className="space-y-4">
//                             <Input
//                                 label="Skill Name"
//                                 name="name"
//                                 value={listing.skillToTeach.name}
//                                 onChange={(e) => handleChange(e, 'skillToTeach')}
//                                 placeholder="e.g., Python, Piano, Yoga"
//                                 required
//                             />
//                             {/* Simple Dropdown for Level */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Your Expertise Level
//                                 </label>
//                                 <select
//                                     name="level"
//                                     value={listing.skillToTeach.level}
//                                     onChange={(e) => handleChange(e, 'skillToTeach')}
//                                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
//                                 >
//                                     {skillLevels.map(level => (
//                                         <option key={level} value={level}>{level}</option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Text Area for Description */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Description (What exactly will you teach?)
//                                 </label>
//                                 <textarea
//                                     name="description"
//                                     rows="3"
//                                     value={listing.skillToTeach.description}
//                                     onChange={(e) => handleChange(e, 'skillToTeach')}
//                                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
//                                     maxLength={500}
//                                     placeholder="Briefly describe the scope of your instruction."
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* --- I WANT TO LEARN --- */}
//                     <div className="border p-6 rounded-lg bg-purple-50 border-purple-200">
//                         <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
//                             <FaBookReader className="mr-3"/> I Want to Learn
//                         </h2>
//                          <div className="space-y-4">
//                             <Input
//                                 label="Skill Name"
//                                 name="name"
//                                 value={listing.skillToLearn.name}
//                                 onChange={(e) => handleChange(e, 'skillToLearn')}
//                                 placeholder="e.g., Mandarin, Web Design, Cooking"
//                                 required
//                             />
//                             {/* Simple Dropdown for Level */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Target Proficiency Level
//                                 </label>
//                                 <select
//                                     name="level"
//                                     value={listing.skillToLearn.level}
//                                     onChange={(e) => handleChange(e, 'skillToLearn')}
//                                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
//                                 >
//                                     {skillLevels.map(level => (
//                                         <option key={level} value={level}>{level}</option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Text Area for Description */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Description (Why do you want to learn this?)
//                                 </label>
//                                 <textarea
//                                     name="description"
//                                     rows="3"
//                                     value={listing.skillToLearn.description}
//                                     onChange={(e) => handleChange(e, 'skillToLearn')}
//                                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
//                                     maxLength={500}
//                                     placeholder="Describe your learning goal to find the best match."
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {message && (
//                     <div className={`p-4 rounded-lg font-medium ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
//                         {message}
//                     </div>
//                 )}

//                 <div className="text-center">
//                     <Button
//                         type="submit"
//                         variant="primary"
//                         isLoading={isSubmitting}
//                         className="text-lg px-10 py-3"
//                     >
//                         <FaSave className="mr-2"/> Save Listing & Find Matches
//                     </Button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default ListingPage;

import React, { useState, useEffect, useRef } from 'react';
import { 
    FaChalkboardTeacher, 
    FaBookReader, 
    FaSave, 
    FaSearch, 
    FaTimes, 
    FaChevronDown, 
    FaChevronUp 
} from 'react-icons/fa';
import Button from '../components/common/Button';
import api from '../api/axios';

const skillLevels = ['Beginner', 'Intermediate', 'Expert'];
const MAX_SKILLS = 3;

const ListingPage = () => {
    const [skillsToTeach, setSkillsToTeach] = useState([]);
    const [skillsToLearn, setSkillsToLearn] = useState([]);
    const [masterSkills, setMasterSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState({ teach: '', learn: '' });
    const [dropdownOpen, setDropdownOpen] = useState({ teach: false, learn: false });
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const teachRef = useRef(null);
    const learnRef = useRef(null);

    /* -------------------- Fetch Data -------------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [skillsRes, profileRes] = await Promise.all([
                    api.get('/skills'),
                    api.get('/profile')
                ]);

                setMasterSkills(skillsRes.data);

                if (profileRes.data.listing) {
                    setSkillsToTeach(profileRes.data.listing.skillsToTeach || []);
                    setSkillsToLearn(profileRes.data.listing.skillsToLearn || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    /* -------------------- Close Dropdown on Outside Click -------------------- */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                teachRef.current && !teachRef.current.contains(e.target) &&
                learnRef.current && !learnRef.current.contains(e.target)
            ) {
                setDropdownOpen({ teach: false, learn: false });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* -------------------- Add Skill -------------------- */
    const addSkill = (skill, type) => {
        const list = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;

        if (list.length >= MAX_SKILLS) {
            setMessage({ text: 'Maximum 3 skills allowed.', type: 'error' });
            return;
        }
        if (list.find(s => s.skillId === skill._id)) return;

        setList([
            ...list,
            {
                skillId: skill._id,
                name: skill.name,
                level: 'Beginner',
                priority: list.length + 1
            }
        ]);

        setSearchTerm(prev => ({ ...prev, [type]: '' }));
        setDropdownOpen(prev => ({ ...prev, [type]: false }));
        setMessage({ text: '', type: '' });
    };

    /* -------------------- Remove Skill -------------------- */
    const removeSkill = (id, type) => {
        const list = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;

        const updated = list
            .filter(s => s.skillId !== id)
            .map((s, i) => ({ ...s, priority: i + 1 }));

        setList(updated);
    };

    /* -------------------- Update Level -------------------- */
    const updateLevel = (id, level, type) => {
        const list = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;

        setList(list.map(s => s.skillId === id ? { ...s, level } : s));
    };

    /* -------------------- Submit -------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/listing', { skillsToTeach, skillsToLearn });
            setMessage({ text: 'Listing saved successfully!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Save failed.', type: 'error' });
        }
    };

    /* -------------------- Skill Selector Component -------------------- */
    const SkillSelector = ({ type, title, icon: Icon, selectedSkills, refProp }) => {
        const filtered = masterSkills.filter(s =>
            s.name.toLowerCase().includes(searchTerm[type].toLowerCase())
        );

        return (
            <div ref={refProp} className="border rounded-lg p-6 bg-gray-50">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Icon className="mr-2" /> {title}
                </h2>

                {/* Search Input */}
                <div className="relative mb-4">
                    <div className="flex items-center border rounded-lg bg-white">
                        <FaSearch className="ml-3 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm[type]}
                            onChange={(e) =>
                                setSearchTerm(prev => ({ ...prev, [type]: e.target.value }))
                            }
                            onFocus={() =>
                                setDropdownOpen(prev => ({ ...prev, [type]: true }))
                            }
                            placeholder="Select approved skills..."
                            className="flex-1 px-3 py-2 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setDropdownOpen(prev => ({ ...prev, [type]: !prev[type] }))
                            }
                            className="px-3 text-gray-500"
                        >
                            {dropdownOpen[type] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                    </div>

                    {/* Dropdown */}
                    {dropdownOpen[type] && (
                        <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="p-3 text-sm text-red-500">
                                    Skill not found in approved list.
                                </p>
                            ) : filtered.map(skill => (
                                <div
                                    key={skill._id}
                                    onClick={() => addSkill(skill, type)}
                                    className="px-4 py-2 cursor-pointer hover:bg-indigo-50 border-b last:border-0"
                                >
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Skills */}
                <div className="space-y-3">
                    {selectedSkills.length === 0 && (
                        <p className="text-sm text-gray-500">No skills selected.</p>
                    )}
                    {selectedSkills.map(s => (
                        <div key={s.skillId} className="bg-white border rounded p-3">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">
                                    Priority {s.priority}: {s.name}
                                </span>
                                <button
                                    onClick={() => removeSkill(s.skillId, type)}
                                    className="text-red-500"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <select
                                value={s.level}
                                onChange={(e) =>
                                    updateLevel(s.skillId, e.target.value, type)
                                }
                                className="mt-2 border rounded px-2 py-1 text-sm"
                            >
                                {skillLevels.map(l => (
                                    <option key={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-6 bg-white rounded-lg min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Your Skill Exchange Listing</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SkillSelector
                        type="teach"
                        title="I Can Teach (Max 3)"
                        icon={FaChalkboardTeacher}
                        selectedSkills={skillsToTeach}
                        refProp={teachRef}
                    />
                    <SkillSelector
                        type="learn"
                        title="I Want to Learn (Max 3)"
                        icon={FaBookReader}
                        selectedSkills={skillsToLearn}
                        refProp={learnRef}
                    />
                </div>

                {message.text && (
                    <div className={`p-4 rounded ${
                        message.type === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="text-center">
                    <Button type="submit" className="px-10 py-3">
                        <FaSave className="mr-2" /> Save Listing
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ListingPage;
