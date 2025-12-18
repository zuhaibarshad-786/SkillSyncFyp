// client/src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    FaTachometerAlt, 
    FaUserEdit, 
    FaHandsHelping, 
    FaComments, 
    FaMoneyBillWave,
    FaTrophy,
    FaRobot,
    FaCalendarAlt, // 🆕 New Icon for Scheduling
    FaVideo, 
    FaMoneyBill
} from 'react-icons/fa';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt },
    { name: 'My Listing', path: '/listing', icon: FaUserEdit },
    { name: 'Find Matches', path: '/matching', icon: FaHandsHelping },
    // 🆕 Updated: Direct link for Chat/Coordination
    { name: 'Chat & Requests', path: '/chat', icon: FaComments }, 
    
    // 🆕 New Top-Level Links
    { name: 'Session Scheduler', path: '/schedule', icon: FaCalendarAlt }, // 👈 New Parent Link
    { name: 'Credits & Wallet', path: '/credits/wallet', icon: FaMoneyBillWave }, // 👈 New Parent Link
    { name: 'Reputation & Rewards', path: '/reputation/badges', icon: FaTrophy }, // 👈 New Parent Link

    { name: 'AI Chat Bot', path: '/ai-chat', icon: FaRobot },
    // { name: 'Settings', path: '/settings', icon: FaCog }, // Assuming this exists
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <nav className="flex flex-col space-y-2 p-4 bg-white border-r h-full">
            {navItems.map((item) => {
                // Check if the current path starts with the item's path for grouping/active state
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`
                            flex items-center p-3 rounded-lg transition duration-150 
                            ${isActive 
                                ? 'bg-indigo-100 text-indigo-700 font-semibold' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                            }
                        `}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="text-sm">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default Sidebar;