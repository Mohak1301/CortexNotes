import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { useAuth } from '../contexts/AuthContext';

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const openWorkspace = () => navigate(user ? '/dashboard' : '/register');

  return (
    <div className="landing-page">
      <div className="landing-grid" aria-hidden="true" />
      <header className="landing-header">
        <a className="brand" href="#top" aria-label="CortexNotes home">
          <span className="brand-mark">C</span>
          <span>CortexNotes</span>
        </a>
        <button className="nav-cta" onClick={() => navigate(user ? '/dashboard' : '/login')}>{user ? 'Open workspace' : 'Sign in'} <ArrowIcon /></button>
      </header>

      <main id="top" className="landing-main">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="eyebrow"><span /> Grounded answers from your own sources</div>
            <h1 id="hero-title">Turn scattered documents into <em>clear answers.</em></h1>
            <p className="hero-subtitle">
              Bring PDFs, notes, and web pages into one focused workspace. CortexNotes finds the relevant context so you can understand, compare, and move faster.
            </p>
            <div className="hero-actions">
              <button className="get-started-btn" onClick={openWorkspace}>Start researching <ArrowIcon /></button>
              <span className="hero-note">Private account · Secure workspace</span>
            </div>
            <div className="trust-row" aria-label="Supported source types">
              <span>PDF documents</span><i /> <span>Written notes</span><i /> <span>Web sources</span>
            </div>
          </div>

          <div className="product-preview" aria-label="CortexNotes product preview">
            <div className="preview-topbar">
              <div className="preview-brand"><span className="brand-mark small">C</span> Research workspace</div>
              <div className="window-dots"><span /><span /><span /></div>
            </div>
            <div className="preview-body">
              <aside className="preview-sources">
                <div className="preview-label">SOURCES <b>3</b></div>
                <div className="preview-source active"><span>PDF</span><p>Market research.pdf<small>42 pages</small></p></div>
                <div className="preview-source"><span>TXT</span><p>Interview notes<small>8,240 words</small></p></div>
                <div className="preview-source"><span>URL</span><p>Industry report<small>Web source</small></p></div>
                <button className="preview-add">+ Add source</button>
              </aside>
              <div className="preview-chat">
                <div className="preview-status"><span /> 3 sources ready</div>
                <div className="preview-question">What are the strongest themes across these sources?</div>
                <div className="preview-answer">
                  <div className="answer-icon">C</div>
                  <p>The sources consistently highlight three themes: faster adoption, demand for trustworthy data, and a shift toward focused AI workflows.</p>
                </div>
                <div className="preview-citations"><span>1 · Market research</span><span>2 · Interview notes</span></div>
                <div className="preview-input">Ask a follow-up question <button aria-label="Send preview message"><ArrowIcon /></button></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-strip" aria-label="Product benefits">
          <article><span>01</span><div><h2>Source-grounded</h2><p>Answers stay anchored to the material you provide.</p></div></article>
          <article><span>02</span><div><h2>Built for focus</h2><p>A calm workspace without tabs, clutter, or context switching.</p></div></article>
          <article><span>03</span><div><h2>Ready in moments</h2><p>Add a source and start exploring it immediately.</p></div></article>
        </section>
      </main>

      <footer className="landing-footer"><span>© {new Date().getFullYear()} CortexNotes</span><span>Read deeply. Decide clearly.</span></footer>
    </div>
  );
};

export default LandingPage;
