import React, { useState, useEffect } from 'react';
import { Dumbbell, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import bgVideo from '../assets/cbum-motivation.mp4';

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

  const inputClass = "w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-gym-orange focus:bg-white/[0.05] transition-all duration-200";

  const inputIconClass = "absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12 relative overflow-hidden">
      
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 pointer-events-none"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette z-0 pointer-events-none"></div>
      
      {/* Dark Overlay for text contrast */}
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>

      {/* Floating Background Orbs - subdued for video bg */}
      <div className="login-orb login-orb-1 z-0 opacity-20"></div>
      <div className="login-orb login-orb-2 z-0 opacity-20"></div>
      
      <div className="w-full max-w-[400px] p-8 rounded-[20px] shadow-2xl space-y-6 animate-slide-up relative z-10 border border-white/[0.12] bg-black/40 backdrop-blur-2xl">
        
        {/* Brand/Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            {/* Gradient ring */}
            <div className="absolute -inset-1.5 bg-gradient-to-br from-gym-orange via-orange-400 to-amber-500 rounded-[14px] opacity-60 blur-md animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-br from-gym-orange to-amber-600 p-3.5 rounded-[12px] text-white shadow-lg border border-white/20">
              <Dumbbell className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-[var(--text-primary)]">
              APEX<span className="gradient-text">FITNESS</span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-semibold mt-1.5">
              {view === 'login' && 'Admin Console'}
              {view === 'forgot' && 'Account Recovery'}
              {view === 'reset' && 'New Password'}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-sm animate-fade-in" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="text-[13px] leading-relaxed">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start space-x-2.5 p-3 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 rounded-[6px] text-sm animate-fade-in" role="status">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="text-[13px] leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* View 1: Login Form */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</label>
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
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Password</label>
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
                    className="absolute right-3.5 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
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
              className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 hover:shadow-gym-orange/25 flex items-center justify-center space-x-2 cursor-pointer"
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
            <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">
              Enter your administrator email address to receive a password reset link.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Admin Email</label>
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
                className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 flex items-center justify-center space-x-2 cursor-pointer"
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
                className="w-full border border-[var(--border-color)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-[6px] font-semibold text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
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
            <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">
              Create a secure new password for your admin account.
            </p>

            <div className="space-y-4">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">New Password</label>
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
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Confirm Password</label>
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
              className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 flex items-center justify-center space-x-2 cursor-pointer"
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
