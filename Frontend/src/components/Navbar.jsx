import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Tractor, Menu, X, LayoutDashboard, LogOut,
  ShoppingBag, User, ChevronDown, Bell, CheckCheck
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

/**
 * Navbar — role-aware navigation bar.
 * Shows different links based on auth state and user role.
 */
const Navbar = () => {
  const { isAuthenticated, user, logout, isLender, isRenter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await axiosInstance.get('/notifications');
        setNotifications(data.data);
      } catch (err) {
        // Silently fail for polling
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-green group-hover:shadow-lg transition-all">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-display font-bold text-white">Agri</span>
              <span className="text-lg font-display font-bold text-primary-500">Tech</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/marketplace"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive('/marketplace')
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive('/dashboard')
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileOpen(false);
                    }}
                    className="p-2 rounded-xl bg-dark-700/60 border border-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 glass-card border border-white/10 overflow-hidden animate-fade-in max-h-96 flex flex-col">
                      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-dark-800">
                        <h3 className="text-white font-medium text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <p className="text-gray-500 text-xs text-center p-4">No notifications yet.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => { if (!notif.isRead) markAsRead(notif._id); }}
                              className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${notif.isRead ? 'bg-dark-700/30 text-gray-400' : 'bg-primary-500/10 text-gray-200 border border-primary-500/20'}`}
                            >
                              <p className="text-xs mb-1 opacity-80">{notif.type.replace('_', ' ')}</p>
                              <p>{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    id="profile-menu-btn"
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-dark-700/60 border border-white/10
                             hover:border-white/20 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-200 leading-none">{user?.name}</p>
                    <p className="text-xs text-primary-400 leading-none mt-0.5">{user?.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card border border-white/10 py-1 animate-fade-in">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-dark-900/95 backdrop-blur-xl py-4 px-4 animate-slide-up">
          <div className="flex flex-col gap-1">
            <Link to="/marketplace" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5">
              <ShoppingBag className="w-4 h-4" /> Marketplace
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            )}
            <div className="mt-2 pt-2 border-t border-white/5">
              {isAuthenticated ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Get Started</Link>
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
