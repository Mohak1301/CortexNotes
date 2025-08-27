import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Add smooth transition effect
    const app = document.querySelector('.app');
    if (app) {
      app.classList.add('page-transition-out');
    }
    
    // Navigate after a brief delay for smooth transition
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="landing-page">
      {/* Background gradient */}
      <div className="landing-background">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      {/* Main content */}
      <div className="landing-content">
        {/* Header */}
        <header className="landing-header">
          <div className="logo">
            <span className="logo-text">CortexNotes</span>
          </div>
        </header>

        {/* Hero section */}
        <main className="landing-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-line">AI-Powered</span>
              <span className="title-line">Document Chat</span>
            </h1>
            
            <p className="hero-subtitle">
              Transform your documents into intelligent conversations. 
              Upload PDFs, text, or URLs and chat with your content instantly.
            </p>

            <button 
              className="get-started-btn"
              onClick={handleGetStarted}
            >
              Get Started
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Coding/Robot Animation */}
          <div className="hero-visual">
            <div className="coding-animation">
              {/* Robot Character */}
              <div className="robot-character">
                <div className="robot-head">
                  <div className="robot-eyes">
                    <div className="robot-eye"></div>
                    <div className="robot-eye"></div>
                  </div>
                  <div className="robot-mouth"></div>
                </div>
                <div className="robot-body">
                  <div className="robot-panel">
                    <div className="panel-light"></div>
                    <div className="panel-light"></div>
                    <div className="panel-light"></div>
                  </div>
                </div>
              </div>
              
              {/* Code Lines */}
              <div className="code-lines">
                <div className="code-line code-line-1">
                  <span className="code-keyword">function</span> <span className="code-function">processDocument</span>() {'{'}
                </div>
                <div className="code-line code-line-2">
                  <span className="code-indent">  </span><span className="code-keyword">const</span> <span className="code-variable">ai</span> = <span className="code-string">'intelligent'</span>;
                </div>
                <div className="code-line code-line-3">
                  <span className="code-indent">  </span><span className="code-keyword">return</span> <span className="code-variable">conversation</span>;
                </div>
                <div className="code-line code-line-4">{'}'}</div>
              </div>
              
              {/* Floating Elements */}
              <div className="floating-elements">
                <div className="floating-dot floating-dot-1"></div>
                <div className="floating-dot floating-dot-2"></div>
                <div className="floating-dot floating-dot-3"></div>
                <div className="floating-dot floating-dot-4"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer with social links */}
        <footer className="landing-footer">
          <div className="social-links">
            <a 
              href="https://x.com/MohakTiwar13" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
            >
              <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X</span>
            </a>
            
            <a 
              href="https://www.linkedin.com/in/mohak-tiwari/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
            >
              <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
