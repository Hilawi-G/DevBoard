import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Shield, ArrowLeft, Loader2, Save } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile or security
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/me', getHeaders());
      setDisplayName(response.data.displayName || '');
      setAvatarUrl(response.data.avatarUrl || '');
      setEmail(response.data.email || '');
      setIsLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load profile.');
        setIsLoading(false);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await axios.put('http://localhost:5000/api/user/me', { displayName, avatarUrl }, getHeaders());
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await axios.put('http://localhost:5000/api/user/change-password', {
        currentPassword,
        newPassword
      }, getHeaders());
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gunmetal transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-dusty-denim" />
      </div>
    );
  }

  const INPUT_CLASS = "w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm";
  const LABEL_CLASS = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gunmetal text-slate-900 dark:text-white p-4 sm:p-8 font-sans antialiased transition-colors">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile and account security</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Nav */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => { setActiveTab('profile'); setMessage(''); setError(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-dusty-denim text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => { setActiveTab('security'); setMessage(''); setError(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-dusty-denim text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" /> Security
            </button>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
              
              {message && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                  {message}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-lg text-sm text-rose-700 dark:text-rose-400">
                  {error}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <User className="w-5 h-5 text-dusty-denim" /> Public Profile
                  </h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className={LABEL_CLASS}>Email Address (Read Only)</label>
                      <input type="text" disabled value={email} className={`${INPUT_CLASS} opacity-50 cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Display Name</label>
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        placeholder="John Doe"
                        className={INPUT_CLASS} 
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Avatar URL (Optional)</label>
                      <input 
                        type="url" 
                        value={avatarUrl} 
                        onChange={(e) => setAvatarUrl(e.target.value)} 
                        placeholder="https://example.com/avatar.png"
                        className={INPUT_CLASS} 
                      />
                      {avatarUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Preview:</p>
                          <img src={avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-dusty-denim hover:bg-ocean-mist disabled:bg-dusty-denim/50 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <Shield className="w-5 h-5 text-dusty-denim" /> Change Password
                  </h2>
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                      <label className={LABEL_CLASS}>Current Password</label>
                      <input 
                        type="password" 
                        required 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className={INPUT_CLASS} 
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className={INPUT_CLASS} 
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Confirm New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className={INPUT_CLASS} 
                      />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
