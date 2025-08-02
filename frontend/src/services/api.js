import axios from 'axios';
import config from '../config';

const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        console.log('Request interceptor - Token:', token ? 'Present' : 'Missing');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Added Authorization header');
        } else {
            console.log('No token found in localStorage');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('401 error detected, attempting token refresh...');
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${config.API_BASE_URL}${config.endpoints.tokenRefresh}`, {
                        refresh: refreshToken
                    });
                    
                    const { access } = response.data;
                    localStorage.setItem('access_token', access);
                    console.log('Token refreshed successfully');
                    
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                } else {
                    console.log('No refresh token found');
                }
            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError);
                // Refresh failed, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/';
            }
        }
        
        return Promise.reject(error);
    }
);

// API functions
export const register = () => api.post(config.endpoints.register);
export const createCall = () => api.post(config.endpoints.createCall);
export const findMatch = () => api.post(config.endpoints.findMatch);
export const skipCall = () => api.post(config.endpoints.skipCall);
export const endCall = () => api.post(config.endpoints.endCall);
export const sendMessage = (callId, content) => api.post(config.endpoints.sendMessage(callId), { content });
export const getMessages = (callId) => api.get(config.endpoints.getMessages(callId));
export const clearMessages = (callId) => api.post(config.endpoints.clearMessages(callId));

export default api; 