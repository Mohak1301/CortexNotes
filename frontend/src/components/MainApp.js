import React, { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api.js';
import { apiFetch, streamApi } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';
import HistoryPanel from './HistoryPanel';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  // Demo chats are never persisted, so a history rail would always be empty.
  const isDemo = Boolean(user?.isDemo);

  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (isDemo) {
      setIsHistoryLoading(false);
      return;
    }
    try {
      const response = await apiFetch(API_ENDPOINTS.CONVERSATIONS);
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch {
      // The sidebar is not worth a toast: the chat itself still works without it.
    } finally {
      setIsHistoryLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Clearing every source starts a fresh thread. The stored conversations are
  // untouched - only the open one is closed, so the view and the id stay in step.
  useEffect(() => {
    if (sources.length === 0) {
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [sources.length]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId);
    setMessages([]);
    try {
      const response = await apiFetch(API_ENDPOINTS.CONVERSATION(conversationId));
      if (!response.ok) {
        toast.error('Could not open that chat');
        return;
      }
      const data = await response.json();
      setMessages((data.messages || []).map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })));
    } catch {
      toast.error('Could not open that chat');
    }
  }, []);

  const handleDeleteConversation = useCallback(async (conversation) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONVERSATION(conversation.id), {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        toast.error('Could not delete that chat');
        return;
      }
      setConversations((prev) => prev.filter((item) => item.id !== conversation.id));
      // Only close the view if the deleted chat is the one on screen.
      setActiveConversationId((current) => {
        if (current !== conversation.id) return current;
        setMessages([]);
        return null;
      });
    } catch {
      toast.error('Could not delete that chat');
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
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            // Omitted on a new chat: the server creates the thread and tells us its id.
            ...(activeConversationId ? { conversationId: activeConversationId } : {}),
          }),
        },
        (event) => {
          if (event.conversation) {
            setActiveConversationId(event.conversation.id);
            // A new thread has to appear in the sidebar straight away, and an
            // existing one moves to the top because the server just touched it.
            setConversations((prev) => {
              // The server only sends a title for a thread it just created. For an
              // existing one it sends null, so the title already on screen wins.
              const existing = prev.find((item) => item.id === event.conversation.id);
              const without = prev.filter((item) => item.id !== event.conversation.id);
              return [{
                id: event.conversation.id,
                title: event.conversation.title || existing?.title || 'New chat',
                updatedAt: new Date().toISOString(),
              }, ...without];
            });
            return;
          }
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
  }, [activeConversationId]);
  
  return (
    <div className={`main-app-container ${!showSourcesPanel ? 'chat-only' : ''}`}>
      {!isDemo && <HistoryPanel
        conversations={conversations}
        activeId={activeConversationId}
        isLoading={isHistoryLoading}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
      />}
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
        sources={sources}
      />
      
    </div>
  );
}

export default MainApp;
