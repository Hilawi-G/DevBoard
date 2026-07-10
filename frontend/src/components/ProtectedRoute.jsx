
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // If the global brain says no user is authenticated, bounce them to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If authenticated, render the secure components cleanly
  return children;
}