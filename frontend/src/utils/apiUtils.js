import { getApiUrl } from '../config/api.js';
import toast from 'react-hot-toast';

// Utility function to handle API responses
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'An error occurred';
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
  
  return { success: true };
};

// Simple fetch function without authentication
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  const response = await fetch(url, config);
  return response;
};
