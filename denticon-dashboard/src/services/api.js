import axios from 'axios';

// Use /api for production (proxied by Nginx) or localhost:3001 for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

// Default headers for Denticon API
const headers = {
  'VendorKey': 'BCF756D4-DCE6-4F2B-BAAE-7679D87037A7',
  'ClientKey': 'AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB',
  'Pgid': '1',
  'Content-Type': 'application/json'
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: headers
});

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

// Locations API (using Practice info for now)
export const getLocationsAPI = async () => {
  try {
    const response = await api.get('/Practice');
    // Transform practice data to locations format
    const practiceData = response.data?.data;
    return {
      statusCode: 200,
      data: practiceData ? [{
        id: practiceData.id,
        name: practiceData.name,
        address: `${practiceData.address}, ${practiceData.city}, ${practiceData.state} ${practiceData.zipCode}`,
        phone: practiceData.phone,
        status: 'Open',
        totalPatients: 450,
        totalProviders: 4
      }] : []
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export default api;
