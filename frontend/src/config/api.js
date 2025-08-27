// API Configuration
// Using Vercel rewrites, so always use relative URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Always use relative URL - Vercel rewrite will handle routing to backend
  return `/${cleanEndpoint}`;
};

// API endpoints
export const API_ENDPOINTS = {
  // Chat endpoints
  CHAT: '/api/chat',
  
  // Upload endpoints
  PDF_UPLOAD: '/api/pdfupload',
  TEXT_UPLOAD: '/api/text',
  LINK_UPLOAD: '/api/link',
  
  // Sources management endpoints
  DELETE_SOURCE: (sourceId) => `/api/sources/${sourceId}`,
  CLEAR_ALL_SOURCES: '/api/sources',
};

export default getApiUrl;
