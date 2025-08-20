// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // In development, use relative URL (proxy will handle it)
  if (process.env.NODE_ENV === 'development') {
    return `/${cleanEndpoint}`;
  }
  
  // In production, use full URL
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',
  
  // Chat endpoints
  CHAT: '/api/chat',
  
  // Upload endpoints
  PDF_UPLOAD: '/api/pdfupload',
  TEXT_UPLOAD: '/api/text',
  LINK_UPLOAD: '/api/link',
  
  // Sources endpoints
  SOURCES: '/api/sources',
};

export default getApiUrl;
