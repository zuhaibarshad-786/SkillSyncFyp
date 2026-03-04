// client/src/components/common/IncomingCallBanner.jsx
// This component MUST be rendered inside <Router> (e.g. inside App.jsx or MainLayout).
// It reads incomingCall from SocketContext and handles navigation itself.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';

const IncomingCallBanner = () => {
    const navigate = useNavigate();
    const { incomingCall, acceptCall, rejectCall } = useSocket();

    if (!incomingCall) return null;

    const handleAccept = () => {
        const sessionId = acceptCall(); // emits socket event, clears incomingCall state
        if (sessionId) {
            navigate(`/video/${sessionId}`);
        }
    };

    const handleReject = () => {
        rejectCall();
    };

    return (
        // Full-screen backdrop
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 w-80">

                {/* Pulsing phone icon */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-4xl">📞</span>
                    </div>
                    <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-60" />
                </div>

                {/* Caller info */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                        Incoming Video Call
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {incomingCall.callerName}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full">
                    <button
                        onClick={handleReject}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                    >
                        📵 Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition"
                    >
                        📹 Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallBanner;