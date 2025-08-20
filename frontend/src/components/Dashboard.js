import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import MainApp from './MainApp';
import './Dashboard.css';

const formatResetTime = (lastQueryReset) => {
  if (!lastQueryReset) return '';
  
  const resetDate = new Date(lastQueryReset);
  const tomorrow = new Date(resetDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const now = new Date();
  const timeUntilReset = tomorrow - now;
  const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="dashboard page-transition">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title">
            <h1>CortexNotes</h1>
            <span className="user-info">
              {user?.email} • {user?.queryCount}/{user?.queryLimit} queries • Resets in {formatResetTime(user?.lastQueryReset)}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <MainApp />
      </main>
    </div>
  );
};

export default Dashboard;
