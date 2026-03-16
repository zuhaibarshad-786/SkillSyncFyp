// client/src/pages/VideoCallPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaDesktop, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash, FaSpinner, FaExclamationTriangle, FaStop
} from 'react-icons/fa';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
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

    // ── Session verification ──────────────────────────────────────────────────
    const [sessionInfo, setSessionInfo] = useState(null);
    const [verifyError, setVerifyError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(true);

    // ── Call UI state ─────────────────────────────────────────────────────────
    const [callStatus, setCallStatus] = useState('connecting');
    const [statusMsg,  setStatusMsg]  = useState('Verifying session…');

    // ── Media controls ────────────────────────────────────────────────────────
    const [isMuted,    setIsMuted]    = useState(false);
    const [isCamOff,   setIsCamOff]   = useState(false);
    const [isSharing,  setIsSharing]  = useState(false);
    const [hasCamera,  setHasCamera]  = useState(true);
    // BUG FIX #5: track screen share error message for user feedback
    const [shareError, setShareError] = useState('');

    // ── Refs ──────────────────────────────────────────────────────────────────
    const localVideoRef  = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef          = useRef(null);
    const localStream    = useRef(null);
    const screenStream   = useRef(null);

    // BUG FIX #1: Keep stopScreenShare in a ref so screenTrack.onended always
    // calls the LATEST version — not a stale closure captured at share-start time.
    const stopScreenShareRef = useRef(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. Verify session membership
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. Get local media
    // ═══════════════════════════════════════════════════════════════════════════
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
            console.warn('⚠️ No camera found — audio-only mode.');
            return stream;
        } catch (_) {}

        console.warn('⚠️ No media devices found — using silent audio stream.');
        setHasCamera(false);
        try {
            const ctx  = new AudioContext();
            const dest = ctx.createMediaStreamDestination();
            localStream.current = dest.stream;
            return dest.stream;
        } catch (_) {
            const emptyStream = new MediaStream();
            localStream.current = emptyStream;
            return emptyStream;
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. Create RTCPeerConnection
    // ═══════════════════════════════════════════════════════════════════════════
    const createPeerConnection = useCallback((stream) => {
        if (pcRef.current) pcRef.current.close();

        const pc = new RTCPeerConnection(RTC_CONFIG);

        if (stream && stream.getTracks().length > 0) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } else {
            try {
                const ctx  = new AudioContext();
                const dest = ctx.createMediaStreamDestination();
                const silentTrack = dest.stream.getAudioTracks()[0];
                if (silentTrack) pc.addTrack(silentTrack, dest.stream);
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
            console.log('🔗 connectionState:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallStatus('in_call');
                setStatusMsg('');
            } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                setCallStatus('ended');
                setStatusMsg('Connection lost.');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 iceConnectionState:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setCallStatus('in_call');
                setStatusMsg('');
            } else if (pc.iceConnectionState === 'failed') {
                setCallStatus('ended');
                setStatusMsg('Connection failed — please check your network.');
            }
        };

        pcRef.current = pc;
        return pc;
    }, [socket, sessionId]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. Main socket setup
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!sessionInfo || !socket) return;

        let mounted = true;

        const handleWaitingForPeer = () => {
            if (!mounted) return;
            setStatusMsg('Waiting for partner to join…');
        };

        const handleStartWebRTC = async ({ isInitiator }) => {
            if (!mounted) return;
            setStatusMsg('Connecting…');
            const pc = createPeerConnection(localStream.current || new MediaStream());

            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('webrtcOffer', { roomId: sessionId, offer });
                    console.log('📤 Sent offer');
                } catch (err) {
                    console.error('createOffer error:', err);
                }
            }
        };

        const handleWebRTCOffer = async ({ offer }) => {
            if (!mounted) return;
            const pc = pcRef.current || createPeerConnection(localStream.current || new MediaStream());
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtcAnswer', { roomId: sessionId, answer });
                console.log('📤 Sent answer');
            } catch (err) {
                console.error('createAnswer error:', err);
            }
        };

        const handleWebRTCAnswer = async ({ answer }) => {
            if (!mounted || !pcRef.current) return;
            try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('✅ Remote description set');
            } catch (err) {
                console.error('setRemoteDescription error:', err);
            }
        };

        const handleICECandidate = async ({ candidate }) => {
            if (!mounted || !pcRef.current) return;
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (_) {}
        };

        const handleCallEnded = () => {
            if (!mounted) return;
            setCallStatus('ended');
            setStatusMsg('Partner ended the call.');
            doCleanup(false);
        };

        const handleCallError = ({ message: msg }) => {
            if (!mounted) return;
            setVerifyError(msg);
            setCallStatus('error');
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
            if (mounted) {
                setVerifyError(err.message || 'Failed to start call.');
                setCallStatus('error');
            }
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

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. Cleanup
    // ═══════════════════════════════════════════════════════════════════════════
    const doCleanup = useCallback((emitEnd = true) => {
        if (emitEnd && socket && sessionId) {
            socket.emit('endCall', { roomId: sessionId });
        }
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        stopStream(localStream.current);
        stopStream(screenStream.current);
        localStream.current  = null;
        screenStream.current = null;
        if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, [socket, sessionId]);

    useEffect(() => {
        return () => { doCleanup(callStatus !== 'ended'); };
    }, []);

    const handleEndCall = () => {
        doCleanup(true);
        setCallStatus('ended');
        setStatusMsg('You ended the call.');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. Media controls
    // ═══════════════════════════════════════════════════════════════════════════
    const toggleMute = () => {
        if (!localStream.current) return;
        localStream.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsMuted(p => !p);
    };

    const toggleCamera = () => {
        // BUG FIX #5: Disable camera toggle while screen sharing to avoid
        // confusing state — camera track is not in use during screen share.
        if (isSharing) return;
        if (!localStream.current) return;
        localStream.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsCamOff(p => !p);
    };

    // ── stopScreenShare ────────────────────────────────────────────────────────
    // BUG FIX #1: Defined as a useCallback so the ref always points to the
    // latest closure. screenTrack.onended calls stopScreenShareRef.current()
    // instead of a captured-at-start stale copy.
    //
    // BUG FIX #4: Gracefully handles the no-camera case — when localStream has
    // no video track we simply remove the screen video sender from the PC
    // rather than trying to replaceTrack with undefined, which threw an error.
    //
    // BUG FIX #3: After stopping screen share we renegotiate (createOffer) so
    // the partner's browser gets updated track info and switches back to camera
    // (or blank) properly.
    const stopScreenShare = useCallback(async () => {
        if (!screenStream.current) return;

        stopStream(screenStream.current);
        screenStream.current = null;
        setIsSharing(false);
        setShareError('');

        const pc = pcRef.current;
        if (!pc) return;

        const camTrack = localStream.current?.getVideoTracks()[0];
        const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');

        if (camTrack && videoSender) {
            // Camera available — swap screen track back to camera track
            try {
                await videoSender.replaceTrack(camTrack);
            } catch (err) {
                console.error('replaceTrack (screen→cam) error:', err);
            }
        } else if (videoSender && !camTrack) {
            // No camera — remove the video sender entirely so partner sees nothing
            pc.removeTrack(videoSender);
        }

        // Restore local preview to camera (or blank if no camera)
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current || null;
        }

        // BUG FIX #3: Renegotiate so partner receives updated track state
        if (pc.signalingState === 'stable' && socket) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtcOffer', { roomId: sessionId, offer });
                console.log('🔄 Renegotiated after screen share stop');
            } catch (err) {
                console.warn('Renegotiation after stop-share failed (non-fatal):', err.message);
            }
        }
    }, [socket, sessionId]);

    // Keep the ref in sync with the latest closure
    useEffect(() => {
        stopScreenShareRef.current = stopScreenShare;
    }, [stopScreenShare]);

    // ── startScreenShare ───────────────────────────────────────────────────────
    // BUG FIX #1: onended calls stopScreenShareRef.current() — always latest fn.
    // BUG FIX #2: sets isSharing=true BEFORE touching the video element so the
    //             render condition (`isSharing || (hasCamera && !isCamOff)`) keeps
    //             localVideoRef in the DOM during screen share.
    // BUG FIX #3: Renegotiates after replacing the track so the partner's browser
    //             actually switches to the screen stream.
    const startScreenShare = async () => {
        setShareError('');
        let screen;
        try {
            screen = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false, // screen audio causes echo; mic audio already in call
            });
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setShareError('Screen share permission denied.');
            } else {
                setShareError('Could not start screen share.');
            }
            console.error('getDisplayMedia error:', err);
            return;
        }

        screenStream.current = screen;
        const screenTrack = screen.getVideoTracks()[0];

        // BUG FIX #1: use ref so this always calls the latest stopScreenShare
        screenTrack.onended = () => stopScreenShareRef.current?.();

        const pc = pcRef.current;
        if (pc) {
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            try {
                if (videoSender) {
                    // Replace existing video sender track with screen track
                    await videoSender.replaceTrack(screenTrack);
                } else {
                    // No existing video sender (audio-only call) — add a new one
                    pc.addTrack(screenTrack, screen);
                }
            } catch (err) {
                console.error('replaceTrack (cam→screen) error:', err);
                stopStream(screen);
                screenStream.current = null;
                setShareError('Failed to switch to screen share.');
                return;
            }
        }

        // BUG FIX #2: Set isSharing BEFORE updating srcObject so the video
        // element stays mounted (render condition includes isSharing).
        setIsSharing(true);
        setIsCamOff(false); // camera state no longer relevant while sharing

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = screen;
        }

        // BUG FIX #3: Renegotiate so partner switches to the screen stream
        if (pc && pc.signalingState === 'stable' && socket) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtcOffer', { roomId: sessionId, offer });
                console.log('🖥️  Screen share started — renegotiating with partner');
            } catch (err) {
                console.warn('Renegotiation after start-share failed (non-fatal):', err.message);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. Render
    // ═══════════════════════════════════════════════════════════════════════════
    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <FaSpinner className="animate-spin text-4xl text-indigo-400 mr-4" />
                <span className="text-lg">Verifying session…</span>
            </div>
        );
    }

    if (callStatus === 'error' || verifyError) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm">
                    <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Cannot Join Call</h2>
                    <p className="text-gray-400 mb-6">{verifyError}</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    if (callStatus === 'ended') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm">
                    <div className="text-5xl mb-4">📵</div>
                    <h2 className="text-xl font-bold text-white mb-2">Call Ended</h2>
                    <p className="text-gray-400 mb-6">{statusMsg || 'The call has ended.'}</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    // ── Main call UI ──────────────────────────────────────────────────────────
    // BUG FIX #2: localVideoRef must stay mounted whenever:
    //   • Camera is on (hasCamera && !isCamOff)
    //   • Screen sharing is active (isSharing)
    // Previously the condition was only (hasCamera && !isCamOff), which removed
    // the video element from the DOM the moment screen share started with camera
    // off — breaking localVideoRef and srcObject assignment.
    const showLocalVideo = isSharing || (hasCamera && !isCamOff);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white select-none">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
                <div>
                    <h1 className="font-bold text-lg">
                        Session with {sessionInfo?.partnerName || '…'}
                    </h1>
                    <p className="text-xs text-gray-400">
                        {sessionInfo?.myRole} · {sessionInfo?.session?.scheduledAt
                            ? new Date(sessionInfo.session.scheduledAt).toLocaleString()
                            : ''}
                    </p>
                </div>

                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                    callStatus === 'in_call' ? 'bg-green-900/50' : 'bg-gray-700'
                }`}>
                    {callStatus === 'in_call' ? (
                        <>
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-300 font-medium">Live</span>
                            {isSharing && (
                                <span className="ml-1 text-blue-300 text-xs font-medium">· Sharing screen</span>
                            )}
                        </>
                    ) : (
                        <>
                            <FaSpinner className="animate-spin text-indigo-400 w-3 h-3" />
                            <span className="text-gray-300">{statusMsg}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Banners */}
            {!hasCamera && !isSharing && (
                <div className="bg-yellow-900/40 text-yellow-300 text-xs text-center py-1.5 px-4">
                    ⚠️ No camera detected — audio-only mode
                </div>
            )}
            {isSharing && (
                <div className="bg-blue-900/50 text-blue-200 text-xs text-center py-1.5 px-4 flex items-center justify-center gap-2">
                    🖥️ You are sharing your screen —
                    <button
                        onClick={stopScreenShare}
                        className="underline font-semibold hover:text-white transition"
                    >
                        Stop sharing
                    </button>
                </div>
            )}
            {shareError && (
                <div className="bg-red-900/50 text-red-300 text-xs text-center py-1.5 px-4">
                    ⚠️ {shareError}
                </div>
            )}

            {/* Video grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 p-4 overflow-hidden min-h-0">

                {/* Remote */}
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {callStatus !== 'in_call' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/95">
                            <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center text-3xl mb-3">
                                👤
                            </div>
                            <p className="text-gray-200 font-medium">{sessionInfo?.partnerName}</p>
                            <p className="text-gray-500 text-xs mt-1 animate-pulse">{statusMsg}</p>
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white">
                        {sessionInfo?.partnerName}
                    </div>
                </div>

                {/* Local — BUG FIX #2: video element stays in DOM during screen share */}
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    {showLocalVideo ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>
                            {/* Placeholder when no camera and not sharing */}
                            <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                                <FaVideoSlash className="text-4xl" />
                                <span className="text-xs">{isCamOff ? 'Camera off' : 'No camera'}</span>
                            </div>
                            {/* Keep ref mounted but hidden so tracks still work */}
                            <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
                        </>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white">
                        {isSharing ? '🖥️ Your screen' : `You (${sessionInfo?.myRole})`}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4 bg-gray-800 border-t border-gray-700 shrink-0">

                {/* Mute */}
                <button
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                        isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                >
                    {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>

                {/* Camera — BUG FIX #5: disabled while sharing screen */}
                <button
                    onClick={toggleCamera}
                    disabled={!hasCamera || isSharing}
                    title={
                        isSharing         ? 'Camera unavailable while screen sharing'
                        : !hasCamera      ? 'No camera available'
                        : isCamOff        ? 'Turn camera on'
                        :                   'Turn camera off'
                    }
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                        !hasCamera || isSharing
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : isCamOff
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                >
                    {isCamOff ? <FaVideoSlash /> : <FaVideo />}
                </button>

                {/* Screen share */}
                <button
                    onClick={isSharing ? stopScreenShare : startScreenShare}
                    title={isSharing ? 'Stop sharing screen' : 'Share your screen'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                        isSharing
                            ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400'
                            : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                >
                    {isSharing ? <FaStop className="text-sm" /> : <FaDesktop />}
                </button>

                {/* End call */}
                <button
                    onClick={handleEndCall}
                    title="End call"
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg"
                >
                    <FaPhoneSlash className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default VideoCallPage;