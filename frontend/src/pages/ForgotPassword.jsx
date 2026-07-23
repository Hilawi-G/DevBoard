import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setStatus('success');
      setMessage(response.data.message);
      if (response.data.devLink) {
        setDevLink(response.data.devLink);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          <div className="w-16 h-16 bg-dusty-denim/10 dark:bg-dusty-denim/20 rounded-2xl flex items-center justify-center transform rotate-3">
            <KeyRound className="w-8 h-8 text-dusty-denim transform -rotate-3" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-700 transition-colors">
          
          {status === 'success' ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {message}
                </p>
              </div>
              
              {/* DEV ONLY Link Display */}
              {devLink && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-left">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wider">
                    Developer Mode Only
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    Since no email service is configured, click the link below to continue the reset flow:
                  </p>
                  <a 
                    href={devLink}
                    className="block p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 rounded text-sm text-dusty-denim break-all hover:underline"
                  >
                    {devLink}
                  </a>
                </div>
              )}

              <div className="mt-6">
                <Link to="/login" className="text-sm font-medium text-dusty-denim hover:text-ocean-mist transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status === 'error' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-gunmetal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-dusty-denim/50 focus:border-dusty-denim sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-dusty-denim hover:bg-ocean-mist focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dusty-denim transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-dusty-denim dark:hover:text-dusty-denim transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
