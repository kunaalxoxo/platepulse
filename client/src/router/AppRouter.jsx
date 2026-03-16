import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Public Pages
import Home from '../pages/Home';
import ImpactDashboard from '../pages/public/ImpactDashboard';

// Dashboard Pages
import DonorDashboard from '../pages/donor/DonorDashboard';
import NGODashboard from '../pages/ngo/NGODashboard';
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard';
import RetailDashboard from '../pages/retail/RetailDashboard';
import ConsumerMarketplace from '../pages/consumer/ConsumerMarketplace';
import WastePlantDashboard from '../pages/waste/WastePlantDashboard';

// Shared Features
import CommunityShare from '../pages/community/CommunityShare';
import Profile from '../pages/Profile';
import FoodMap from '../pages/FoodMap';
import AdminDashboard from '../pages/admin/AdminDashboard';

// Components
import Navbar from '../components/common/Navbar';

// Guard for protected routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Guard for specific roles
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/403" replace />;
  return children;
};

const AppRouter = () => {
  const { user } = useAuthStore();

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/impact" element={<ImpactDashboard />} />

          {/* Semi-Public Marketplaces (Allow auth gates inside components if needed, or open config) */}
          <Route path="/marketplace" element={<ConsumerMarketplace />} />
          <Route path="/community" element={<CommunityShare />} />
          <Route path="/map" element={<FoodMap />} />

          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          {/* Dashboard Dynamic Routing */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              {user?.role === 'donor' && <DonorDashboard />}
              {user?.role === 'ngo' && <NGODashboard />}
              {user?.role === 'volunteer' && <VolunteerDashboard />}
              {user?.role === 'retail' && <RetailDashboard />}
              {user?.role === 'waste_plant' && <WastePlantDashboard />}
              {user?.role === 'consumer' && <Navigate to="/marketplace" replace />}
              {user?.role === 'admin' && <AdminDashboard />}
            </PrivateRoute>
          } />

          <Route path="/403" element={<div className="p-20 text-center text-4xl font-bold text-red-500">403: Forbidden access for your role</div>} />
          <Route path="*" element={<div className="p-20 text-center text-4xl font-bold">404: Page Not Found</div>} />
        </Routes>
      </div>
    </>
  );
};

export default AppRouter;
