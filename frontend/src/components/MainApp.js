import React, { useState, useCallback, useEffect } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { apiFetch, handleApiResponse } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';

const MAX_DOCUMENTS = 4;

function MainApp() {
  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Load sources from localStorage on component mount
  useEffect(() => {
    const savedSources = localStorage.getItem('cortexNotes_sources');
    if (savedSources) {
      try {
        setSources(JSON.parse(savedSources));
      } catch (error) {
        console.error('Error loading sources from localStorage:', error);
        setSources([]);
      }
    }
    setIsLoadingSources(false);
  }, []);

  // Save sources to localStorage whenever sources change
  useEffect(() => {
    localStorage.setItem('cortexNotes_sources', JSON.stringify(sources));
  }, [sources]);

  // Handle page refresh - clear vector DB
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable cleanup on page unload
      const cleanupData = JSON.stringify({ action: 'clear_all' });
      navigator.sendBeacon(getApiUrl(API_ENDPOINTS.CLEAR_ALL_SOURCES), cleanupData);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (refresh, close, navigate away)
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleFileUpload = useCallback(async (files) => {
    // Handle direct source objects (for text/url)
    if (Array.isArray(files) && files[0] && typeof files[0] === 'object' && files[0].id) {
      // Check if adding these sources would exceed the limit
      const newSourcesCount = sources.length + files.length;
      if (newSourcesCount > MAX_DOCUMENTS) {
        toast.error(`You can only have ${MAX_DOCUMENTS} documents. Please delete some existing documents first.`);
        return;
      }
      setSources(prev => [...prev, ...files]);
      return;
    }

    // Handle file uploads (PDF)
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        // Check if adding this file would exceed the limit
        if (sources.length >= MAX_DOCUMENTS) {
          toast.error(`You can only have ${MAX_DOCUMENTS} documents. Please delete some existing documents first.`);
          return;
        }

        formData.append('pdf', file);
        
        try {
          setIsUploading(true);
          const response = await fetch(getApiUrl(API_ENDPOINTS.PDF_UPLOAD), {
            method: 'POST',
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
  }, [sources.length]);

  const handleSourceDeleted = useCallback(async (deletedSourceId) => {
    try {
      // Delete specific vectors from Qdrant Cloud
      const response = await apiFetch(API_ENDPOINTS.DELETE_SOURCE(deletedSourceId), {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setSources(prev => prev.filter(source => source.id !== deletedSourceId));
        toast.success('Source deleted successfully');
      } else {
        toast.error('Failed to delete source from vector database');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Failed to delete source');
    }
  }, []);

  const handleSourcesCleared = useCallback(async () => {
    try {
      // Clear all vectors from Qdrant Cloud
      const response = await apiFetch(API_ENDPOINTS.CLEAR_ALL_SOURCES, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Clear local state
        setSources([]);
        toast.success('All sources cleared successfully');
      } else {
        toast.error('Failed to clear sources from vector database');
      }
    } catch (error) {
      console.error('Error clearing sources:', error);
      toast.error('Failed to clear sources');
    }
  }, []);

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
      const response = await apiFetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
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
  }, []);
  
  return (
    <div className="main-app-container">
      <SourcesPanel 
        sources={sources}
        onFileUpload={handleFileUpload}
        isLoading={isUploading || isLoadingSources}
        onSourceDeleted={handleSourceDeleted}
        onSourcesCleared={handleSourcesCleared}
        maxDocuments={MAX_DOCUMENTS}
        currentCount={sources.length}
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
