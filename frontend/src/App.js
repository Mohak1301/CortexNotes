import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import './transitions.css';
import './production.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid rgba(255, 107, 157, 0.3)',
          },
          success: {
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(76, 175, 80, 0.3)',
            },
          },
          error: {
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(244, 67, 54, 0.3)',
            },
          },
        }}
      />
      </AuthProvider>
    </Router>
  );
}

export default App;
