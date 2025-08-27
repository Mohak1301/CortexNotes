import React, { useState, useCallback, useEffect } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { apiFetch, handleApiResponse } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';

const MAX_DOCUMENTS = 4;

function MainApp({ 
  sources, 
  onFileUpload, 
  isUploading, 
  onSourceDeleted, 
  onSourcesCleared, 
  maxDocuments = 4,
  showSourcesPanel = true,
  setShowSourcesPanel
}) {
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle page refresh - clear vector DB and localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sources from backend on page refresh/close
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
    <div className={`main-app-container ${!showSourcesPanel ? 'chat-only' : ''}`}>
      {showSourcesPanel && (
        <SourcesPanel 
          sources={sources}
          onFileUpload={onFileUpload}
          isLoading={isUploading}
          onSourceDeleted={onSourceDeleted}
          onSourcesCleared={onSourcesCleared}
          maxDocuments={maxDocuments}
          currentCount={sources.length}
        />
      )}
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
