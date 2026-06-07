import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tractor, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Tractor as LenderIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'Renter';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      });
      toast.success(`Welcome to AgriTech, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4 shadow-glow-green">
            <Tractor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Join AgriTech</h1>
          <p className="text-gray-400 mt-1">Create your free account</p>
        </div>

        <div className="glass-card p-8">
          {/* Role Toggle */}
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-dark-700/60 border border-white/5">
            {['Renter', 'Lender'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  formData.role === role
                    ? role === 'Lender'
                      ? 'bg-earth-600 text-white shadow-glow-earth'
                      : 'bg-primary-600 text-white shadow-glow-green'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {role === 'Renter' ? '🌾 I want to Rent' : '🚜 I want to Lend'}
              </button>
            ))}
          </div>

          {/* Role description */}
          <p className="text-center text-gray-500 text-xs mb-6">
            {formData.role === 'Renter'
              ? 'Browse and book equipment from local farmers'
              : 'List your idle equipment and earn rental income'}
          </p>

          <form onSubmit={handleSubmit} id="register-form" className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="reg-name" name="name" type="text" value={formData.name}
                  onChange={handleChange} required className="form-input pl-10"
                  placeholder="Rajesh Kumar" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="reg-email" name="email" type="email" value={formData.email}
                  onChange={handleChange} required className="form-input pl-10"
                  placeholder="rajesh@farm.com" autoComplete="email" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="form-label">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="reg-phone" name="phone" type="tel" value={formData.phone}
                  onChange={handleChange} className="form-input pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange} required
                  className="form-input pl-10 pr-10" placeholder="Min. 6 characters"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="reg-confirm" name="confirmPassword" type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword} onChange={handleChange} required
                  className="form-input pl-10" placeholder="Re-enter password" />
              </div>
            </div>

            <button id="register-submit-btn" type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 !py-3.5 font-semibold rounded-xl transition-all
                ${formData.role === 'Lender' ? 'btn-earth' : 'btn-primary'}`}>
              {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Creating account...' : `Create ${formData.role} Account`}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
