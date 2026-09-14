import React, { useState, useRef, useEffect } from 'react';

const CITATION_PATTERN = /\[(\d+)\]/g;

// The answer streams in as plain text carrying [n] markers. Splitting on them lets
// each marker become a control tied to its source while the prose stays untouched.
// A marker with no matching source is left as literal text: the model can invent a
// number, and inventing a chip for it would be worse than showing nothing.
const renderAnswer = (content, sources = []) => {
  const parts = [];
  let cursor = 0;
  let match;

  CITATION_PATTERN.lastIndex = 0;
  while ((match = CITATION_PATTERN.exec(content)) !== null) {
    if (match.index > cursor) parts.push(content.slice(cursor, match.index));

    const number = Number(match[1]);
    const source = sources.find((item) => item.n === number);
    parts.push(source
      ? (
        <sup
          key={`cite-${number}-${match.index}`}
          className="citation"
          title={`${source.label}${source.page ? ` - page ${source.page}` : ''}`}
        >
          {number}
        </sup>
      )
      : match[0]);

    cursor = match.index + match[0].length;
  }

  if (cursor < content.length) parts.push(content.slice(cursor));
  return parts;
};

const ChatPanel = ({ messages, onSendMessage, isLoading, sourcesCount }) => {
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const suggestions = [
    'Summarize the key ideas',
    'What evidence supports the main argument?',
    'List the most important takeaways',
  ];

  return (
    <section className="main-content" aria-label="Document conversation">
      <div className="chat-context-bar">
        <div><span className="status-dot" />{sourcesCount > 0 ? `${sourcesCount} source${sourcesCount === 1 ? '' : 's'} indexed` : 'Waiting for sources'}</div>
        <span>Answers are generated from your workspace</span>
      </div>
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 && sourcesCount === 0 ? (
          <div className="chat-welcome">
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="empty-kicker">YOUR RESEARCH SPACE</span>
            <h2>Start with a source</h2>
            <p>Add a PDF, some text, or a public web page. Your conversation will stay grounded in that material.</p>
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
                <span className="empty-kicker">SOURCES READY</span>
                <h2>What would you like to understand?</h2>
                <p>Ask a specific question or start with one of these prompts.</p>
                <div className="prompt-suggestions">
                  {suggestions.map((suggestion) => <button key={suggestion} onClick={() => onSendMessage(suggestion)}>{suggestion}<ArrowIcon /></button>)}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`message message-${message.type}`}>
                <div className="message-author">{message.type === 'user' ? 'You' : 'CortexNotes'}</div>
                <div className="message-content">
                  {message.type === 'assistant' && !message.content ? (
                    <span role="status" aria-live="polite">
                      <span className="visually-hidden">Writing…</span>
                      <span className="thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                    </span>
                  ) : message.type === 'assistant' ? (
                    renderAnswer(message.content, message.sources)
                  ) : (
                    message.content
                  )}
                </div>
                {message.sources?.length > 0 && (
                  <div className="message-sources">
                    <span className="sources-label">Sources</span>
                    {message.sources.map((source) => (
                      <span key={source.n} className="source-chip" title={source.snippet}>
                        <span className="source-chip-n">{source.n}</span>
                        <span className="source-chip-label">{source.label}</span>
                        {source.page ? <span className="source-chip-page">p.{source.page}</span> : null}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-author">CortexNotes</div>
                <div className="message-content is-thinking" role="status" aria-live="polite">
                  <span className="visually-hidden">Thinking…</span>
                  <span className="thinking-dots" aria-hidden="true"><i /><i /><i /></span>
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
              placeholder={
                sourcesCount === 0 
                  ? (isMobile ? "Please upload a file" : "Please upload any resource to start a conversation")
                  : (isMobile ? "Start conversation" : "Ask me anything about your uploaded resources...")
              }
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sourcesCount === 0}
              maxLength={4000}
              aria-label="Ask about your sources"
              rows={1}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={!inputValue.trim() || isLoading || sourcesCount === 0}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
            </button>
          </form>
          
          {sourcesCount > 0 && (
            <div className="sources-count">
              {sourcesCount} source{sourcesCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ChatPanel;
