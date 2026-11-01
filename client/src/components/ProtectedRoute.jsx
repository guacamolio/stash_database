import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// <ProtectedRoute permission="user:read"> ... </ProtectedRoute>
export default function ProtectedRoute({ permission, children }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Ielādē…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (permission && !can(permission)) return <Navigate to="/forbidden" replace />;
  return children;
}
