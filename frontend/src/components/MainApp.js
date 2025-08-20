import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { apiFetch, handleApiResponse } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';

function MainApp() {
  const { getAuthHeaders, user, updateUser, refreshAccessToken } = useAuth();
  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  const handleFileUpload = useCallback(async (files) => {
    // Handle direct source objects (for text/url)
    if (Array.isArray(files) && files[0] && typeof files[0] === 'object' && files[0].id) {
      setSources(prev => [...prev, ...files]);
      return;
    }

    // Handle file uploads (PDF)
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        formData.append('pdf', file);
        
        try {
          setIsUploading(true);
          const response = await fetch(getApiUrl(API_ENDPOINTS.PDF_UPLOAD), {
            method: 'POST',
            headers: {
              'Authorization': getAuthHeaders().Authorization,
            },
            body: formData,
          });
          
          if (response.ok) {
            const data = await response.json();
            // Add the new source to the list
            if (data.source) {
              setSources(prev => [...prev, data.source]);
            }
          } else {
            console.error('Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
        } finally {
          setIsUploading(false);
        }
      }
    }
  }, [getAuthHeaders]);

  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CHAT), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      });

      // Handle session expiration
      if (response.status === 401) {
        try {
          await refreshAccessToken();
          // Retry the request with new token
          const retryResponse = await fetch(getApiUrl(API_ENDPOINTS.CHAT), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message }),
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            const assistantMessage = {
              id: Date.now() + 1,
              type: 'assistant',
              content: data.reply,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            if (data.queryCount !== undefined && updateUser) {
              updateUser({
                ...user,
                queryCount: data.queryCount,
                queryLimit: data.queryLimit
              });
            }
          } else {
            toast.error('Failed to send message. Please try again.');
          }
        } catch (refreshError) {
          toast.error('Session expired. Please log in again.');
        }
      } else if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.queryCount !== undefined && updateUser) {
          updateUser({
            ...user,
            queryCount: data.queryCount,
            queryLimit: data.queryLimit
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  }, [getAuthHeaders, refreshAccessToken, updateUser, user]);

  // Fetch user sources on component mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.SOURCES), {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        
        // Handle session expiration
        if (response.status === 401) {
          try {
            await refreshAccessToken();
            // Retry the request with new token
            const retryResponse = await fetch(getApiUrl(API_ENDPOINTS.SOURCES), {
              method: 'GET',
              headers: getAuthHeaders(),
            });
            
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              setSources(data.sources || []);
            } else {
              toast.error('Failed to load sources');
            }
          } catch (refreshError) {
            toast.error('Session expired. Please log in again.');
          }
        } else if (response.ok) {
          const data = await response.json();
          setSources(data.sources || []);
        } else {
          const errorData = await response.json();
          toast.error('Failed to load sources');
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
        toast.error('Failed to load sources');
      } finally {
        setIsLoadingSources(false);
      }
    };

    fetchSources();
  }, [getAuthHeaders, refreshAccessToken]);
  
  return (
    <div className="main-app-container">
      <SourcesPanel 
        sources={sources}
        onFileUpload={handleFileUpload}
        isLoading={isUploading || isLoadingSources}
      />
      {isUploading && (
        <div className="loading-overlay">
          <div className="loading">
            <span>Uploading and processing file...</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}
      <ChatPanel 
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        sourcesCount={sources.length}
      />
      {/* Fallback in case components don't load */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        color: 'white',
        display: 'none' // Hidden by default
      }}>
        Loading components...
      </div>
    </div>
  );
}

export default MainApp;
