import { Link } from 'react-router-dom';
import { Tractor, Leaf, MapPin, Calendar, Shield, ArrowRight, Star, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🚜',
    title: 'List Your Machinery',
    desc: 'Lenders can list tractors, drones, harvesters and earn daily rental income from idle equipment.',
  },
  {
    icon: '🗺️',
    title: 'Find Equipment Nearby',
    desc: 'Interactive map search lets renters filter equipment within a custom radius from their farm.',
  },
  {
    icon: '📅',
    title: 'Smart Booking System',
    desc: 'Real-time availability calendar prevents double-bookings with strict conflict detection.',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    desc: 'See exact costs before confirming. Daily rates, minimum periods, and deposits shown upfront.',
  },
  {
    icon: '🛡️',
    title: 'Secure Transactions',
    desc: 'JWT-authenticated accounts protect both lenders and renters throughout the rental lifecycle.',
  },
  {
    icon: '📊',
    title: 'Earnings Analytics',
    desc: 'Lenders track monthly revenue, booking status, and portfolio performance at a glance.',
  },
];

const EQUIPMENT_CATEGORIES = [
  { icon: '🚜', name: 'Tractors', filterParam: 'Tractor', count: '120+' },
  { icon: '🛸', name: 'Drones', filterParam: 'Drone', count: '85+' },
  { icon: '🌾', name: 'Harvesters', filterParam: 'Harvester', count: '60+' },
  { icon: '💧', name: 'Irrigators', filterParam: 'Irrigator', count: '90+' },
  { icon: '🌿', name: 'Sprayers', filterParam: 'Sprayer', count: '75+' },
  { icon: '🌱', name: 'Planters', filterParam: 'Planter', count: '45+' },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">

      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4">
        {/* Background glow effects */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-earth-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <Leaf className="w-4 h-4 text-primary-400" />
            <span className="text-primary-400 text-sm font-medium">Sharing Economy for Agriculture</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.1] mb-6">
            Smart Farming
            <span className="block text-gradient">Equipment Marketplace</span>
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect smallholder farmers with advanced machinery. Lenders earn passive income from idle equipment.
            Renters access tractors, drones, and harvesters — without buying them.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" id="hero-get-started-btn"
              className="btn-primary text-lg !py-4 !px-8 flex items-center gap-2 justify-center group">
              Get Started Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/marketplace"
              className="btn-secondary text-lg !py-4 !px-8 flex items-center gap-2 justify-center">
              <MapPin className="w-5 h-5 text-primary-400" />
              Browse Marketplace
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 pt-10 border-t border-white/5">
            {[
              { icon: Users, value: '2,400+', label: 'Registered Farmers' },
              { icon: Tractor, value: '380+', label: 'Equipment Listed' },
              { icon: Star, value: '4.8/5', label: 'Avg. Rating' },
              { icon: Shield, value: '100%', label: 'Secure Bookings' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <Icon className="w-4 h-4 text-primary-400" />
                  <span className="text-2xl font-display font-bold text-white">{value}</span>
                </div>
                <p className="text-gray-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Equipment Categories ────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-dark-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Browse by Category</h2>
            <p className="text-gray-400">Find the machinery your farm needs</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {EQUIPMENT_CATEGORIES.map(({ icon, name, filterParam, count }) => (
              <Link key={name} to={`/marketplace?category=${filterParam}`}
                className="glass-card p-4 text-center group hover:border-primary-500/30">
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
                <p className="font-display font-semibold text-white text-sm">{name}</p>
                <p className="text-primary-400 text-xs">{count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-2">How It Works</h2>
            <p className="text-gray-400">Simple steps for both lenders and renters</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Lender flow */}
            <div className="glass-card p-6 border border-earth-500/20">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-earth-500/20 flex items-center justify-center">
                  <span className="text-lg">🏭</span>
                </div>
                <h3 className="font-display font-bold text-earth-400">For Lenders</h3>
              </div>
              {[
                'Register as a Lender and set up your profile',
                'List your equipment with photos, rates, and location',
                'Receive booking requests and confirm them',
                'Track earnings on your analytics dashboard',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-earth-500/20 text-earth-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm">{step}</p>
                </div>
              ))}
            </div>

            {/* Renter flow */}
            <div className="glass-card p-6 border border-primary-500/20">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <span className="text-lg">🌾</span>
                </div>
                <h3 className="font-display font-bold text-primary-400">For Renters</h3>
              </div>
              {[
                'Register as a Renter and describe your farm needs',
                'Search the map for available equipment near you',
                'Select dates on the calendar and confirm your booking',
                'Use the machinery and rate your experience',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-dark-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Platform Features</h2>
            <p className="text-gray-400">Everything you need for seamless equipment sharing</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="glass-card p-5 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
                <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card p-12 border border-primary-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-green-glow" />
              <div className="relative">
                <h2 className="text-4xl font-display font-bold text-white mb-4">
                  Ready to Transform Your Farm?
                </h2>
                <p className="text-gray-400 mb-8">
                  Join thousands of farmers already sharing equipment and growing together.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/register?role=Lender" className="btn-earth !py-3.5 !px-8 flex items-center gap-2 justify-center">
                    Start Lending Equipment
                  </Link>
                  <Link to="/register?role=Renter" className="btn-primary !py-3.5 !px-8 flex items-center gap-2 justify-center">
                    Find Machinery to Rent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Tractor className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">AgriTech</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 AgriTech. Peer-to-Peer Equipment Marketplace.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/marketplace" className="hover:text-gray-300">Marketplace</Link>
            <Link to="/register" className="hover:text-gray-300">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
