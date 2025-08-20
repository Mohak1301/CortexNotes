import { getApiUrl } from '../config/api.js';
import toast from 'react-hot-toast';

// Utility function to handle API responses and session expiration
export const handleApiResponse = async (response, authContext) => {
  if (response.status === 401) {
    // Unauthorized - try to refresh token
    try {
      const newToken = await authContext.refreshAccessToken();
      // Retry the original request with new token
      return { retry: true, newToken };
    } catch (error) {
      // Refresh failed, session expired
      toast.error('Session expired. Please log in again.');
      return { retry: false, error: 'Session expired' };
    }
  }
  
  if (response.status === 403) {
    toast.error('Access denied. Please check your permissions.');
    return { retry: false, error: 'Access denied' };
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'An error occurred';
    toast.error(errorMessage);
    return { retry: false, error: errorMessage };
  }
  
  return { retry: false, success: true };
};

// Enhanced fetch function with automatic token refresh
export const apiFetch = async (endpoint, options = {}, authContext) => {
  const url = getApiUrl(endpoint);
  
  // Add auth headers if available
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authContext?.accessToken) {
    headers.Authorization = `Bearer ${authContext.accessToken}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  let response = await fetch(url, config);
  
  // Handle 401 responses with token refresh
  if (response.status === 401 && authContext) {
    const result = await handleApiResponse(response, authContext);
    
    if (result.retry && result.newToken) {
      // Retry with new token
      headers.Authorization = `Bearer ${result.newToken}`;
      response = await fetch(url, { ...config, headers });
    } else {
      throw new Error(result.error || 'Session expired');
    }
  }
  
  return response;
};
