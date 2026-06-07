import { useAuth } from '../context/AuthContext';
import LenderDashboard from '../components/dashboard/LenderDashboard';
import RenterDashboard from '../components/dashboard/RenterDashboard';

/**
 * DashboardPage — routes to the correct dashboard based on user role.
 * Lenders see their portfolio + earnings; Renters see their bookings.
 */
const DashboardPage = () => {
  const { user, isLender } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Role-aware greeting banner */}
      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-dark-800 to-dark-700 border border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow-green">
          <span className="text-xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Good day,</p>
          <h2 className="font-display font-bold text-white text-xl">{user?.name}</h2>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 
            ${isLender ? 'bg-earth-500/20 text-earth-400' : 'bg-primary-500/20 text-primary-400'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Role-based dashboard */}
      {isLender ? <LenderDashboard /> : <RenterDashboard />}
    </div>
  );
};

export default DashboardPage;
