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
    FaCalendarAlt,
} from 'react-icons/fa';

const navItems = [
    { name: 'Dashboard',          path: '/dashboard',       icon: FaTachometerAlt },
    { name: 'My Listing',         path: '/listing',         icon: FaUserEdit },
    { name: 'Find Matches',       path: '/matching',        icon: FaHandsHelping },
    { name: 'Chat & Requests',    path: '/chat',            icon: FaComments },
    { name: 'Session Scheduler',  path: '/schedule',        icon: FaCalendarAlt },
    { name: 'Credits & Wallet',   path: '/credits/wallet',  icon: FaMoneyBillWave },
    { name: 'Reputation & Rewards', path: '/rewards',       icon: FaTrophy },
    { name: 'AI Chat Bot',        path: '/ai-chat',         icon: FaRobot },
];

// onNavigate — optional callback called after a link click (used by mobile drawer to close itself)
const Sidebar = ({ onNavigate }) => {
    const location = useLocation();

    return (
        <nav className="flex flex-col space-y-1 p-3 bg-white h-full">
            {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={onNavigate}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition duration-150 text-sm
                            ${isActive
                                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                            }
                        `}
                    >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default Sidebar;