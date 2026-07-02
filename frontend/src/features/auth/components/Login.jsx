import React, { useState, useEffect } from 'react';
import { Dumbbell, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login, setUser } = useAuth();
  
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState('');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check URL query parameters for resetToken on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setError('Please enter your admin email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setSuccessMessage(data.message || 'Password reset link sent to your email. Check your inbox (or console fallback logs).');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Forgot password request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword(resetToken, password);

      // Clear the query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname);

      setSuccessMessage('Password reset successfully! Logging you in...');
      
      // Auto login after 1.5s
      setTimeout(() => {
        setUser(data.user);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/[0.04] border border-gym-border rounded-xl pl-11 pr-4 py-3.5 text-base text-slate-800 dark:text-white placeholder-gym-text-muted focus:outline-none focus:border-gym-orange focus:bg-white/[0.06] transition-all duration-200";

  const inputIconClass = "absolute left-3.5 top-3.5 h-4 w-4 text-gym-text-muted";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-dark px-4 py-12 relative overflow-hidden noise-overlay">
      
      {/* Floating Background Orbs */}
      <div className="login-orb login-orb-1"></div>
      <div className="login-orb login-orb-2"></div>
      <div className="login-orb login-orb-3"></div>
      
      <div className="glass-panel w-full max-w-[420px] p-8 rounded-2xl shadow-2xl space-y-7 animate-slide-up relative z-10 border border-gym-border-hover">
        
        {/* Brand/Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            {/* Gradient ring */}
            <div className="absolute -inset-1 bg-gradient-to-br from-gym-orange via-orange-400 to-amber-500 rounded-2xl opacity-60 blur-sm animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-br from-gym-orange to-orange-500 p-3.5 rounded-2xl text-white shadow-lg">
              <Dumbbell className="h-7 w-7" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide text-slate-800 dark:text-white">
              APEX<span className="gradient-text">FITNESS</span>
            </h1>
            <p className="text-[11px] text-gym-text-muted uppercase tracking-[0.2em] font-semibold mt-1">
              {view === 'login' && 'Admin Console'}
              {view === 'forgot' && 'Account Recovery'}
              {view === 'reset' && 'New Password'}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-xl text-sm animate-fade-in" role="alert">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="text-[13px] leading-relaxed">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 rounded-xl text-sm animate-fade-in" role="status">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="text-[13px] leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* View 1: Login Form */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gym-text-muted uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className={inputIconClass} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@apexfit.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gym-text-muted uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); clearMessages(); }}
                    className="text-[11px] text-gym-orange hover:text-gym-orange-hover font-semibold transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} !pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gym-text-muted hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gym-orange to-orange-500 hover:from-gym-orange-hover hover:to-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all duration-250 shadow-lg shadow-gym-orange/20 hover:shadow-gym-orange/30 flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* View 2: Forgot Password Form */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-sm text-gym-text-secondary text-center leading-relaxed">
              Enter your administrator email address to receive a password reset link.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gym-text-muted uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <Mail className={inputIconClass} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexfit.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gym-orange to-orange-500 hover:from-gym-orange-hover hover:to-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all duration-250 shadow-lg shadow-gym-orange/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); clearMessages(); }}
                className="w-full border border-gym-border hover:bg-gym-elevated text-gym-text-secondary hover:text-white py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* View 3: Reset Password Form */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-sm text-gym-text-secondary text-center leading-relaxed">
              Create a secure new password for your admin account.
            </p>

            <div className="space-y-4">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gym-text-muted uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gym-text-muted uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gym-orange to-orange-500 hover:from-gym-orange-hover hover:to-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all duration-250 shadow-lg shadow-gym-orange/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              ) : (
                <span>Save & Sign In</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
