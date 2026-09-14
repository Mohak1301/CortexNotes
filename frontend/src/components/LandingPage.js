import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WordReveal from './ui/WordReveal';
import Reveal from './ui/Reveal';
import ClickSpark from './ui/ClickSpark';
import './LandingPage.css';

const Icon = ({ d, children }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children || <path d={d} />}
  </svg>
);

const FEATURES = [
  {
    title: 'Source-grounded',
    body: 'Every answer is built from the material you uploaded — never from guesswork.',
    icon: <Icon><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M9 8h6" /></Icon>
  },
  {
    title: 'Inline citations',
    body: 'Each claim links back to the exact source it came from, so you can verify it.',
    icon: <Icon><path d="M7 8h10M7 12h10M7 16h5" /><circle cx="18" cy="17" r="3.2" /></Icon>
  },
  {
    title: 'PDFs, notes & web',
    body: 'Drop in documents, paste written notes, or point at a URL. One workspace.',
    icon: <Icon><path d="M14 3v5h5" /><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7z" /></Icon>
  },
  {
    title: 'Semantic search',
    body: 'Find the passage you half-remember by meaning, not by exact keyword.',
    icon: <Icon><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Icon>
  },
  {
    title: 'Private by default',
    body: 'Your sources live in your own workspace. Nothing is shared or published.',
    icon: <Icon><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></Icon>
  },
  {
    title: 'Ready in moments',
    body: 'Indexing starts the second a source lands. No setup, no configuration.',
    icon: <Icon><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></Icon>
  },
  {
    title: 'Cross-source synthesis',
    body: 'Compare what several documents say about the same question, side by side.',
    icon: <Icon><path d="M4 7h7M4 12h16M13 17h7" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="17" r="2.2" /></Icon>
  },
  {
    title: 'And more',
    body: 'Follow-up threads, source management, and a workspace that stays out of the way.',
    icon: <Icon><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></Icon>
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const openWorkspace = () => navigate(user ? '/dashboard' : '/register');

  const headline = 'Turn scattered documents into clear answers';

  return (
    <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={16} sparkCount={8} duration={400}>
      <div className="landing-page">
        <div className="landing-nav-wrap">
          <nav className="landing-nav" aria-label="Primary">
            <a className="brand" href="#top" aria-label="CortexNotes home">
              <span className="brand-mark" aria-hidden="true" />
              <span>CortexNotes</span>
            </a>
            <div className="nav-actions">
              <button className="nav-link" onClick={() => navigate(user ? '/dashboard' : '/login')}>
                {user ? 'Workspace' : 'Sign in'}
              </button>
              <button className="pill pill-solid nav-pill" onClick={openWorkspace}>
                {user ? 'Open' : 'Get started'}
              </button>
            </div>
          </nav>
        </div>

        <main id="top">
          <section className="hero">
            <div className="hero-dots" aria-hidden="true" />
            <div className="shell">
              <h1 className="hero-title">
                <WordReveal className="hero-title-inner" text={headline} stagger={38} />
              </h1>
              <p className="hero-sub">
                Bring PDFs, notes, and web pages into one workspace. CortexNotes finds the
                relevant context and shows you where every answer came from.
              </p>
              <button className="pill pill-solid hero-cta" onClick={openWorkspace}>
                Start researching
              </button>
            </div>
          </section>

          <section className="showcase" aria-label="CortexNotes workspace">
            <div className="shell shell-wide">
              <Reveal>
                <div className="frame">
                  <div className="frame-bar">
                    <div className="frame-dots" aria-hidden="true"><span /><span /><span /></div>
                    <div className="frame-tabs">
                      <span className="is-active">Sources</span>
                      <span>Chat</span>
                      <span>Studio</span>
                    </div>
                    <div className="frame-search" aria-hidden="true">Search…</div>
                  </div>
                  <div className="frame-body">
                    <aside className="frame-rail">
                      <div className="rail-head">Sources <b>3</b></div>
                      <div className="rail-item is-active"><i>PDF</i><p>Market research.pdf<small>42 pages</small></p></div>
                      <div className="rail-item"><i>TXT</i><p>Interview notes<small>8,240 words</small></p></div>
                      <div className="rail-item"><i>URL</i><p>Industry report<small>Web source</small></p></div>
                      <button className="rail-add">Add source</button>
                    </aside>
                    <div className="frame-main">
                      <div className="frame-status"><span aria-hidden="true" /> 3 sources indexed</div>
                      <div className="bubble-user">What are the strongest themes across these sources?</div>
                      <div className="bubble-answer">
                        <span className="answer-avatar" aria-hidden="true" />
                        <div>
                          <p>
                            Three themes recur across all three sources: faster adoption cycles,
                            growing demand for verifiable data, and a shift toward narrower AI workflows.
                          </p>
                          <div className="cites"><span>1 · Market research</span><span>2 · Interview notes</span></div>
                        </div>
                      </div>
                      <div className="frame-input">Ask a follow-up question</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="features" aria-labelledby="features-title">
            <div className="shell">
              <h2 id="features-title" className="section-title">Built for reading closely</h2>
              <p className="section-sub">
                Everything needed to take a pile of unread material and turn it into something you understand.
              </p>
            </div>
            <div className="shell shell-wide">
              <div className="grid">
                {FEATURES.map(feature => (
                  <article className="cell" key={feature.title}>
                    <span className="cell-icon">{feature.icon}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="closer">
            <div className="shell shell-wide">
              <Reveal>
                <div className="closer-panel">
                  <h2>Ready to read through the pile?</h2>
                  <p>Create a workspace, add your first source, and start asking.</p>
                  <button className="pill pill-solid" onClick={openWorkspace}>Start researching</button>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="shell shell-wide">
            <div className="footer-top">
              <div className="footer-brand">
                <a className="brand" href="#top">
                  <span className="brand-mark" aria-hidden="true" />
                  <span>CortexNotes</span>
                </a>
                <p>© {new Date().getFullYear()} CortexNotes. All rights reserved.</p>
              </div>
              <nav className="footer-links" aria-label="Footer">
                <div>
                  <button onClick={() => navigate('/login')}>Sign in</button>
                  <button onClick={() => navigate('/register')}>Create account</button>
                </div>
                <div>
                  <a href="#top">Overview</a>
                  <a href="#features-title">Features</a>
                </div>
              </nav>
            </div>
          </div>
          <div className="wordmark" aria-hidden="true">CortexNotes</div>
        </footer>
      </div>
    </ClickSpark>
  );
};

export default LandingPage;
