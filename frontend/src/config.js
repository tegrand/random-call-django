// Configuration for the application
const config = {
    // Backend API URL - Handle CSP issues with multiple fallback options
    get API_BASE_URL() {
        // In development, use localhost
        if (process.env.NODE_ENV === 'development') {
            return 'http://127.0.0.1:8000';
        }
        
        // Check if we're on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            return 'http://127.0.0.1:8000';
        }
        
        // For production, try to detect if proxy is working
        // If not, we'll need to use a different approach
        console.log('Current origin:', window.location.origin);
        console.log('Current hostname:', window.location.hostname);
        
        // Try to use proxy first
        return window.location.origin;
    },
    
    // WebSocket URL - Handle CSP for WebSocket connections
    get WS_BASE_URL() {
        const baseUrl = this.API_BASE_URL;
        
        // For WebSocket, we need to use the direct backend URL
        // since WebSocket proxy is more complex
        if (baseUrl === window.location.origin) {
            return 'wss://random-call-django-production.up.railway.app';
        }
        return baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    },
    
    // Development mode
    isDevelopment: process.env.NODE_ENV === 'development',
    
    // API endpoints - Use proxy paths
    endpoints: {
        register: '/api/v1/register/',
        createCall: '/api/v1/call/create/',
        findMatch: '/api/v1/call/find-match/',
        skipCall: '/api/v1/call/skip/',
        endCall: '/api/v1/call/end/',
        sendMessage: (callId) => `/api/v1/call/${callId}/messages/send/`,
        getMessages: (callId) => `/api/v1/call/${callId}/messages/`,
        clearMessages: (callId) => `/api/v1/call/${callId}/messages/clear/`,
        tokenRefresh: '/api/token/refresh/',
    },
    
    // Direct backend URL for fallback
    get DIRECT_BACKEND_URL() {
        return 'https://random-call-django-production.up.railway.app';
    }
};

export default config; 