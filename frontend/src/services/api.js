import axios from 'axios';
import config from '../config';

// Create API instance with fallback mechanism
const createApiInstance = () => {
    const baseURL = config.API_BASE_URL;
    console.log('Creating API instance with baseURL:', baseURL);
    
    const api = axios.create({
        baseURL: baseURL,
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
                        const response = await axios.post(`${config.DIRECT_BACKEND_URL}${config.endpoints.tokenRefresh}`, {
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

    return api;
};

// Create the main API instance
let api = createApiInstance();

// Function to recreate API instance with different base URL (for fallback)
const recreateApiInstance = (newBaseURL) => {
    console.log('Recreating API instance with new baseURL:', newBaseURL);
    api = axios.create({
        baseURL: newBaseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    // Re-add interceptors
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );
};

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
            return await api[method](endpoint, data);
        }
    } catch (error) {
        console.log('API call failed with proxy, trying direct backend...');
        
        // If proxy fails, try direct backend
        if (!useDirectBackend && error.code === 'ERR_NETWORK') {
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

export default api; 