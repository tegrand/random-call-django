import axios from 'axios';
import config from '../config';

// API functions with fallback mechanism
const apiCall = async (method, endpoint, data = null, useDirectBackend = false) => {
    try {
        if (useDirectBackend) {
            // Use direct backend URL
            const url = `${config.DIRECT_BACKEND_URL}${endpoint}`;
            console.log('Using direct backend URL:', url);
            
            const response = await axios({
                method,
                url,
                data,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            return response;
        } else {
            // Use proxy approach
            const baseURL = config.API_BASE_URL;
            console.log('Using proxy URL:', baseURL + endpoint);
            
            const response = await axios({
                method,
                url: baseURL + endpoint,
                data,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            return response;
        }
    } catch (error) {
        console.log('API call failed with proxy, trying direct backend...');
        console.log('Error details:', error.message, error.code);
        
        // If proxy fails, try direct backend
        if (!useDirectBackend && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
            console.log('Attempting fallback to direct backend...');
            return apiCall(method, endpoint, data, true);
        }
        
        throw error;
    }
};

// API functions
export const register = () => apiCall('post', config.endpoints.register);
export const createCall = () => apiCall('post', config.endpoints.createCall);
export const findMatch = () => apiCall('post', config.endpoints.findMatch);
export const skipCall = () => apiCall('post', config.endpoints.skipCall);
export const endCall = () => apiCall('post', config.endpoints.endCall);
export const sendMessage = (callId, content) => apiCall('post', config.endpoints.sendMessage(callId), { content });
export const getMessages = (callId) => apiCall('get', config.endpoints.getMessages(callId));
export const clearMessages = (callId) => apiCall('post', config.endpoints.clearMessages(callId));

// Create a simple API instance for backward compatibility
const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api; 