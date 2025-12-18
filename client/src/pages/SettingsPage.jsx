// client/src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { FaBell, FaLock, FaCreditCard } from 'react-icons/fa';
import Button from '../components/common/Button';

const SettingsPage = () => {
    const [passwordData, setPasswordData] = useState({ old: '', new: '' });
    const [notifications, setNotifications] = useState(true);

    const handlePasswordChange = (e) => {
        e.preventDefault();
        // Call backend API to change password
        alert('Password change initiated.');
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

            {/* 1. Account Security */}
            <section className="border-b pb-6">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center"><FaLock className="mr-2"/> Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <Input label="Current Password" type="password" name="old" placeholder="••••••••" required/>
                    <Input label="New Password" type="password" name="new" placeholder="••••••••" required/>
                    <Button type="submit" variant="primary">Update Password</Button>
                </form>
            </section>

            {/* 2. Notifications */}
            <section className="border-b pb-6">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center"><FaBell className="mr-2"/> Notification Preferences</h2>
                <div className="flex items-center space-x-3">
                    <input 
                        type="checkbox" 
                        checked={notifications} 
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="h-5 w-5 text-indigo-600 rounded"
                    />
                    <label className="text-gray-700">Receive email notifications for new matches and messages.</label>
                </div>
            </section>
            
            {/* 3. Payment Method (If isPaymentUser) */}
            <section className="pb-6">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex items-center"><FaCreditCard className="mr-2"/> Payment Method</h2>
                <p className="text-gray-600">Manage your stored credit cards and subscriptions here (Stripe Portal integration).</p>
                <Button variant="secondary" className="mt-4">Go to Billing Portal</Button>
            </section>
        </div>
    );
};

export default SettingsPage;