import React from 'react';

const formatWhen = (value) => {
  if (!value) return '';
  const then = new Date(value);
  const minutes = Math.round((Date.now() - then.getTime()) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / (60 * 24))}d ago`;
  return then.toLocaleDateString();
};

const HistoryPanel = ({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onDelete,
  onNewChat,
}) => (
  <aside className="history-panel" aria-label="Chat history">
    <div className="history-header">
      <h2 className="history-title">Chats</h2>
      <button type="button" className="history-new-btn" onClick={onNewChat}>
        New
      </button>
    </div>

    <div className="history-list">
      {isLoading && conversations.length === 0 && (
        <p className="history-empty">Loading…</p>
      )}

      {!isLoading && conversations.length === 0 && (
        <p className="history-empty">Your chats appear here once you ask something.</p>
      )}

      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`history-item ${conversation.id === activeId ? 'is-active' : ''}`}
        >
          {/* The row is a button rather than a div so it is reachable by keyboard. */}
          <button
            type="button"
            className="history-item-main"
            onClick={() => onSelect(conversation.id)}
            title={conversation.title}
          >
            <span className="history-item-title">{conversation.title}</span>
            <span className="history-item-when">{formatWhen(conversation.updatedAt)}</span>
          </button>
          <button
            type="button"
            className="history-item-delete"
            onClick={() => onDelete(conversation)}
            title="Delete chat"
            aria-label={`Delete ${conversation.title}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </aside>
);

export default HistoryPanel;
