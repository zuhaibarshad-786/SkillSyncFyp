// client/src/pages/VideoCallPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaDesktop, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash, FaSpinner, FaExclamationTriangle, FaStop,
} from 'react-icons/fa';
import { useSocket } from '../hooks/useSocket';
import { useAuth }   from '../hooks/useAuth';
import api from '../api/axios';

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const stopStream = (stream) => {
    if (stream) stream.getTracks().forEach(t => t.stop());
};

const VideoCallPage = () => {
    const { roomId: sessionId } = useParams();
    const navigate  = useNavigate();
    const { socket } = useSocket();
    const { user }   = useAuth();

    const [sessionInfo, setSessionInfo] = useState(null);
    const [verifyError, setVerifyError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(true);

    const [callStatus, setCallStatus] = useState('connecting');
    const [statusMsg,  setStatusMsg]  = useState('Verifying session…');

    const [isMuted,    setIsMuted]    = useState(false);
    const [isCamOff,   setIsCamOff]   = useState(false);
    const [isSharing,  setIsSharing]  = useState(false);
    const [hasCamera,  setHasCamera]  = useState(true);
    const [shareError, setShareError] = useState('');

    const localVideoRef      = useRef(null);
    const remoteVideoRef     = useRef(null);
    const pcRef              = useRef(null);
    const localStream        = useRef(null);
    const screenStream       = useRef(null);
    const stopScreenShareRef = useRef(null);

    // ── 1. Verify session ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!sessionId || sessionId === 'undefined') {
            setVerifyError('Invalid session link. Please go back to chat and try again.');
            setCallStatus('error');
            setIsVerifying(false);
            return;
        }
        const verify = async () => {
            try {
                const res = await api.get(`/sessions/verify/${sessionId}`);
                setSessionInfo(res.data);
            } catch (err) {
                setVerifyError(err.response?.data?.message || 'You cannot join this call.');
                setCallStatus('error');
            } finally {
                setIsVerifying(false);
            }
        };
        verify();
    }, [sessionId]);

    // ── 2. Get local media ────────────────────────────────────────────────────
    const getLocalMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.current = stream;
            setHasCamera(true);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (_) {}
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStream.current = stream;
            setHasCamera(false);
            return stream;
        } catch (_) {}
        setHasCamera(false);
        try {
            const ctx  = new AudioContext();
            const dest = ctx.createMediaStreamDestination();
            localStream.current = dest.stream;
            return dest.stream;
        } catch (_) {
            const empty = new MediaStream();
            localStream.current = empty;
            return empty;
        }
    }, []);

    // ── 3. Create RTCPeerConnection ───────────────────────────────────────────
    const createPeerConnection = useCallback((stream) => {
        if (pcRef.current) pcRef.current.close();
        const pc = new RTCPeerConnection(RTC_CONFIG);

        if (stream && stream.getTracks().length > 0) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } else {
            try {
                const ctx  = new AudioContext();
                const dest = ctx.createMediaStreamDestination();
                const st   = dest.stream.getAudioTracks()[0];
                if (st) pc.addTrack(st, dest.stream);
            } catch (_) {}
        }

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('webrtcIceCandidate', { roomId: sessionId, candidate: event.candidate });
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') { setCallStatus('in_call'); setStatusMsg(''); }
            else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                setCallStatus('ended'); setStatusMsg('Connection lost.');
            }
        };
        pc.oniceconnectionstatechange = () => {
            if (['connected', 'completed'].includes(pc.iceConnectionState)) { setCallStatus('in_call'); setStatusMsg(''); }
            else if (pc.iceConnectionState === 'failed') { setCallStatus('ended'); setStatusMsg('Connection failed.'); }
        };

        pcRef.current = pc;
        return pc;
    }, [socket, sessionId]);

    // ── 4. Socket setup ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!sessionInfo || !socket) return;
        let mounted = true;

        const handleWaitingForPeer = () => { if (mounted) setStatusMsg('Waiting for partner…'); };
        const handleStartWebRTC    = async ({ isInitiator }) => {
            if (!mounted) return;
            setStatusMsg('Connecting…');
            const pc = createPeerConnection(localStream.current || new MediaStream());
            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('webrtcOffer', { roomId: sessionId, offer });
                } catch (err) { console.error('createOffer error:', err); }
            }
        };
        const handleWebRTCOffer    = async ({ offer }) => {
            if (!mounted) return;
            const pc = pcRef.current || createPeerConnection(localStream.current || new MediaStream());
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtcAnswer', { roomId: sessionId, answer });
            } catch (err) { console.error('createAnswer error:', err); }
        };
        const handleWebRTCAnswer   = async ({ answer }) => {
            if (!mounted || !pcRef.current) return;
            try { await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)); }
            catch (err) { console.error('setRemoteDescription error:', err); }
        };
        const handleICECandidate   = async ({ candidate }) => {
            if (!mounted || !pcRef.current) return;
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        };
        const handleCallEnded      = () => {
            if (!mounted) return;
            setCallStatus('ended'); setStatusMsg('Partner ended the call.'); doCleanup(false);
        };
        const handleCallError      = ({ message: msg }) => {
            if (!mounted) return; setVerifyError(msg); setCallStatus('error');
        };

        socket.on('waitingForPeer',     handleWaitingForPeer);
        socket.on('startWebRTC',        handleStartWebRTC);
        socket.on('webrtcOffer',        handleWebRTCOffer);
        socket.on('webrtcAnswer',       handleWebRTCAnswer);
        socket.on('webrtcIceCandidate', handleICECandidate);
        socket.on('callEnded',          handleCallEnded);
        socket.on('callError',          handleCallError);

        const init = async () => {
            setStatusMsg('Starting devices…');
            await getLocalMedia();
            if (!mounted) return;
            setCallStatus('waiting_peer');
            setStatusMsg('Waiting for partner to join…');
            socket.emit('joinVideoRoom', { roomId: sessionId });
        };

        init().catch(err => {
            if (mounted) { setVerifyError(err.message || 'Failed to start call.'); setCallStatus('error'); }
        });

        return () => {
            mounted = false;
            socket.off('waitingForPeer',     handleWaitingForPeer);
            socket.off('startWebRTC',        handleStartWebRTC);
            socket.off('webrtcOffer',        handleWebRTCOffer);
            socket.off('webrtcAnswer',       handleWebRTCAnswer);
            socket.off('webrtcIceCandidate', handleICECandidate);
            socket.off('callEnded',          handleCallEnded);
            socket.off('callError',          handleCallError);
        };
    }, [sessionInfo, socket]);

    // ── 5. Cleanup ────────────────────────────────────────────────────────────
    const doCleanup = useCallback((emitEnd = true) => {
        if (emitEnd && socket && sessionId) socket.emit('endCall', { roomId: sessionId });
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        stopStream(localStream.current);
        stopStream(screenStream.current);
        localStream.current  = null;
        screenStream.current = null;
        if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, [socket, sessionId]);

    useEffect(() => { return () => { doCleanup(callStatus !== 'ended'); }; }, []);

    const handleEndCall = () => {
        doCleanup(true);
        setCallStatus('ended');
        setStatusMsg('You ended the call.');
    };

    // ── 6. Media controls ─────────────────────────────────────────────────────
    const toggleMute = () => {
        if (!localStream.current) return;
        localStream.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsMuted(p => !p);
    };

    const toggleCamera = () => {
        if (isSharing || !localStream.current) return;
        localStream.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsCamOff(p => !p);
    };

    const stopScreenShare = useCallback(async () => {
        if (!screenStream.current) return;
        stopStream(screenStream.current);
        screenStream.current = null;
        setIsSharing(false);
        setShareError('');

        const pc          = pcRef.current;
        const camTrack    = localStream.current?.getVideoTracks()[0];
        const videoSender = pc?.getSenders().find(s => s.track?.kind === 'video');

        if (camTrack && videoSender) {
            try { await videoSender.replaceTrack(camTrack); } catch (err) { console.error(err); }
        } else if (videoSender && !camTrack) {
            pc.removeTrack(videoSender);
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current || null;

        if (pc && pc.signalingState === 'stable' && socket) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtcOffer', { roomId: sessionId, offer });
            } catch (err) { console.warn('Renegotiation after stop-share:', err.message); }
        }
    }, [socket, sessionId]);

    useEffect(() => { stopScreenShareRef.current = stopScreenShare; }, [stopScreenShare]);

    const startScreenShare = async () => {
        setShareError('');
        let screen;
        try {
            screen = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        } catch (err) {
            setShareError(err.name === 'NotAllowedError' ? 'Screen share permission denied.' : 'Could not start screen share.');
            return;
        }

        screenStream.current = screen;
        const screenTrack    = screen.getVideoTracks()[0];
        screenTrack.onended  = () => stopScreenShareRef.current?.();

        const pc          = pcRef.current;
        const videoSender = pc?.getSenders().find(s => s.track?.kind === 'video');
        try {
            if (videoSender) await videoSender.replaceTrack(screenTrack);
            else pc?.addTrack(screenTrack, screen);
        } catch (err) {
            stopStream(screen);
            screenStream.current = null;
            setShareError('Failed to switch to screen share.');
            return;
        }

        setIsSharing(true);
        setIsCamOff(false);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;

        if (pc && pc.signalingState === 'stable' && socket) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtcOffer', { roomId: sessionId, offer });
            } catch (err) { console.warn('Renegotiation after start-share:', err.message); }
        }
    };

    // ── 7. Render ─────────────────────────────────────────────────────────────
    const showLocalVideo = isSharing || (hasCamera && !isCamOff);

    if (isVerifying) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white gap-3 p-4">
            <FaSpinner className="animate-spin text-3xl text-indigo-400" />
            <span className="text-base sm:text-lg">Verifying session…</span>
        </div>
    );

    if (callStatus === 'error' || verifyError) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full">
                <FaExclamationTriangle className="text-4xl sm:text-5xl text-red-400 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Cannot Join Call</h2>
                <p className="text-gray-400 mb-6 text-sm">{verifyError}</p>
                <button onClick={() => navigate('/chat')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm w-full sm:w-auto">
                    Back to Chat
                </button>
            </div>
        </div>
    );

    if (callStatus === 'ended') return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full">
                <div className="text-4xl sm:text-5xl mb-4">📵</div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Call Ended</h2>
                <p className="text-gray-400 mb-6 text-sm">{statusMsg || 'The call has ended.'}</p>
                <button onClick={() => navigate('/chat')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm w-full sm:w-auto">
                    Back to Chat
                </button>
            </div>
        </div>
    );

    return (
        // Use dvh so mobile browser chrome (address bar) doesn't overflow the layout
        <div className="flex flex-col bg-gray-900 text-white select-none" style={{ height: '100dvh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-gray-800 border-b border-gray-700 shrink-0">
                <div className="min-w-0 mr-2">
                    <h1 className="font-bold text-sm sm:text-lg truncate">
                        Session with {sessionInfo?.partnerName || '…'}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                        {sessionInfo?.myRole} · {sessionInfo?.session?.scheduledAt
                            ? new Date(sessionInfo.session.scheduledAt).toLocaleString()
                            : ''}
                    </p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm shrink-0 ${
                    callStatus === 'in_call' ? 'bg-green-900/50' : 'bg-gray-700'
                }`}>
                    {callStatus === 'in_call' ? (
                        <>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-300 font-medium">Live</span>
                            {isSharing && <span className="text-blue-300 hidden sm:inline">· Sharing</span>}
                        </>
                    ) : (
                        <>
                            <FaSpinner className="animate-spin text-indigo-400 w-2.5 h-2.5" />
                            <span className="text-gray-300 max-w-[90px] sm:max-w-none truncate text-[10px] sm:text-sm">{statusMsg}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Banners */}
            {!hasCamera && !isSharing && (
                <div className="bg-yellow-900/40 text-yellow-300 text-[10px] sm:text-xs text-center py-1 px-3 shrink-0">
                    ⚠️ No camera detected — audio-only mode
                </div>
            )}
            {isSharing && (
                <div className="bg-blue-900/50 text-blue-200 text-[10px] sm:text-xs text-center py-1 px-3 flex items-center justify-center gap-2 shrink-0">
                    🖥️ You are sharing your screen —{' '}
                    <button onClick={stopScreenShare} className="underline font-semibold hover:text-white">Stop</button>
                </div>
            )}
            {shareError && (
                <div className="bg-red-900/50 text-red-300 text-[10px] sm:text-xs text-center py-1 px-3 shrink-0">
                    ⚠️ {shareError}
                </div>
            )}

            {/* Video grid
                Mobile  (portrait): stacked — remote on top, local below (smaller)
                Desktop (sm+)      : side by side, equal halves
            */}
            <div className="flex-1 flex flex-col sm:grid sm:grid-cols-2 gap-2 p-2 sm:p-4 overflow-hidden min-h-0">

                {/* Remote — takes more space on mobile */}
                <div className="relative bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center flex-[2] sm:flex-none min-h-0">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {callStatus !== 'in_call' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/95">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-700 flex items-center justify-center text-2xl sm:text-3xl mb-2">
                                👤
                            </div>
                            <p className="text-gray-200 font-medium text-sm">{sessionInfo?.partnerName}</p>
                            <p className="text-gray-500 text-[10px] sm:text-xs mt-1 animate-pulse">{statusMsg}</p>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs text-white">
                        {sessionInfo?.partnerName}
                    </div>
                </div>

                {/* Local — smaller on mobile */}
                <div className="relative bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center flex-1 sm:flex-none min-h-0">
                    {showLocalVideo ? (
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="flex flex-col items-center justify-center text-gray-500 gap-1 sm:gap-2">
                                <FaVideoSlash className="text-2xl sm:text-4xl" />
                                <span className="text-[10px] sm:text-xs">{isCamOff ? 'Camera off' : 'No camera'}</span>
                            </div>
                            <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
                        </>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs text-white">
                        {isSharing ? '🖥️ Screen' : `You (${sessionInfo?.myRole})`}
                    </div>
                </div>
            </div>

            {/* Controls — larger touch targets on mobile */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-3 sm:py-4 px-4 bg-gray-800 border-t border-gray-700 shrink-0">

                <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    {isMuted ? <FaMicrophoneSlash className="text-base sm:text-lg" /> : <FaMicrophone className="text-base sm:text-lg" />}
                </button>

                <button onClick={toggleCamera} disabled={!hasCamera || isSharing}
                    title={isSharing ? 'Unavailable while sharing' : !hasCamera ? 'No camera' : isCamOff ? 'Turn on' : 'Turn off'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90 ${
                        !hasCamera || isSharing ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isCamOff             ? 'bg-red-600 hover:bg-red-700'
                        :                        'bg-gray-600 hover:bg-gray-500'
                    }`}>
                    {isCamOff ? <FaVideoSlash className="text-base sm:text-lg" /> : <FaVideo className="text-base sm:text-lg" />}
                </button>

                <button onClick={isSharing ? stopScreenShare : startScreenShare}
                    title={isSharing ? 'Stop sharing' : 'Share screen'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90 ${
                        isSharing ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400' : 'bg-gray-600 hover:bg-gray-500'
                    }`}>
                    {isSharing ? <FaStop className="text-sm" /> : <FaDesktop className="text-base sm:text-lg" />}
                </button>

                <button onClick={handleEndCall} title="End call"
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg active:scale-90">
                    <FaPhoneSlash className="text-lg sm:text-xl" />
                </button>
            </div>
        </div>
    );
};

export default VideoCallPage;