import axios from 'axios';

// Create axios instance
const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                        refresh: refreshToken
                    });
                    
                    const { access } = response.data;
                    localStorage.setItem('access_token', access);
                    
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    // Refresh token failed, redirect to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/';
                    return Promise.reject(refreshError);
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export default instance;