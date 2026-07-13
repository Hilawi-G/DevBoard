import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// 1. Swap placeholders out for real page modules
import Register from './pages/Register';
import Login from './pages/Login';

// Temporary dashboard view layout until we build the complete Kanban grids
const DashboardPlaceholder = () => (
  <div className="p-8 text-slate-100 bg-slate-900 min-h-screen">
    <h1 className="text-2xl font-bold">Secure Kanban Board Workspace</h1>
    <p className="text-slate-400 mt-2">If you see this page, your JWT lifecycle is running cleanly!</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500/30">
          <Routes>
            {/* Public Gates */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Workspace Layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Catch */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;