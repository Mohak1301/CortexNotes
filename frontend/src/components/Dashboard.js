import React from 'react';
import MainApp from './MainApp';
import './Dashboard.css';

const Dashboard = () => {
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
        </div>
      </header>
      
      <main className="dashboard-main">
        <MainApp />
      </main>
    </div>
  );
};

export default Dashboard;
