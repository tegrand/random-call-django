import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import config from '../config';

const VideoCall = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [matchAttempts, setMatchAttempts] = useState(0);
    
    const navigate = useNavigate();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatRef = useRef(null);
    
    const {
        user,
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

    // Initialize local stream when component mounts
    useEffect(() => {
        const initializeLocalStream = async () => {
            if (!localStream) {
                try {
                    await webrtcService.initializeStream();
                } catch (error) {
                    console.error('Failed to initialize local stream:', error);
                }
            }
        };
        
        initializeLocalStream();
    }, []);

    // Initialize WebRTC when matched
    useEffect(() => {
        if (matchedUser && currentCall) {
            initializeWebRTC();
        }
    }, [matchedUser, currentCall]);

    const initializeWebRTC = async () => {
        try {
            // First, initialize the local stream if not already done
            if (!localStream) {
                await webrtcService.initializeStream();
            }
            
            // Create peer connection
            webrtcService.createPeerConnection(true); // Initiator
            
            // Set up WebRTC signal handling
            webrtcService.on('onSignal', (signal) => {
                wsService.send({
                    type: signal.type,
                    data: signal
                });
            });
            
            // Create and send offer
            setTimeout(async () => {
                try {
                    await webrtcService.createOffer();
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }, 2000);
            
            setIsLoading(false);
        } catch (error) {
            console.error('WebRTC initialization error:', error);
            clearError();
        }
    };

    // Initialize WebSocket connection
    useEffect(() => {
        if (currentCall && user) {
            const wsUrl = `${config.WS_BASE_URL}/ws/video_call/${currentCall.id}/?username=${user.username}`;
            wsService.connect(wsUrl);
            
            wsService.on('onMessage', handleWebSocketMessage);
            wsService.on('onError', handleWebSocketError);
            
            return () => {
                wsService.disconnect();
            };
        }
    }, [currentCall, user, wsService]);

    // Handle WebSocket messages
    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'offer':
                webrtcService.handleSignal(data.data);
                break;
            case 'answer':
                webrtcService.handleSignal(data.data);
                break;
            case 'ice-candidate':
                webrtcService.handleSignal(data.data);
                break;
            case 'chat_message':
                // Handle incoming chat message
                break;
            case 'user_joined':
                console.log('User joined:', data.data);
                break;
            case 'user_left':
                console.log('User left:', data.data);
                handleUserLeft();
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const handleWebSocketError = (error) => {
        console.error('WebSocket error:', error);
        clearError();
    };

    // Update video elements when streams change
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(error => {
                console.error('Error playing local video:', error);
            });
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(error => {
                console.error('Error playing remote video:', error);
            });
        }
    }, [remoteStream]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    // Handle errors
    useEffect(() => {
        if (error) {
            alert(error);
            clearError();
        }
    }, [error, clearError]);

    // Find match periodically
    useEffect(() => {
        if (isLookingForMatch && !matchedUser) {
            const findMatchInterval = setInterval(async () => {
                try {
                    const result = await findMatch();
                    
                    if (result.matched) {
                        clearInterval(findMatchInterval);
                    } else {
                        setMatchAttempts(prev => prev + 1);
                    }
                } catch (error) {
                    console.error('Error finding match:', error);
                    setMatchAttempts(prev => prev + 1);
                }
            }, 3000);

            return () => clearInterval(findMatchInterval);
        }
    }, [isLookingForMatch, matchedUser, findMatch, matchAttempts]);

    // Set loading to false when we have a local stream
    useEffect(() => {
        if (localStream && isLoading) {
            setIsLoading(false);
        }
    }, [localStream, isLoading]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() && currentCall) {
            try {
                await sendMessage(newMessage);
                setNewMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleSkip = async () => {
        if (confirm('Are you sure you want to skip this person?')) {
            try {
                await skipCall();
                navigate('/');
            } catch (error) {
                console.error('Error skipping call:', error);
            }
        }
    };

    const handleEndCall = async () => {
        if (confirm('Are you sure you want to end the call?')) {
            try {
                await endCall();
                navigate('/');
            } catch (error) {
                console.error('Error ending call:', error);
            }
        }
    };

    const handleUserLeft = () => {
        alert('The other person has left the call.');
        navigate('/');
    };

    const handleClearChat = async () => {
        if (confirm('Are you sure you want to clear the chat?')) {
            try {
                await clearMessages();
            } catch (error) {
                console.error('Error clearing messages:', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Loading Screen */}
            {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        {isLookingForMatch ? (
                            <>
                                <p className="text-white text-lg">Looking for someone to connect with...</p>
                                <p className="text-gray-400 text-sm mt-2">Attempt {matchAttempts + 1}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-white text-lg">Connecting to random person...</p>
                                <p className="text-gray-400 text-sm mt-2">Please wait</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="text-white">
                            <h1 className="font-semibold">Random Call</h1>
                            {isConnected && (
                                <p className="text-sm text-gray-300">{formatTime(callDuration)}</p>
                            )}
                            {matchedUser && (
                                <p className="text-sm text-green-400">Connected with {matchedUser.username}</p>
                            )}
                            {user && (
                                <p className="text-xs text-gray-400">You: {user.username}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            End Call
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Video Area */}
            <div className="pt-20 pb-32 px-4 h-screen">
                <div className="h-full flex flex-col lg:flex-row gap-4">
                    {/* Remote Video (Main) */}
                    <div className="flex-1 relative bg-black rounded-2xl overflow-hidden">
                        {!remoteStream ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">
                                        {isLookingForMatch ? 'Looking for someone...' : 'Connecting...'}
                                    </p>
                                    {matchedUser && (
                                        <p className="text-green-400 text-sm mt-2">Matched with: {matchedUser.username}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        )}
                        
                        {/* Connection Status */}
                        {remoteStream && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                Connected
                            </div>
                        )}
                    </div>

                    {/* Local Video (Picture-in-Picture) */}
                    <div className="lg:w-80 h-48 lg:h-auto bg-black rounded-2xl overflow-hidden relative">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                    </svg>
                                    <p className="text-gray-400 text-sm">Loading camera...</p>
                                </div>
                            </div>
                        )}
                        {isVideoOff && localStream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                    </svg>
                                    <p className="text-gray-400 text-sm">Camera Off</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Local Video Label */}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            You
                        </div>
                    </div>

                    {/* Chat Panel */}
                    {isChatOpen && (
                        <div className="lg:w-80 h-96 lg:h-auto bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex flex-col">
                            <div className="p-4 border-b border-white border-opacity-20 flex justify-between items-center">
                                <h3 className="text-white font-semibold">Chat</h3>
                                <button
                                    onClick={handleClearChat}
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    Clear
                                </button>
                            </div>
                            
                            <div 
                                ref={chatRef}
                                className="flex-1 p-4 overflow-y-auto space-y-3"
                            >
                                {messages.length === 0 ? (
                                    <p className="text-gray-400 text-center text-sm">No messages yet. Start the conversation!</p>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-3 py-2 rounded-lg ${
                                                    message.sender === 'me'
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-gray-600 text-white'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white border-opacity-20">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 bg-white bg-opacity-20 text-white placeholder-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-4 p-6">
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isMuted 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            {isMuted ? (
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.5l3.883-2.794a1 1 0 011.617.794zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            ) : (
                                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.5l3.883-2.794a1 1 0 011.617.794zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                            )}
                        </svg>
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isVideoOff 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            {isVideoOff ? (
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            ) : (
                                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            )}
                        </svg>
                    </button>

                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isChatOpen 
                                ? 'bg-purple-500 hover:bg-purple-600' 
                                : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-all"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
