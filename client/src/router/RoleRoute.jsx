import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const RoleRoute = ({ role, children }) => {
  const { user } = useAuthStore();

  if (!user || user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
