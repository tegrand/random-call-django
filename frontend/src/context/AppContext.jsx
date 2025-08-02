import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { register, createCall, findMatch, skipCall, endCall, sendMessage, clearMessages } from '../services/api';
import WebSocketService from '../services/websocket';
import WebRTCService from '../services/webrtc';

const AppContext = createContext();

const initialState = {
    user: null,
    currentCall: null,
    matchedUser: null,
    isConnected: false,
    isLookingForMatch: false,
    messages: [],
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
    error: null
};

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_CURRENT_CALL':
            return { ...state, currentCall: action.payload };
        case 'SET_MATCHED_USER':
            return { ...state, matchedUser: action.payload };
        case 'SET_CONNECTED':
            return { ...state, isConnected: action.payload };
        case 'SET_LOOKING_FOR_MATCH':
            return { ...state, isLookingForMatch: action.payload };
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'CLEAR_MESSAGES':
            return { ...state, messages: [] };
        case 'SET_LOCAL_STREAM':
            return { ...state, localStream: action.payload };
        case 'SET_REMOTE_STREAM':
            return { ...state, remoteStream: action.payload };
        case 'SET_MUTED':
            return { ...state, isMuted: action.payload };
        case 'SET_VIDEO_OFF':
            return { ...state, isVideoOff: action.payload };
        case 'SET_CALL_DURATION':
            return { ...state, callDuration: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'RESET_CALL':
            return {
                ...state,
                currentCall: null,
                matchedUser: null,
                isConnected: false,
                isLookingForMatch: false,
                messages: [],
                remoteStream: null,
                callDuration: 0
            };
        default:
            return state;
    }
};

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [wsService] = React.useState(new WebSocketService());
    const [webrtcService] = React.useState(new WebRTCService());

    // Check for existing authentication on app startup
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // User is already authenticated, we can restore their session
            // For now, we'll just clear the token and let them register again
            // In a real app, you'd validate the token and restore the user session
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }, []);

    // Initialize WebRTC callbacks
    useEffect(() => {
        webrtcService.on('onLocalStream', (stream) => {
            dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
        });

        webrtcService.on('onRemoteStream', (stream) => {
            dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
        });

        webrtcService.on('onConnect', () => {
            dispatch({ type: 'SET_CONNECTED', payload: true });
        });

        webrtcService.on('onError', (error) => {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        });
    }, [webrtcService]);

    // Call duration timer
    useEffect(() => {
        let interval;
        if (state.isConnected && state.currentCall) {
            interval = setInterval(() => {
                dispatch({ type: 'SET_CALL_DURATION', payload: state.callDuration + 1 });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isConnected, state.currentCall, state.callDuration]);

    const registerUser = async () => {
        try {
            console.log('Registering user...');
            const response = await register();
            console.log('Registration response:', response.data);
            
            // Store authentication tokens
            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
                console.log('Tokens stored in localStorage');
                console.log('Access token:', response.data.access_token.substring(0, 20) + '...');
                console.log('Refresh token:', response.data.refresh_token.substring(0, 20) + '...');
            } else {
                console.error('No access_token in response');
            }
            
            dispatch({ type: 'SET_USER', payload: response.data.user });
            return response.data.user;
        } catch (error) {
            console.error('Registration error:', error);
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Registration failed' });
            throw error;
        }
    };

    const createCallAction = async () => {
        try {
            // Initialize local stream first
            console.log('Initializing local stream for call...');
            await webrtcService.initializeStream();
            
            const response = await createCall();
            dispatch({ type: 'SET_CURRENT_CALL', payload: response.data });
            dispatch({ type: 'SET_LOOKING_FOR_MATCH', payload: true });
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to create call' });
            throw error;
        }
    };

    const findMatchAction = async () => {
        try {
            const response = await findMatch();
            if (response.data.matched) {
                dispatch({ type: 'SET_MATCHED_USER', payload: response.data.matched_user });
                dispatch({ type: 'SET_LOOKING_FOR_MATCH', payload: false });
                // Update the current call with match type information
                if (state.currentCall) {
                    dispatch({ 
                        type: 'SET_CURRENT_CALL', 
                        payload: { 
                            ...state.currentCall, 
                            match_type: response.data.match_type 
                        } 
                    });
                }
                return response.data;
            }
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to find match' });
            throw error;
        }
    };

    const skipCallAction = async () => {
        try {
            console.log('Skipping call...');
            console.log('Current tokens in localStorage:');
            console.log('Access token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
            console.log('Refresh token:', localStorage.getItem('refresh_token') ? 'Present' : 'Missing');
            
            await skipCall();
            dispatch({ type: 'RESET_CALL' });
            webrtcService.destroy();
        } catch (error) {
            console.error('Skip call error:', error);
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to skip call' });
            throw error;
        }
    };

    const endCallAction = async () => {
        try {
            await endCall();
            dispatch({ type: 'RESET_CALL' });
            webrtcService.destroy();
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to end call' });
            throw error;
        }
    };

    const sendMessageAction = async (content) => {
        if (!state.currentCall) return;
        
        try {
            const response = await sendMessage(state.currentCall.id, content);
            dispatch({ type: 'ADD_MESSAGE', payload: response.data });
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to send message' });
            throw error;
        }
    };

    const clearMessagesAction = async () => {
        if (!state.currentCall) return;
        
        try {
            await clearMessages(state.currentCall.id);
            dispatch({ type: 'CLEAR_MESSAGES' });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to clear messages' });
            throw error;
        }
    };

    const toggleMute = () => {
        if (state.localStream) {
            const audioTrack = state.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                dispatch({ type: 'SET_MUTED', payload: !audioTrack.enabled });
            }
        }
    };

    const toggleVideo = () => {
        if (state.localStream) {
            const videoTrack = state.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                dispatch({ type: 'SET_VIDEO_OFF', payload: !videoTrack.enabled });
            }
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        wsService,
        webrtcService,
        registerUser,
        createCall: createCallAction,
        findMatch: findMatchAction,
        skipCall: skipCallAction,
        endCall: endCallAction,
        sendMessage: sendMessageAction,
        clearMessages: clearMessagesAction,
        toggleMute,
        toggleVideo,
        clearError
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}; 