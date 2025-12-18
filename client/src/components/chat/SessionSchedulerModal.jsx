// client/src/components/chat/SessionSchedulerModal.jsx
import React, { useState } from 'react';
import { FaCalendarAlt, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import Button from '../common/Button';

const SessionSchedulerModal = ({ isOpen, onClose, onSubmit }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isBarter, setIsBarter] = useState(true); // Default to free barter
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date || !time) {
            alert('Please select both a date and a time.');
            return;
        }

        setIsSubmitting(true);
        
        // Combine date and time into a single ISO string
        // NOTE: Timezone handling should ideally be done using a robust library like moment-timezone or luxon
        const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

        await onSubmit({ scheduledAt, isBarter });
        
        // Reset state after successful submission (or handle error notification)
        setIsSubmitting(false);
        setDate('');
        setTime('');
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center">
                    <FaCalendarAlt className="mr-3"/> Propose a Session Time
                </h2>
                <p className="text-gray-600 mb-6">
                    Suggest a date and time for your skill exchange session. Your partner must confirm.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <FaCalendarAlt className="mr-2"/> Preferred Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]} // Cannot schedule in the past
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    {/* Time Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <FaClock className="mr-2"/> Preferred Time (Local Time)
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    
                    {/* Exchange Type (Barter vs. Credit) */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Exchange Type
                        </label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="exchangeType"
                                    checked={isBarter === true}
                                    onChange={() => setIsBarter(true)}
                                    className="mr-2 text-indigo-600"
                                />
                                Free Barter (Two-Way Match)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="exchangeType"
                                    checked={isBarter === false}
                                    onChange={() => setIsBarter(false)}
                                    className="mr-2 text-indigo-600"
                                />
                                Requires Credit (One-Sided Learning)
                            </label>
                        </div>
                        <p className={`text-xs mt-2 ${isBarter ? 'text-green-600' : 'text-red-600'}`}>
                            {isBarter 
                                ? "If confirmed, no credit required." 
                                : "If confirmed, 1 Skill Credit will be consumed from the learner's balance."}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button onClick={onClose} variant="secondary">
                            <FaTimes className="mr-2"/> Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>
                            <FaCheck className="mr-2"/> Propose Session
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SessionSchedulerModal;