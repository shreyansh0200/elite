import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/" replace />;

  return children;
}
