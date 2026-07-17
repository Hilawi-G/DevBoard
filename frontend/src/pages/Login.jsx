import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      return setError('Please enter both credentials.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setError('Please enter a valid email address.');
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login credentials invalid.');
      }

      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:flex-row-reverse bg-slate-50 dark:bg-gunmetal transition-colors">
      
      {/* Absolute Theme Toggle for the Auth Pages */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Right Column (Now Left visually): The Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 z-10 relative">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Log in to manage your engineering board</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg transition-colors">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-dusty-denim hover:bg-ocean-mist disabled:bg-dusty-denim/50 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer flex justify-center items-center shadow-lg shadow-dusty-denim/25"
            >
              {loading ? 'Verifying pass...' : 'Log in'}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New to DevBoard?{' '}
              <Link to="/register" className="text-dusty-denim dark:text-dusty-denim hover:text-ocean-mist dark:hover:text-ocean-mist font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Left Column (Now Right visually): Welcome Banner / Intro (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gunmetal">
        <div className="absolute inset-0 bg-gradient-to-br from-gunmetal via-dusty-denim to-ocean-mist opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] z-10"></div>
        
        {/* Swirvy SVG Divider */}
        <svg 
          className="absolute top-0 -right-1 h-full w-24 text-slate-50 dark:text-gunmetal z-20 transition-colors" 
          preserveAspectRatio="none" 
          viewBox="0 0 100 100"
        >
          <path fill="currentColor" d="M100,0 L100,100 L50,100 C0,75 100,25 50,0 Z" />
        </svg>

        <div className="relative z-20 flex flex-col justify-center items-start p-16 w-full h-full text-white">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/20">
             <LayoutDashboard className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Welcome to DevBoard!
          </h1>
          <p className="text-xl text-indigo-100 max-w-lg leading-relaxed mb-8">
            The cleanest, most intuitive way to track your engineering tasks. Stay organized, stay productive, and ship faster.
          </p>
          
          <div className="flex gap-4">
             <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-dusty-denim bg-gunmetal flex items-center justify-center overflow-hidden">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=393e41`} alt="Avatar" className="w-full h-full" />
                  </div>
                ))}
             </div>
             <div className="flex flex-col justify-center">
                <span className="text-sm font-bold">Join 10,000+ developers</span>
                <span className="text-xs text-white/80">who improved their workflow.</span>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}