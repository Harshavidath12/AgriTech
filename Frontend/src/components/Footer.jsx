import { Link } from 'react-router-dom';
import { Tractor } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-dark-900/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-green group-hover:shadow-lg transition-all">
              <Tractor className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-display font-bold text-white">Agri</span>
              <span className="text-base font-display font-bold text-primary-500">Tech</span>
            </div>
          </Link>

          {/* Center: Copyright */}
          <div className="text-gray-400 text-sm text-center md:text-left">
            &copy; 2026 AgriTech. Peer-to-Peer Equipment Marketplace.
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <Link to="/marketplace" className="text-gray-400 hover:text-white text-sm transition-colors">
              Marketplace
            </Link>
            <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
              Join
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
