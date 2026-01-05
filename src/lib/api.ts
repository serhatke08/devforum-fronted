import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devforum-backend-102j.onrender.com';

export const api = {
  get: async (endpoint: string, headers?: Record<string, string>) => {
    const response = await axios.get(`${API_URL}${endpoint}`, { headers });
    return response.data;
  },
  
  post: async (endpoint: string, data: any, headers?: Record<string, string>) => {
    const response = await axios.post(`${API_URL}${endpoint}`, data, { headers });
    return response.data;
  },
  
  put: async (endpoint: string, data: any, headers?: Record<string, string>) => {
    const response = await axios.put(`${API_URL}${endpoint}`, data, { headers });
    return response.data;
  },
  
  delete: async (endpoint: string, headers?: Record<string, string>) => {
    const response = await axios.delete(`${API_URL}${endpoint}`, { headers });
    return response.data;
  }
};

