// client/src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth'; // Use the dedicated hook

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Attempt to call the global login function
            await login(formData.email, formData.password);
            
            // Redirect to the dashboard on successful login
            navigate('/dashboard'); 

        } catch (err) {
            // Handle specific API error responses
            const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-indigo-100">
                
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign in to SkillSwap
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Connect with your matches and start learning!
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        icon={FaEnvelope}
                        required
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        icon={FaLock}
                        required
                    />

                    {error && (
                        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="w-full text-lg h-12"
                        >
                            <FaSignInAlt className="mr-2"/> Log In
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign up here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;