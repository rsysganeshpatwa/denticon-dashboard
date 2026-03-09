import axios from 'axios';

// Determine API base URL based on environment
// If accessed through Nginx (localhost without port or localhost:80), use /api
// If development (localhost:3000), use localhost:3001/api
const isNginxProxy = window.location.port === '' || window.location.port === '80';
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (isNginxProxy ? '/api' : 'http://localhost:3001/api');

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url, '- Token:', token.substring(0, 20) + '...');
    } else {
      console.warn('No token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (invalid/expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Patients API
export const getPatientsAPI = async () => {
  try {
    const response = await api.get('/Patient');
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

export const getPatientByIdAPI = async (id) => {
  try {
    const response = await api.get(`/Patient/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

// Appointments API
export const getAppointmentsAPI = async () => {
  try {
    const response = await api.get('/Appointment');
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

// Providers API
export const getProvidersAPI = async () => {
  try {
    const response = await api.get('/Provider');
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

// Locations API
export const getLocationsAPI = async () => {
  try {
    const response = await api.get('/Location');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export const createLocationAPI = async (locationData) => {
  try {
    const response = await api.post('/Location', locationData);
    return response.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

export const updateLocationAPI = async (id, locationData) => {
  try {
    const response = await api.put(`/Location/${id}`, locationData);
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Providers API
export const createProviderAPI = async (providerData) => {
  try {
    const response = await api.post('/Provider', providerData);
    return response.data;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

export const updateProviderAPI = async (id, providerData) => {
  try {
    const response = await api.put(`/Provider/${id}`, providerData);
    return response.data;
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
};

export const getProviderByIdAPI = async (id) => {
  try {
    const response = await api.get(`/Provider/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider:', error);
    throw error;
  }
};

export default api;
