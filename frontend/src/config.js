// Configuration for the application
const config = {
    // Backend API URL - Update this with your Railway URL
    API_BASE_URL: 'https://random-call-django-production.up.railway.app', // Replace with your actual Railway URL
    
    // WebSocket URL - Will be automatically generated from API_BASE_URL
    get WS_BASE_URL() {
        return this.API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    },
    
    // Development mode
    isDevelopment: process.env.NODE_ENV === 'development',
    
    // API endpoints - Fixed to match actual backend URL structure
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