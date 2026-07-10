import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Temporary placeholder layouts until we build the premium interfaces
const RegisterPlaceholder = () => <div>Register Screen Coming Next...</div>;
const LoginPlaceholder = () => <div>Login Screen Coming Next...</div>;
const DashboardPlaceholder = () => <div>Secure Kanban Board Workspace Coming Soon...</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPlaceholder />} />
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;