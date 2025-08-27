import React, { useRef, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { apiFetch } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';

const MobileUploadModal = ({ 
  isOpen, 
  onClose, 
  onFileUpload, 
  maxDocuments = 4, 
  currentCount = 0,
  isLimitReached 
}) => {
  const fileInputRef = useRef(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlContent, setUrlContent] = useState('');
  const [isTextUploading, setIsTextUploading] = useState(false);
  const [isUrlUploading, setIsUrlUploading] = useState(false);

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
      onClose(); // Close modal after upload
    }
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
        onClose(); // Close modal after upload
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
        onClose(); // Close modal after upload
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

  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-modal-overlay" onClick={onClose}>
        <div className="mobile-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-modal-header">
            <h3>Upload Sources</h3>
            <button 
              className="mobile-modal-close"
              onClick={onClose}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="mobile-modal-body">
            <div className="mobile-source-types">
              <div 
                className={`mobile-source-type-box ${isLimitReached ? 'disabled' : ''}`}
                onClick={handleFileClick}
              >
                <div className="mobile-source-type-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div className="mobile-source-type-content">
                  <h4>Upload PDF</h4>
                  <p>Upload PDF documents</p>
                </div>
              </div>

              <div 
                className={`mobile-source-type-box ${isLimitReached ? 'disabled' : ''}`}
                onClick={() => {
                  if (isLimitReached) {
                    toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
                    return;
                  }
                  setShowUrlModal(true);
                }}
              >
                <div className="mobile-source-type-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className="mobile-source-type-content">
                  <h4>Website URL</h4>
                  <p>Import from web link</p>
                </div>
              </div>

              <div 
                className={`mobile-source-type-box ${isLimitReached ? 'disabled' : ''}`}
                onClick={() => {
                  if (isLimitReached) {
                    toast.error(`You can only have ${maxDocuments} documents. Please delete some existing documents first.`);
                    return;
                  }
                  setShowTextModal(true);
                }}
              >
                <div className="mobile-source-type-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div className="mobile-source-type-content">
                  <h4>Paste Text</h4>
                  <p>Add text directly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
      />

      {/* Text Modal */}
      {showTextModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowTextModal(false)}>
          <div className="mobile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Add Text Content</h3>
              <button 
                className="mobile-modal-close"
                onClick={() => setShowTextModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mobile-modal-body">
              <textarea
                className="mobile-text-input"
                placeholder="Paste your text content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
              />
            </div>
            <div className="mobile-modal-footer">
              <button 
                className="mobile-btn"
                onClick={() => setShowTextModal(false)}
              >
                Cancel
              </button>
              <button 
                className="mobile-btn mobile-btn-primary"
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isTextUploading}
              >
                {isTextUploading ? (
                  <>
                    <div className="mobile-loading-spinner"></div>
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
        <div className="mobile-modal-overlay" onClick={() => setShowUrlModal(false)}>
          <div className="mobile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Add Website URL</h3>
              <button 
                className="mobile-modal-close"
                onClick={() => setShowUrlModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mobile-modal-body">
              <input
                type="url"
                className="mobile-url-input"
                placeholder="https://example.com"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
              />
            </div>
            <div className="mobile-modal-footer">
              <button 
                className="mobile-btn"
                onClick={() => setShowUrlModal(false)}
              >
                Cancel
              </button>
              <button 
                className="mobile-btn mobile-btn-primary"
                onClick={handleUrlSubmit}
                disabled={!urlContent.trim() || isUrlUploading}
              >
                {isUrlUploading ? (
                  <>
                    <div className="mobile-loading-spinner"></div>
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
    </>
  );
};

export default MobileUploadModal;
