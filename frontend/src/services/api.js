import axios from './axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = {
    // User management
    register: () => axios.post(`${API_BASE_URL}/users/register/`),
    updateStatus: () => axios.post(`${API_BASE_URL}/users/status/`),
    logout: () => axios.post(`${API_BASE_URL}/users/logout/`),

    // Video call management
    createCall: () => axios.post(`${API_BASE_URL}/users/call/create/`),
    findMatch: () => axios.post(`${API_BASE_URL}/users/call/find-match/`),
    skipCall: () => axios.post(`${API_BASE_URL}/users/call/skip/`),
    endCall: () => axios.post(`${API_BASE_URL}/users/call/end/`),

    // Chat management
    getMessages: (callId) => axios.get(`${API_BASE_URL}/users/call/${callId}/messages/`),
    sendMessage: (callId, content) => axios.post(`${API_BASE_URL}/users/call/${callId}/messages/send/`, { content }),
    clearMessages: (callId) => axios.post(`${API_BASE_URL}/users/call/${callId}/messages/clear/`),
};

export default api; 