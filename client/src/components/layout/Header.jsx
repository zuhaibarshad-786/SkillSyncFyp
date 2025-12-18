// client/src/components/layout/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button'; // Assuming common/Button exists

const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login page after logout
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Title */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">
                            SkillSwap 💡
                        </Link>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                {/* User Greeting/Profile Link */}
                                <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition">
                                    <FaUserCircle className="h-6 w-6" />
                                    <span className="hidden sm:inline font-medium">
                                        Hi, {user?.name || 'User'}
                                    </span>
                                </Link>

                                {/* Logout Button */}
                                <Button 
                                    onClick={handleLogout}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm flex items-center"
                                >
                                    <FaSignOutAlt className="mr-2"/>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
                                    Login
                                </Link>
                                <Button 
                                    onClick={() => navigate('/register')}
                                    variant="primary"
                                    className="px-3 py-1 text-sm"
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;