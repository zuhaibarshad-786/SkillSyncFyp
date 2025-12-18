// client/src/pages/VideoCallPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaVideo, FaMicrophone, FaDesktop, FaPhoneSlash } from 'react-icons/fa';
import Button from '../components/common/Button';
import { useSocket } from '../hooks/useSocket';
// import { useVideoChat } from '../hooks/useVideoChat'; // Custom hook for WebRTC logic

const VideoCallPage = () => {
    // const { token, connectToRoom } = useVideoChat(); // Hook to get Twilio/WebRTC token
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isInCall, setIsInCall] = useState(false);

    const handleStartCall = () => {
        // 1. Get Room ID (e.g., from query string or Match context)
        const roomId = 'match_123';
        
        // 2. Fetch the video token from the backend: GET /api/video/token/:roomId
        
        // 3. Use the token to connect to the WebRTC service
        // connectToRoom(roomId, localVideoRef, remoteVideoRef); 
        setIsInCall(true);
    };
    
    return (
        <div className="p-6 bg-gray-900 min-h-[90vh] flex flex-col rounded-lg shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-6">Live Session: React <span className="text-indigo-400">↔</span> Spanish</h1>
            
            <div className="flex-grow grid grid-cols-2 gap-4">
                {/* Local Video Stream */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <p className="text-center text-sm text-gray-400 p-2">You (Teacher/Learner)</p>
                </div>
                
                {/* Remote Video Stream */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <p className="text-center text-sm text-gray-400 p-2">Partner</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-6 p-4 bg-gray-800 mt-4 rounded-lg">
                {!isInCall ? (
                    <Button onClick={handleStartCall} variant="primary" className="bg-green-600 hover:bg-green-700">
                        <FaVideo className="mr-2"/> Join Session
                    </Button>
                ) : (
                    <>
                        <Button variant="secondary" className="bg-white"><FaMicrophone/></Button>
                        <Button variant="secondary" className="bg-white"><FaVideo/></Button>
                        <Button variant="secondary" className="bg-white"><FaDesktop/></Button>
                        <Button variant="primary" className="bg-red-600 hover:bg-red-700">
                            <FaPhoneSlash className="mr-2"/> End Call
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoCallPage;