import axios from 'axios';

// const API_URL = 'https://investmentapis.dailyneeds.ai';
const API_URL = 'http://localhost:5050';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  sendOtp: (phone, purpose = 'login') => api.post('/api/auth/send-otp', { phone, purpose }),
  verifyOtp: (phone, otp) => api.post('/api/auth/verify-otp', { phone, otp }),
  login: (phone) => api.post('/api/auth/login', { phone }),
};

// Submission APIs
export const submissionAPI = {
  getAll: (params) => api.get('/api/user/submissions', { params }),
  getById: (id) => api.get(`/api/user/submissions/${id}`),
  create: (data) => api.post('/api/user/submissions', data),
  update: (id, data) => api.put(`/api/user/submissions/${id}`, data),
  delete: (id) => api.delete(`/api/user/submissions/${id}`),
  saveDraft: (data) => api.post('/api/user/submissions/draft', data),
  updateDraft: (id, data) => api.put(`/api/user/submissions/draft/${id}`, data),
  submitForm: (formData) => api.post('/api/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
