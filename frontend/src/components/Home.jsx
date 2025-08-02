import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Home = () => {
    const [step, setStep] = useState('welcome'); // welcome, age-verification, camera-permission, ready
    const [isAdult, setIsAdult] = useState(null);
    const [cameraPermission, setCameraPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    
    const { 
        user, 
        registerUser, 
        createCall, 
        webrtcService, 
        localStream, 
        error, 
        clearError 
    } = useApp();

    const handleAgeVerification = (adult) => {
        setIsAdult(adult);
        if (adult) {
            setStep('camera-permission');
        } else {
            alert('You must be 18 or older to use this service.');
        }
    };

    const requestCameraPermission = async () => {
        setIsLoading(true);
        try {
            await webrtcService.initializeStream();
            setCameraPermission(true);
            setStep('ready');
            
            // Set video stream to preview
            if (videoRef.current && localStream) {
                videoRef.current.srcObject = localStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Camera access is required to use this service. Please allow camera permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    const startRandomCall = async () => {
        if (localStream) {
            setIsLoading(true);
            try {
                // Auto-register user if not already registered
                if (!user) {
                    await registerUser();
                }
                
                await createCall();
                navigate('/call');
            } catch (error) {
                console.error('Error creating call:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Cleanup stream on component unmount
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    // Update video preview when localStream changes
    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Handle errors
    useEffect(() => {
        if (error) {
            alert(error);
            clearError();
        }
    }, [error, clearError]);

    // Welcome Screen
    if (step === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            Random Call
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Connect with people around the world through random video calls
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => setStep('age-verification')}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            Start Random Call
                        </button>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-2">Safe & Secure</h3>
                            <p className="text-gray-400 text-sm">Your privacy is our priority</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-2">Global Community</h3>
                            <p className="text-gray-400 text-sm">Meet people worldwide</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-pink-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-2">Instant Connection</h3>
                            <p className="text-gray-400 text-sm">Start chatting immediately</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Age Verification Screen
    if (step === 'age-verification') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Age Verification
                        </h2>
                        <p className="text-gray-300 mb-8">
                            You must be 18 or older to use this service. Please confirm your age.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button
                            onClick={() => handleAgeVerification(true)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200"
                        >
                            I am 18 or older
                        </button>
                        <button
                            onClick={() => handleAgeVerification(false)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200"
                        >
                            I am under 18
                        </button>
                        <button
                            onClick={() => setStep('welcome')}
                            className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Camera Permission Screen
    if (step === 'camera-permission') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Camera Access
                        </h2>
                        <p className="text-gray-300 mb-8">
                            We need access to your camera and microphone to enable video calls. Please allow permissions when prompted.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button
                            onClick={requestCameraPermission}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Requesting Permission...
                                </div>
                            ) : (
                                'Allow Camera Access'
                            )}
                        </button>
                        <button
                            onClick={() => setStep('age-verification')}
                            className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Ready Screen
    if (step === 'ready') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            You're Ready!
                        </h2>
                        <p className="text-gray-300">
                            Your camera is working. Click the button below to start a random video call.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Camera Preview */}
                        <div className="relative">
                            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-64 md:h-80 object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                    Camera Preview
                                </div>
                            </div>
                        </div>
                        
                        {/* Call Controls */}
                        <div className="space-y-6">
                            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Ready to Connect?</h3>
                                <p className="text-gray-300 mb-6">
                                    You'll be matched with a random person from around the world. Make sure you're in a well-lit area and ready to chat!
                                </p>
                                
                                <div className="space-y-4">
                                    <button
                                        onClick={startRandomCall}
                                        disabled={isLoading}
                                        className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating Call...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                </svg>
                                                Start Random Call
                                            </div>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={() => setStep('camera-permission')}
                                        className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
                                    >
                                        Change Camera Settings
                                    </button>
                                </div>
                            </div>
                            
                            {/* Tips */}
                            <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-4">
                                <h4 className="text-white font-semibold mb-3">Quick Tips:</h4>
                                <ul className="text-gray-300 text-sm space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Be respectful and friendly
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        You can skip to the next person anytime
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Report inappropriate behavior
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default Home;
