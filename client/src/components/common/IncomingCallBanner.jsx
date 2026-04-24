// client/src/components/common/IncomingCallBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';

const IncomingCallBanner = () => {
    const navigate = useNavigate();
    const { incomingCall, acceptCall, rejectCall } = useSocket();

    if (!incomingCall) return null;

    const handleAccept = () => {
        const sessionId = acceptCall();
        if (sessionId) navigate(`/video/${sessionId}`);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4 sm:gap-5 w-full max-w-sm">

                {/* Pulsing icon */}
                <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl">📞</span>
                    </div>
                    <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-60" />
                </div>

                {/* Caller info */}
                <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                        Incoming Video Call
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {incomingCall.callerName}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={rejectCall}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold transition text-sm sm:text-base"
                    >
                        📵 Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold transition text-sm sm:text-base"
                    >
                        📹 Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallBanner;