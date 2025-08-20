import React, { useState } from 'react';

const StudioPanel = () => {
  const [selectedTool, setSelectedTool] = useState(null);

  const studioTools = [
    {
      id: 'audio',
      title: 'Audio Overview',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )
    },
    {
      id: 'video',
      title: 'Video Overview',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      )
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="5" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="5" cy="12" r="2" />
          <line x1="12" y1="9" x2="12" y2="7" />
          <line x1="15" y1="12" x2="17" y2="12" />
          <line x1="12" y1="15" x2="12" y2="17" />
          <line x1="9" y1="12" x2="7" y2="12" />
        </svg>
      )
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      )
    }
  ];

  return (
    <div className="studio-panel">
      <div className="studio-header">
        <h2 className="studio-title">Studio</h2>
        <div className="header-buttons">
          <button className="btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <rect x="9" y="9" width="6" height="6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="studio-content">
        <div className="studio-options">
          {studioTools.map((tool) => (
            <div 
              key={tool.id}
              className={`studio-option ${selectedTool === tool.id ? 'selected' : ''}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <div className="studio-option-icon">
                {tool.icon}
              </div>
              <div className="studio-option-title">
                {tool.title}
              </div>
            </div>
          ))}
        </div>

        <div className="studio-output">
          <div className="studio-output-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3>Studio output will be saved here.</h3>
          <p>
            After adding sources, click to add Audio Overview, 
            Study Guide, Mind Map, and more!
          </p>
        </div>
      </div>

      <button className="add-note-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
        Add note
      </button>
    </div>
  );
};

export default StudioPanel;
