import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ messages, onSendMessage, isLoading, sourcesCount }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  console.log('ChatPanel rendering with messages:', messages.length, 'sourcesCount:', sourcesCount);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="main-content">
      <div className="chat-messages">
        {messages.length === 0 && sourcesCount === 0 ? (
          <div className="chat-welcome">
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2>Add a source to get started</h2>
            <p>Upload a PDF, paste text, or add a website URL from the left panel to begin chatting.</p>
          </div>
        ) : (
          <>
            {messages.length === 0 && sourcesCount > 0 && (
              <div className="chat-welcome">
                <div className="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2>Ready to chat!</h2>
                <p>You have {sourcesCount} source{sourcesCount !== 1 ? 's' : ''} loaded. Ask me anything about your content.</p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`message message-${message.type}`}>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-content">
                  <div className="loading">
                    <span>Thinking...</span>
                    <div className="loading-dots">
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={sourcesCount === 0 ? "Please upload any resource to start a conversation" : "Ask me anything about your uploaded resources..."}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sourcesCount === 0}
              rows={1}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={!inputValue.trim() || isLoading || sourcesCount === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
            </button>
          </form>
          
          {/* Floating Robot */}
          <div className="floating-robot">
            <div className="mini-robot">
              <div className="mini-robot-head">
                <div className="mini-robot-eyes">
                  <div className="mini-robot-eye">
                    <div className="mini-eye-pupil"></div>
                  </div>
                  <div className="mini-robot-eye">
                    <div className="mini-eye-pupil"></div>
                  </div>
                </div>
                <div className="mini-robot-mouth"></div>
                <div className="mini-robot-antenna">
                  <div className="mini-antenna-ball"></div>
                </div>
              </div>
              <div className="mini-robot-body">
                <div className="mini-panel-light"></div>
                <div className="mini-panel-light"></div>
                <div className="mini-panel-light"></div>
              </div>
            </div>
          </div>

          {sourcesCount > 0 && (
            <div className="sources-count">
              {sourcesCount} source{sourcesCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
