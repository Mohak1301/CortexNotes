// API Configuration
// Handle both development and production environments
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Check if we're in development mode
  const configuredBaseUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, '');
  if (configuredBaseUrl) return `${configuredBaseUrl}/${cleanEndpoint}`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, call the backend directly
    return `http://localhost:5000/${cleanEndpoint}`;
  } else {
    // In production, use relative URL - Vercel rewrite will handle routing to backend
    return `/${cleanEndpoint}`;
  }
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_DEMO: '/api/auth/demo',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_SESSION: '/api/auth/session',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RECOVER_SESSION: '/api/auth/recover-session',
  AUTH_PASSWORD: '/api/auth/password',
  AUTH_RESEND_CONFIRMATION: '/api/auth/resend-confirmation',
  // Chat endpoints
  CHAT: '/api/chat',
  
  // Upload endpoints
  PDF_UPLOAD: '/api/pdfupload',
  TEXT_UPLOAD: '/api/text',
  LINK_UPLOAD: '/api/link',
  
  // Chat history endpoints
  CONVERSATIONS: '/api/conversations',
  CONVERSATION: (conversationId) => `/api/conversations/${conversationId}`,

  // Sources management endpoints
  DELETE_SOURCE: (sourceId) => `/api/sources/${sourceId}`,
  CLEAR_ALL_SOURCES: '/api/sources',
  LIST_SOURCES: '/api/sources',
};

export default getApiUrl;
