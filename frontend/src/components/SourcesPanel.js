import React, { useRef, useState } from 'react';
import { API_ENDPOINTS } from '../config/api.js';
import { apiFetch } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import ConfirmDialog from './ui/ConfirmDialog';

const SourcesPanel = ({ sources, onFileUpload, isLoading, onSourceDeleted, onSourcesCleared, maxDocuments = 4, currentCount = 0 }) => {
  const fileInputRef = useRef(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlContent, setUrlContent] = useState('');
  const [isTextUploading, setIsTextUploading] = useState(false);
  const [isUrlUploading, setIsUrlUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const isLimitReached = currentCount >= maxDocuments;

  const handleFileClick = () => {
    if (isLimitReached) {
      toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (currentCount + files.length > maxDocuments) {
        toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
        return;
      }
      onFileUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLimitReached) {
      e.currentTarget.classList.add('dragover');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (isLimitReached) {
      toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (currentCount + files.length > maxDocuments) {
        toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
        return;
      }
      onFileUpload(files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const runConfirmedAction = async (action, failureMessage) => {
    try {
      setIsDeleting(true);
      await action();
      setConfirm(null);
    } catch (error) {
      console.error(failureMessage, error);
      toast.error(failureMessage);
      setConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSource = (sourceId) => {
    const source = sources.find((item) => item.id === sourceId);
    setConfirm({
      title: 'Delete this source?',
      body: `${source ? `“${source.name}” will be removed` : 'This source will be removed'} from your workspace, along with its embeddings in the vector database.`,
      confirmLabel: 'Delete source',
      onConfirm: () => runConfirmedAction(() => onSourceDeleted(sourceId), 'Failed to delete source'),
    });
  };

  const handleClearAllSources = () => {
    setConfirm({
      title: 'Clear all sources?',
      body: `All ${sources.length} source${sources.length === 1 ? '' : 's'} and their embeddings will be deleted. This cannot be undone.`,
      confirmLabel: 'Clear all',
      onConfirm: () => runConfirmedAction(onSourcesCleared, 'Failed to clear sources'),
    });
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;
    
    if (isLimitReached) {
      toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
      return;
    }
    
    try {
      setIsTextUploading(true);
      const response = await apiFetch(API_ENDPOINTS.TEXT_UPLOAD, {
        method: 'POST',
        body: JSON.stringify({ text: textContent }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.source) {
          onFileUpload([data.source]);
        }
        setTextContent('');
        setShowTextModal(false);
        toast.success('Text uploaded successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to upload text');
      }
    } catch (error) {
      console.error('Text upload error:', error);
      toast.error('Failed to upload text');
    } finally {
      setIsTextUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlContent.trim()) return;
    
    if (isLimitReached) {
      toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
      return;
    }
    
    try {
      setIsUrlUploading(true);
      const response = await apiFetch(API_ENDPOINTS.LINK_UPLOAD, {
        method: 'POST',
        body: JSON.stringify({ link: urlContent }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.source) {
          onFileUpload([data.source]);
        }
        setUrlContent('');
        setShowUrlModal(false);
        toast.success('URL uploaded successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to upload URL');
      }
    } catch (error) {
      console.error('URL upload error:', error);
      toast.error('Failed to upload URL');
    } finally {
      setIsUrlUploading(false);
    }
  };

  return (
    <div className="sources-panel">
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        busy={isDeleting}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <div className="sources-header">
        <div className="sources-title-section">
          <h2 className="sources-title">Sources</h2>
          <div className="document-limit">
            <span className="limit-counter">
              {currentCount}/{maxDocuments} documents
            </span>
            {isLimitReached && (
              <span className="limit-message">Please remove existing documents to add more</span>
            )}
          </div>
        </div>
        {sources.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={handleClearAllSources}
            disabled={isDeleting}
            title="Clear all sources and embeddings"
          >
            {isDeleting ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
      />

      {/* Source Type Selection */}
      <div className="rail-label">Add a source</div>
      <div className="source-types">
        <button
          type="button"
          className={`source-type-box ${isLimitReached ? 'disabled' : ''}`}
          onClick={handleFileClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="source-type-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <div className="source-type-content">
            <h4>Upload PDF</h4>
            <p>Upload PDF documents</p>
          </div>
        </button>

        <button
          type="button"
          className={`source-type-box ${isLimitReached ? 'disabled' : ''}`}
          onClick={() => {
            if (isLimitReached) {
              toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
              return;
            }
            setShowUrlModal(true);
          }}
        >
          <div className="source-type-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="source-type-content">
            <h4>Website URL</h4>
            <p>Import from web link</p>
          </div>
        </button>

        <button
          type="button"
          className={`source-type-box ${isLimitReached ? 'disabled' : ''}`}
          onClick={() => {
            if (isLimitReached) {
              toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
              return;
            }
            setShowTextModal(true);
          }}
        >
          <div className="source-type-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div className="source-type-content">
            <h4>Paste Text</h4>
            <p>Add text directly</p>
          </div>
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="sources-content">
          <div className="sources-empty">
            <div className="sources-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            </div>
            <h3>No sources added yet</h3>
            <p>
              Choose one of the options above to add your first source.
            </p>
          </div>
        </div>
      ) : (
        <div className="sources-list">
          <div className="rail-label rail-label-tight">In this workspace</div>
          {sources.map((source) => (
            <div key={source.id} className="source-item">
              <div className="source-icon">
                {source.type === 'PDF' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                )}
                {source.type === 'TEXT' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                )}
                {source.type === 'URL' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
              </div>
              <div className="source-info">
                <div className="source-name">{source.name}</div>
                <div className="source-type">
                  {source.type} {source.size > 0 && `• ${formatFileSize(source.size)}`}
                </div>
              </div>
              <button 
                className="delete-source-btn"
                onClick={() => handleDeleteSource(source.id)}
                disabled={isDeleting}
                title="Delete this source and its embeddings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <div className="loading">
            <span>Processing file...</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}

      {/* Text Modal */}
      {showTextModal && (
        <div className="modal-overlay" onClick={() => setShowTextModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Text Content</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTextModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="text-input"
                placeholder="Paste your text content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn"
                onClick={() => setShowTextModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isTextUploading}
              >
                {isTextUploading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  'Submit Text'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Modal */}
      {showUrlModal && (
        <div className="modal-overlay" onClick={() => setShowUrlModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Website URL</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUrlModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <input
                type="url"
                className="url-input"
                placeholder="https://example.com"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn"
                onClick={() => setShowUrlModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUrlSubmit}
                disabled={!urlContent.trim() || isUrlUploading}
              >
                {isUrlUploading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  'Submit URL'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading">
            <span>Processing...</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcesPanel;
