// client/src/pages/ListingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    FaChalkboardTeacher, FaBookReader, FaSave,
    FaSearch, FaTimes, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';
import Button from '../components/common/Button';
import api from '../api/axios';

const skillLevels = ['Beginner', 'Intermediate', 'Expert'];
const MAX_SKILLS  = 3;

const ListingPage = () => {
    const [skillsToTeach, setSkillsToTeach] = useState([]);
    const [skillsToLearn, setSkillsToLearn] = useState([]);
    const [masterSkills, setMasterSkills]   = useState([]);
    const [searchTerm, setSearchTerm]       = useState({ teach: '', learn: '' });
    const [dropdownOpen, setDropdownOpen]   = useState({ teach: false, learn: false });
    const [isLoading, setIsLoading]         = useState(true);
    const [message, setMessage]             = useState({ text: '', type: '' });

    const teachRef = useRef(null);
    const learnRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [skillsRes, profileRes] = await Promise.all([
                    api.get('/skills'),
                    api.get('/profile'),
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

    const addSkill = (skill, type) => {
        const list    = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;
        if (list.length >= MAX_SKILLS) { setMessage({ text: 'Maximum 3 skills allowed.', type: 'error' }); return; }
        if (list.find(s => s.skillId === skill._id)) return;
        setList([...list, { skillId: skill._id, name: skill.name, level: 'Beginner', priority: list.length + 1 }]);
        setSearchTerm(prev => ({ ...prev, [type]: '' }));
        setDropdownOpen(prev => ({ ...prev, [type]: false }));
        setMessage({ text: '', type: '' });
    };

    const removeSkill = (id, type) => {
        const list    = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;
        setList(list.filter(s => s.skillId !== id).map((s, i) => ({ ...s, priority: i + 1 })));
    };

    const updateLevel = (id, level, type) => {
        const list    = type === 'teach' ? skillsToTeach : skillsToLearn;
        const setList = type === 'teach' ? setSkillsToTeach : setSkillsToLearn;
        setList(list.map(s => s.skillId === id ? { ...s, level } : s));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/listing', { skillsToTeach, skillsToLearn });
            setMessage({ text: 'Listing saved successfully!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Save failed.', type: 'error' });
        }
    };

    const SkillSelector = ({ type, title, icon: Icon, selectedSkills, refProp, colorClass }) => {
        const filtered = masterSkills.filter(s =>
            s.name.toLowerCase().includes(searchTerm[type].toLowerCase())
        );
        return (
            <div ref={refProp} className={`border rounded-xl p-4 sm:p-6 ${colorClass}`}>
                <h2 className="text-base sm:text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon className="shrink-0" /> {title}
                </h2>

                {/* Search input */}
                <div className="relative mb-4">
                    <div className="flex items-center border rounded-lg bg-white shadow-sm">
                        <FaSearch className="ml-3 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={searchTerm[type]}
                            onChange={(e) => setSearchTerm(prev => ({ ...prev, [type]: e.target.value }))}
                            onFocus={() => setDropdownOpen(prev => ({ ...prev, [type]: true }))}
                            placeholder="Select approved skills..."
                            className="flex-1 px-3 py-2.5 outline-none text-sm min-w-0"
                        />
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(prev => ({ ...prev, [type]: !prev[type] }))}
                            className="px-3 text-gray-500 shrink-0"
                        >
                            {dropdownOpen[type] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                    </div>

                    {/* Dropdown */}
                    {dropdownOpen[type] && (
                        <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="p-3 text-sm text-red-500">Skill not found in approved list.</p>
                            ) : filtered.map(skill => (
                                <div
                                    key={skill._id}
                                    onClick={() => addSkill(skill, type)}
                                    className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 border-b last:border-0 text-sm"
                                >
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected skills */}
                <div className="space-y-2">
                    {selectedSkills.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-3">No skills selected yet.</p>
                    )}
                    {selectedSkills.map(s => (
                        <div key={s.skillId} className="bg-white border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center gap-2">
                                <span className="font-semibold text-sm truncate">
                                    P{s.priority}: {s.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeSkill(s.skillId, type)}
                                    className="text-red-400 hover:text-red-600 shrink-0 p-1"
                                >
                                    <FaTimes className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <select
                                value={s.level}
                                onChange={(e) => updateLevel(s.skillId, e.target.value, type)}
                                className="mt-2 border rounded px-2 py-1 text-xs w-full sm:w-auto"
                            >
                                {skillLevels.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Skill Exchange Listing</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Define what you can teach and what you want to learn (max 3 each).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Stacked on mobile, side-by-side on lg */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <SkillSelector
                        type="teach"
                        title="I Can Teach (Max 3)"
                        icon={FaChalkboardTeacher}
                        selectedSkills={skillsToTeach}
                        refProp={teachRef}
                        colorClass="bg-indigo-50 border-indigo-200"
                    />
                    <SkillSelector
                        type="learn"
                        title="I Want to Learn (Max 3)"
                        icon={FaBookReader}
                        selectedSkills={skillsToLearn}
                        refProp={learnRef}
                        colorClass="bg-purple-50 border-purple-200"
                    />
                </div>

                {message.text && (
                    <div className={`p-3 sm:p-4 rounded-lg text-sm ${
                        message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-center">
                    <Button type="submit" className="w-full sm:w-auto px-8 sm:px-10 py-3 justify-center">
                        <FaSave className="mr-2" /> Save Listing
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ListingPage;