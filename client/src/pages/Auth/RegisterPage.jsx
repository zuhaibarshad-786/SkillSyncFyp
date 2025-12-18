// client/src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../api/axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        isPaymentUser: false, // Default: Exchange user
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                isPaymentUser: formData.isPaymentUser,
            };

            await api.post('/auth/register', dataToSend);
            
            alert('Registration successful! You can now log in.');
            navigate('/login'); 

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
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
                        Create Your SkillSwap Account
                    </h2>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <Input
                        label="Full Name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        icon={FaUser}
                        required
                    />
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
                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        icon={FaLock}
                        required
                    />

                    {/* Pay-to-Learn Checkbox */}
                    <div className="flex items-center pt-2">
                        <input
                            id="isPaymentUser"
                            name="isPaymentUser"
                            type="checkbox"
                            checked={formData.isPaymentUser}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isPaymentUser" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                            I only want to **learn** and will pay for sessions (I don't plan to teach a skill).
                        </label>
                    </div>

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
                            className="w-full text-lg h-12 mt-4"
                        >
                            <FaUserPlus className="mr-2"/> Register Account
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Log in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;