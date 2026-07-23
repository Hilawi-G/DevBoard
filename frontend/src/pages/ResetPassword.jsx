import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LockKeyhole, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setMessage('');
    
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      setStatus('success');
      setMessage('Password has been successfully reset. You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gunmetal flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
      
      {/* Theme Toggle Positioned Top Right */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-ocean-mist/10 dark:bg-ocean-mist/20 rounded-2xl flex items-center justify-center transform -rotate-3">
            <LockKeyhole className="w-8 h-8 text-ocean-mist transform rotate-3" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Your new password must be different from previous used passwords.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-700 transition-colors">
          
          {status === 'success' ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {message}
                </p>
              </div>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-dusty-denim hover:bg-ocean-mist focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dusty-denim transition-all cursor-pointer items-center gap-2"
              >
                Continue to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status === 'error' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={!token}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-gunmetal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-dusty-denim/50 focus:border-dusty-denim sm:text-sm transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    disabled={!token}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-gunmetal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-dusty-denim/50 focus:border-dusty-denim sm:text-sm transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === 'loading' || !token}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-dusty-denim hover:bg-ocean-mist focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dusty-denim transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
