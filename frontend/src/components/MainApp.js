import React, { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api.js';
import { streamApi } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';

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

  // Clear chat messages when sources are cleared
  useEffect(() => {
    if (sources.length === 0) {
      setMessages([]);
    }
  }, [sources.length]);

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

    const assistantId = Date.now() + 1;

    try {
      // Sources land before the first token, so whichever event arrives first
      // creates the bubble and later events update it in place.
      const updateAssistant = (update) => setMessages(prev => {
        const existing = prev.find(item => item.id === assistantId);
        if (!existing) {
          const blank = {
            id: assistantId,
            type: 'assistant',
            content: '',
            sources: [],
            timestamp: new Date()
          };
          return [...prev, { ...blank, ...update(blank) }];
        }
        return prev.map(item => (
          item.id === assistantId ? { ...item, ...update(item) } : item
        ));
      });

      const response = await streamApi(
        API_ENDPOINTS.CHAT,
        { method: 'POST', body: JSON.stringify({ message }) },
        (event) => {
          if (event.sources) {
            updateAssistant(() => ({ sources: event.sources }));
            // The bubble is on screen now and carries its own pending state,
            // so a second placeholder bubble would only duplicate it.
            setIsChatLoading(false);
            return;
          }
          if (event.delta) {
            updateAssistant(item => ({ content: item.content + event.delta }));
            setIsChatLoading(false);
          }
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error(error.name === 'AbortError' ? 'The request timed out. Please try again.' : 'Could not reach the service. Please try again.');
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
      
    </div>
  );
}

export default MainApp;
