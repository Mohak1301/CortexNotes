import React, { useEffect, useState, useCallback } from 'react';
import MainApp from './MainApp';
import MobileUploadModal from './MobileUploadModal';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { apiFetch } from '../utils/apiUtils.js';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [sources, setSources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMobileSourcesModal, setShowMobileSourcesModal] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(true);

  const MAX_DOCUMENTS = 4;

  useEffect(() => {
    // Add smooth transition in effect
    const app = document.querySelector('.app');
    if (app) {
      app.classList.remove('page-transition-out');
      app.classList.add('page-transition-in');
    }
    
    // Clean up transition classes
    return () => {
      if (app) {
        app.classList.remove('page-transition-in');
      }
    };
  }, []);

  // Load sources from localStorage on component mount
  useEffect(() => {
    // Clear localStorage on page load to ensure fresh start
    localStorage.removeItem('cortexNotes_sources');
    setSources([]);
    // Set initial panel state based on screen size
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setShowSourcesPanel(true); // Show panel when no sources
    } else {
      setShowSourcesPanel(true); // Always show on desktop
    }
  }, []);

  // On desktop, always show sources panel. On mobile, hide it when sources are added
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && sources.length > 0) {
      setShowSourcesPanel(false);
    } else if (!isMobile) {
      setShowSourcesPanel(true); // Always show on desktop
    }
  }, [sources.length]);

  // Save sources to localStorage whenever sources change
  useEffect(() => {
    localStorage.setItem('cortexNotes_sources', JSON.stringify(sources));
  }, [sources]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        // On desktop, always show sources panel
        setShowSourcesPanel(true);
      } else if (sources.length === 0) {
        // On mobile with no sources, show panel
        setShowSourcesPanel(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, [sources.length]);

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
      // Only hide panel on mobile after upload
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setShowSourcesPanel(false);
      }
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
              // Only hide panel on mobile after upload
              const isMobile = window.innerWidth <= 768;
              if (isMobile) {
                setShowSourcesPanel(false);
              }
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
        setSources(prev => {
          const newSources = prev.filter(source => source.id !== deletedSourceId);
          // If no sources left, show the sources panel
          if (newSources.length === 0) {
            setShowSourcesPanel(true);
          }
          return newSources;
        });
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
        setShowSourcesPanel(true); // Show sources panel when all sources are cleared
        toast.success('All sources cleared successfully');
      } else {
        toast.error('Failed to clear sources from vector database');
      }
    } catch (error) {
      console.error('Error clearing sources:', error);
      toast.error('Failed to clear sources');
    }
  }, []);

  return (
    <div className="dashboard page-transition">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title">
            <h1>CortexNotes</h1>
            <span className="user-info">
              AI-Powered Document Chat • Max 4 Documents
            </span>
          </div>
          <div className="dashboard-actions">
            {sources.length > 0 && !showSourcesPanel && (
              <button 
                className="navbar-toggle-btn"
                onClick={() => {
                  const isMobile = window.innerWidth <= 768;
                  if (isMobile) {
                    setShowMobileSourcesModal(true);
                  } else {
                    setShowSourcesPanel(true);
                  }
                }}
                title="Show Sources"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Show Sources
              </button>
            )}
            {sources.length > 0 && showSourcesPanel && (
              <button 
                className="navbar-toggle-btn"
                onClick={() => setShowSourcesPanel(false)}
                title="Hide Sources"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hide Sources
              </button>
            )}
            <button 
              className="navbar-upload-btn"
              onClick={() => setShowUploadModal(true)}
              disabled={sources.length >= MAX_DOCUMENTS}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Upload Sources
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        <MainApp 
          sources={sources}
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
          onSourceDeleted={handleSourceDeleted}
          onSourcesCleared={handleSourcesCleared}
          maxDocuments={MAX_DOCUMENTS}
          showSourcesPanel={showSourcesPanel}
          setShowSourcesPanel={setShowSourcesPanel}
        />
      </main>

      {/* Upload Modal */}
      <MobileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileUpload={handleFileUpload}
        maxDocuments={MAX_DOCUMENTS}
        currentCount={sources.length}
        isLimitReached={sources.length >= MAX_DOCUMENTS}
      />

      {/* Mobile Sources Modal */}
      {showMobileSourcesModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowMobileSourcesModal(false)}>
          <div className="mobile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Your Sources</h3>
              <button 
                className="mobile-modal-close"
                onClick={() => setShowMobileSourcesModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mobile-sources-list">
              {sources.map((source) => (
                <div key={source.id} className="mobile-source-item">
                  <div className="mobile-source-info">
                    <div className="mobile-source-name">{source.name}</div>
                    <div className="mobile-source-type">{source.type}</div>
                    <div className="mobile-source-date">
                      {new Date(source.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    className="mobile-source-delete"
                    onClick={() => {
                      handleSourceDeleted(source.id);
                      setShowMobileSourcesModal(false);
                    }}
                    title="Delete source"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="mobile-modal-footer">
              <button 
                className="mobile-btn mobile-btn-secondary"
                onClick={() => setShowMobileSourcesModal(false)}
              >
                Close
              </button>
              <button 
                className="mobile-btn mobile-btn-primary"
                onClick={() => {
                  setShowMobileSourcesModal(false);
                  setShowUploadModal(true);
                }}
                disabled={sources.length >= MAX_DOCUMENTS}
              >
                Add More Sources
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
