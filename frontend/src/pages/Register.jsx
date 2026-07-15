import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    if (!formData.email || !formData.password) {
      return setError('Please fill in all fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setError('Please enter a valid email address.');
    }

    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed.');
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Absolute Theme Toggle for the Auth Pages */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Column: The Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 z-10 relative">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create an account</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Get started tracking your workflows cleanly</p>
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
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer flex justify-center items-center shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Welcome Banner / Intro (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] z-10"></div>
        
        <div className="relative z-20 flex flex-col justify-center items-start p-16 w-full h-full text-white">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/20">
             <LayoutDashboard className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Start tracking your workflows today.
          </h1>
          <p className="text-xl text-indigo-100 max-w-lg leading-relaxed mb-8">
            Join thousands of developers using DevBoard to organize their sprints, manage bugs, and stay perfectly aligned.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-4">
             <div className="flex flex-col gap-2">
                <div className="w-10 h-1 bg-indigo-400 rounded-full"></div>
                <h4 className="font-bold">Simple</h4>
                <p className="text-sm text-indigo-200">No complex onboarding, just start creating tasks.</p>
             </div>
             <div className="flex flex-col gap-2">
                <div className="w-10 h-1 bg-purple-400 rounded-full"></div>
                <h4 className="font-bold">Lightning Fast</h4>
                <p className="text-sm text-indigo-200">Built to be instantly responsive and incredibly quick.</p>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}