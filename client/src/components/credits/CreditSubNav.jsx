// client/src/components/credits/CreditSubNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWallet, FaPlusCircle, FaHandsHelping, FaHistory } from 'react-icons/fa';

const subNavItems = [
    { name: 'My Wallet', path: '/credits/wallet', icon: FaWallet },
    { name: 'Buy Credits', path: '/credits/buy', icon: FaPlusCircle },
    { name: 'Earn (Contribute)', path: '/credits/contribute', icon: FaHandsHelping },
    { name: 'History', path: '/credits/history', icon: FaHistory },
];

const CreditSubNav = () => {
    const location = useLocation();

    return (
        <div className="flex flex-wrap border-b border-gray-200 mb-8 space-x-4">
            {subNavItems.map((item) => {
                // Check if the current pathname exactly matches or is the parent route
                const isActive = location.pathname === item.path;

                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`
                            flex items-center px-4 py-2 text-sm font-medium transition duration-150 
                            ${isActive 
                                ? 'border-b-2 border-indigo-600 text-indigo-700' 
                                : 'text-gray-500 hover:text-indigo-600 hover:border-b-2 hover:border-gray-300'
                            }
                        `}
                    >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                    </Link>
                );
            })}
        </div>
    );
};

export default CreditSubNav;