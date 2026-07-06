import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Outlet />
    </div>
  );
}
