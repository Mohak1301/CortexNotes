import React from 'react';

const RobotCenter = () => {
  return (
    <div className="robot-center">
      <div className="robot-container">
        <div className="robot">
          <div className="robot-head">
            <div className="robot-eyes">
              <div className="robot-eye left-eye">
                <div className="eye-pupil"></div>
              </div>
              <div className="robot-eye right-eye">
                <div className="eye-pupil"></div>
              </div>
            </div>
            <div className="robot-mouth"></div>
            <div className="robot-antenna">
              <div className="antenna-ball"></div>
            </div>
          </div>
          <div className="robot-body">
            <div className="robot-panel">
              <div className="panel-light"></div>
              <div className="panel-light"></div>
              <div className="panel-light"></div>
            </div>
          </div>
          <div className="robot-arms">
            <div className="robot-arm left-arm"></div>
            <div className="robot-arm right-arm"></div>
          </div>
          <div className="robot-legs">
            <div className="robot-leg left-leg"></div>
            <div className="robot-leg right-leg"></div>
          </div>
        </div>
        <div className="robot-message">
          <div className="message-bubble">
            <span className="happy-text">Happy Hacking! 🚀</span>
          </div>
          <div className="message-tail"></div>
        </div>
        <div className="code-particles">
          <div className="particle">{'{'}</div>
          <div className="particle">{'}'}</div>
          <div className="particle">{'<>'}</div>
          <div className="particle">{'</>'}</div>
          <div className="particle">{'()'}</div>
          <div className="particle">{'[]'}</div>
        </div>
      </div>
    </div>
  );
};

export default RobotCenter;
