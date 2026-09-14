import React from 'react';
import './WordReveal.css';

/**
 * Per-word rise-in for a headline. CSS-only so it costs nothing at runtime and
 * does not depend on scroll position — headlines using it are above the fold.
 */
const WordReveal = ({ text, className = '', stagger = 38, as: Tag = 'span' }) => (
  <Tag className={`word-reveal ${className}`.trim()}>
    {text.split(' ').map((word, i) => (
      <React.Fragment key={`${word}-${i}`}>
        {i > 0 && ' '}
        <span className="word-reveal-word">
          <span style={{ animationDelay: `${i * stagger}ms` }}>{word}</span>
        </span>
      </React.Fragment>
    ))}
  </Tag>
);

export default WordReveal;
