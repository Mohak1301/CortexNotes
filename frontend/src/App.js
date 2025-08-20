import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './transitions.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/test" element={<div style={{color: 'white', padding: '20px'}}>Test route working!</div>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;