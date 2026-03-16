import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-text/60 font-body text-sm">Loading...</p>
    </div>
  </div>
);

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default PrivateRoute;
