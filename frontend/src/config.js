// Configuration for the application
const config = {
    // Backend API URL - Try different approaches to handle CSP
    get API_BASE_URL() {
        // In development, use localhost
        if (process.env.NODE_ENV === 'development') {
            return 'http://127.0.0.1:8000';
        }
        
        // In production, try to use proxy first, then direct backend
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            return 'http://127.0.0.1:8000';
        }
        
        // For deployed frontend, use proxy approach
        return window.location.origin;
    },
    
    // WebSocket URL - Will be automatically generated from API_BASE_URL
    get WS_BASE_URL() {
        const baseUrl = this.API_BASE_URL;
        // For WebSocket, we need to use the direct backend URL
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
    }
};

export default config; 