import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import config from '../config';

const VideoCall = () => {
    const navigate = useNavigate();
    const {
        currentCall,
        matchedUser,
        isConnected,
        isLookingForMatch,
        messages,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        error,
        wsService,
        webrtcService,
        findMatch,
        skipCall,
        endCall,
        sendMessage,
        clearMessages,
        toggleMute,
        toggleVideo,
        clearError
    } = useApp();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [websocketFailed, setWebsocketFailed] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Initialize local stream when component mounts
    useEffect(() => {
        const initializeStream = async () => {
            try {
                console.log('Initializing local stream...');
                await webrtcService.initializeStream();
                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing stream:', error);
                setIsLoading(false);
            }
        };

        initializeStream();
    }, [webrtcService]);

    // Handle WebSocket connection
    useEffect(() => {
        if (!currentCall || websocketFailed) return;

        const connectWebSocket = async () => {
            try {
                const wsUrl = `${config.WS_BASE_URL}/ws/video_call/${currentCall.id}/?username=${currentCall.user.username}`;
                console.log('Connecting to WebSocket:', wsUrl);
                
                wsService.connect(wsUrl);
                
                wsService.on('message', handleWebSocketMessage);
                wsService.on('error', handleWebSocketError);
                wsService.on('close', handleWebSocketClose);
                
                // Set a timeout to fall back to polling if WebSocket fails
                setTimeout(() => {
                    if (!wsService.isConnected()) {
                        console.log('WebSocket connection failed, falling back to polling');
                        setWebsocketFailed(true);
                        startPolling();
                    }
                }, 5000);
                
            } catch (error) {
                console.error('WebSocket connection error:', error);
                setWebsocketFailed(true);
                startPolling();
            }
        };

        connectWebSocket();

        return () => {
            wsService.disconnect();
        };
    }, [currentCall, wsService, websocketFailed]);

    // Polling fallback for when WebSocket fails
    const startPolling = () => {
        console.log('Starting polling fallback');
        const interval = setInterval(async () => {
            try {
                // Poll for match status
                if (isLookingForMatch) {
                    const response = await findMatch();
                    if (response.data.matched) {
                        console.log('Match found via polling!');
                        // Handle match found
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // Poll every 2 seconds
        
        setPollingInterval(interval);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const handleWebSocketMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            switch (data.type) {
                case 'connection_established':
                    console.log('WebSocket connected successfully');
                    break;
                case 'webrtc_signal':
                    handleWebRTCSignal(data.message);
                    break;
                case 'chat_message':
                    // Handle chat message
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    const handleWebSocketError = (error) => {
        console.error('WebSocket error:', error);
        setWebsocketFailed(true);
        startPolling();
    };

    const handleWebSocketClose = () => {
        console.log('WebSocket connection closed');
        setWebsocketFailed(true);
        startPolling();
    };

    const handleWebRTCSignal = (signal) => {
        console.log('Handling WebRTC signal:', signal);
        webrtcService.handleSignal(signal);
    };

    // Initialize WebRTC when local stream is ready
    useEffect(() => {
        if (localStream && !isLoading) {
            const initializeWebRTC = async () => {
                try {
                    console.log('Initializing WebRTC...');
                    
                    // Set local stream
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = localStream;
                        try {
                            await localVideoRef.current.play();
                        } catch (error) {
                            console.error('Error playing local video:', error);
                        }
                    }

                    // Create offer after a short delay
                    setTimeout(async () => {
                        try {
                            const offer = await webrtcService.createOffer();
                            if (wsService.isConnected()) {
                                wsService.send(JSON.stringify({
                                    type: 'webrtc_signal',
                                    message: offer
                                }));
                            }
                        } catch (error) {
                            console.error('Error creating offer:', error);
                        }
                    }, 1000);

                } catch (error) {
                    console.error('Error initializing WebRTC:', error);
                }
            };

            initializeWebRTC();
        }
    }, [localStream, isLoading, webrtcService, wsService]);

    // Handle remote stream
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(error => {
                console.error('Error playing remote video:', error);
            });
        }
    }, [remoteStream]);

    const handleSkipCall = async () => {
        try {
            await skipCall();
            navigate('/');
        } catch (error) {
            console.error('Error skipping call:', error);
        }
    };

    const handleEndCall = async () => {
        try {
            await endCall();
            navigate('/');
        } catch (error) {
            console.error('Error ending call:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        
        try {
            await sendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleClearMessages = async () => {
        try {
            await clearMessages();
        } catch (error) {
            console.error('Error clearing messages:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white">Initializing camera...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 relative">
            {/* Video Container */}
            <div className="relative h-screen">
                {/* Remote Video (Full Screen) */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-white text-lg">
                                {websocketFailed ? 'Connecting via polling...' : 'Connecting...'}
                            </p>
                            {websocketFailed && (
                                <p className="text-gray-400 text-sm mt-2">
                                    WebSocket unavailable, using fallback connection
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                {localStream && (
                    <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Call Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
                    >
                        {isVideoOff ? '📹' : '📷'}
                    </button>
                    
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="p-4 rounded-full bg-gray-700 text-white hover:opacity-80 transition-opacity"
                    >
                        💬
                    </button>
                    
                    <button
                        onClick={handleSkipCall}
                        className="p-4 rounded-full bg-yellow-500 text-white hover:opacity-80 transition-opacity"
                    >
                        ⏭️
                    </button>
                    
                    <button
                        onClick={handleEndCall}
                        className="p-4 rounded-full bg-red-500 text-white hover:opacity-80 transition-opacity"
                    >
                        📞
                    </button>
                </div>

                {/* Call Duration */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                </div>

                {/* Connection Status */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    {websocketFailed ? '📡 Polling' : '🔗 WebSocket'}
                </div>
            </div>

            {/* Chat Panel */}
            {showChat && (
                <div className="absolute right-4 top-4 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Chat</h3>
                        <button
                            onClick={handleClearMessages}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map((message, index) => (
                            <div key={index} className="text-sm">
                                <span className="font-semibold">{message.sender}: </span>
                                <span>{message.content}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 border-t flex">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={clearError} className="text-white hover:text-gray-200">
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
