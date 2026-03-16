import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const NavLinks = ({ mobile = false }) => {
    const baseClass = mobile ? "block py-3 px-4 text-base font-bold text-text hover:bg-gray-50 border-b border-gray-100 last:border-0" : "text-sm font-bold text-text hover:text-primary transition";

    return (
      <div className={mobile ? "flex flex-col" : "flex items-center gap-6"}>
        <Link to="/map" className={baseClass} onClick={() => setMobileMenuOpen(false)}>🗺️ Live Map</Link>
        <Link to="/impact" className={baseClass} onClick={() => setMobileMenuOpen(false)}>🌍 Impact Stats</Link>
        <Link to="/marketplace" className={baseClass} onClick={() => setMobileMenuOpen(false)}>🛒 Marketplace</Link>
        <Link to="/community" className={baseClass} onClick={() => setMobileMenuOpen(false)}>🤝 Community</Link>
        
        {user && user.role !== 'consumer' && (
          <Link to="/dashboard" className={baseClass} onClick={() => setMobileMenuOpen(false)}>
            {user.role === 'waste_plant' ? '♻️ Operations' : '📊 Dashboard'}
          </Link>
        )}
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-40 flex items-center shadow-sm">
      <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xl">P</div>
          <span className="font-heading font-black text-xl tracking-tight text-text">PlatePulse</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
          
          <div className="h-6 w-px bg-gray-200"></div>

          {user ? (
            <div className="flex items-center gap-4">
              <NotificationBell />

              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-primary/20 hover:border-primary transition" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border-2 border-primary/20 hover:border-primary transition">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-slide-up origin-top-right">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="font-bold text-sm text-text truncate">{user.name}</p>
                      <p className="text-[10px] text-text/50 uppercase font-black tracking-widest">{user.role.replace('_', ' ')}</p>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block w-full text-left px-4 py-2 text-sm font-semibold text-text hover:bg-gray-50 transition">My Profile</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition">Sign out</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-text hover:text-primary transition">Log in</Link>
              <Link to="/register" className="text-sm font-bold bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Start Saving</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-2xl" onClick={() => setMobileMenuOpen(true)}>
          ☰
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden flex justify-end">
          <div className="w-64 bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
              <span className="font-heading font-black text-lg text-primary">PlatePulse Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-gray-400">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <NavLinks mobile={true} />
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               {user ? (
                 <div>
                   <div className="flex items-center gap-3 mb-4">
                     {user.avatar ? <img src={user.avatar} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{user.name?.substring(0, 2).toUpperCase()}</div>}
                     <div><p className="font-bold text-sm leading-tight">{user.name}</p><p className="text-[10px] uppercase font-black tracking-widest text-text/40">{user.role}</p></div>
                   </div>
                   <button onClick={handleLogout} className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl text-sm">Sign Out</button>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                   <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center border border-gray-200 rounded-xl font-bold text-sm">Log In</Link>
                   <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center bg-black text-white rounded-xl font-bold text-sm shadow-md">Join Now</Link>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
