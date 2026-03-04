// client/src/pages/VideoCallPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaDesktop, FaPhoneSlash, FaMicrophone } from 'react-icons/fa';
import Button from '../components/common/Button';
import { useSocket } from '../hooks/useSocket';

const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const VideoCallPage = () => {
    const { socket } = useSocket();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    const screenStream = useRef(null);
    const micStream = useRef(null);

    const [isInCall, setIsInCall] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const roomId = "session_room_123";

    const createPeer = () => {
        peerConnection.current = new RTCPeerConnection(servers);

        peerConnection.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate
                });
            }
        };
    };

    const startCall = async () => {
        createPeer();

        // 🎤 Get microphone only
        micStream.current = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        micStream.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, micStream.current);
        });

        socket.emit("joinVideoRoom", roomId);

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.emit("offer", { roomId, offer });

        setIsInCall(true);
    };

    const startScreenShare = async () => {
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });

        const screenTrack = screenStream.current.getVideoTracks()[0];

        peerConnection.current.addTrack(screenTrack, screenStream.current);

        localVideoRef.current.srcObject = screenStream.current;

        screenTrack.onended = () => {
            stopScreenShare();
        };

        setIsSharing(true);
    };

    const stopScreenShare = () => {
        if (screenStream.current) {
            screenStream.current.getTracks().forEach(track => track.stop());
            screenStream.current = null;
        }
        setIsSharing(false);
    };

    const endCall = () => {
        socket.emit("leaveVideoRoom", roomId);

        if (peerConnection.current) {
            peerConnection.current.close();
        }

        if (screenStream.current) {
            screenStream.current.getTracks().forEach(track => track.stop());
        }

        if (micStream.current) {
            micStream.current.getTracks().forEach(track => track.stop());
        }

        setIsInCall(false);
        setIsSharing(false);
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("offer", async (offer) => {
            createPeer();

            micStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            micStream.current.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, micStream.current);
            });

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.emit("answer", { roomId, answer });

            setIsInCall(true);
        });

        socket.on("answer", async (answer) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", async (candidate) => {
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error(err);
            }
        });

        socket.on("userLeftVideo", () => {
            endCall();
        });

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("userLeftVideo");
        };
    }, [socket]);

    return (
        <div className="p-6 bg-gray-900 min-h-[90vh] flex flex-col rounded-lg shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-6">Screen Share Session</h1>

            <div className="flex-grow grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="flex justify-center space-x-6 p-4 bg-gray-800 mt-4 rounded-lg">
                {!isInCall ? (
                    <Button onClick={startCall} className="bg-green-600 hover:bg-green-700">
                        Join Session
                    </Button>
                ) : (
                    <>
                        {!isSharing && (
                            <Button onClick={startScreenShare} className="bg-blue-600 hover:bg-blue-700">
                                <FaDesktop /> Share Screen
                            </Button>
                        )}

                        <Button onClick={endCall} className="bg-red-600 hover:bg-red-700">
                            <FaPhoneSlash /> End Call
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoCallPage;
