// src/client/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    const errorMessage = error.response?.data?.message || 'An error occurred';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response || error);
    }
    
    return Promise.reject({
      ...error,
      userMessage: errorMessage
    });
  }
);

export const emailApi = {
  sendEmail: (data) => api.post('/email/send', data),
};

export default api;