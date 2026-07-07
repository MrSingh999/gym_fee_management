import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import bgVideo from "../assets/cbum-workout-compressed.mp4";
import Logo from "@/components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";

const BackgroundVideo = React.memo(() => {
  return (
    <div
      className="hidden md:block absolute inset-0 bg-black z-0 pointer-events-none"
      style={{ isolation: "isolate", contain: "strict" }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
    </div>
  );
});

export default function Login() {
  const { login, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [view, setView] = useState("login"); // 'login', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState("");

  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check URL query parameters for resetToken on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      setResetToken(token);
      setView("reset");
    }
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setError("Please enter your admin email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setSuccessMessage(
        data.message ||
          "Password reset link sent to your email. Check your inbox (or console fallback logs).",
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Forgot password request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword(resetToken, password);

      // Clear the query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname);

      setSuccessMessage("Password reset successfully! Logging you in...");

      // Auto login after 1.5s
      setTimeout(() => {
        setUser(data.user);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border border-(--border-color) rounded-[6px] pl-10 pr-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none transition-all duration-200 font-mono ${
    theme === "dark"
      ? "bg-black/40 text-[#ffffff] focus:border-[#ffffff] focus:bg-black/60"
      : "bg-zinc-50/60 text-[#09090b] focus:border-[#09090b] focus:bg-white"
  }`;

  const inputIconClass = "absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-500";

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden saas-grid-bg noise-overlay ${theme === "dark" ? "bg-black" : "bg-zinc-50"}`}
    >
      {/* Background Video (Memoized to prevent React rerendering stutter/freezes) */}
      <BackgroundVideo />

      {/* Dynamic Dark Mask Overlay (stutter-free alternative to video filters) */}
      <div
        className={`hidden md:block absolute inset-0 transition-opacity duration-300 pointer-events-none z-0 ${
          theme === "dark" ? "bg-black/50" : "bg-black/70"
        }`}
      />

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette z-0 pointer-events-none"></div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-4 right-4 z-50 p-2.5 rounded-[8px] border transition-all duration-200 cursor-pointer ${
          theme === "dark"
            ? "border-zinc-800 bg-[#09090b]/80 hover:bg-zinc-900 text-zinc-400 hover:text-white"
            : "border-zinc-200 bg-white/80 hover:bg-zinc-50 text-zinc-600 hover:text-black"
        }`}
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-[380px] p-8 rounded-[16px] border backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-300 relative z-10 space-y-6 ${
          theme === "dark"
            ? "border-zinc-800/80 bg-[#09090b]/90 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
            : "border-zinc-200/80 bg-white/90 shadow-[0_30px_60px_rgba(0,0,0,0.06)]"
        }`}
      >
        {/* Brand/Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Logo
            className={`h-14 w-14 hover:scale-105 transition-transform duration-200 ${theme === "dark" ? "text-white" : "text-black"}`}
          />
          <div>
            <h1
              className={`font-bold text-xl tracking-tight font-mono ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              HEAVEN'S ARENA
            </h1>
            <p
              className={`text-[10px] uppercase tracking-[0.25em] font-mono mt-1 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}
            >
              {view === "login" && "Portal Login"}
              {view === "forgot" && "Account Recovery"}
              {view === "reset" && "Create Password"}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-xs leading-normal"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start space-x-2.5 p-3 bg-zinc-100/10 border border-zinc-100/15 text-zinc-200 rounded-[6px] text-xs leading-normal"
            >
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View 1: Login Form */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  Email
                </label>
                <div className="relative">
                  <Mail className={inputIconClass} />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com or phone"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      clearMessages();
                    }}
                    className={`text-[10px] text-zinc-400 font-semibold transition font-mono cursor-pointer ${theme === "dark" ? "hover:text-white" : "hover:text-black"}`}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} !pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full disabled:opacity-50 py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer font-mono shadow-sm ${
                theme === "dark"
                  ? "bg-[#ffffff] hover:bg-[#e4e4e7] text-black"
                  : "bg-[#09090b] hover:bg-[#27272a] text-white"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center">
                  <Logo
                    className={`h-5 w-5 ${theme === "dark" ? "text-black" : "text-white"} animate-pulse`}
                  />
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* View 2: Forgot Password Form */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-zinc-400 text-center leading-relaxed font-mono">
              Enter email below to fetch a reset token key.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className={inputIconClass} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full disabled:opacity-50 py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer font-mono ${
                  theme === "dark"
                    ? "bg-[#ffffff] hover:bg-[#e4e4e7] text-black"
                    : "bg-[#09090b] hover:bg-[#27272a] text-white"
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/30 border-t-black"></div>
                ) : (
                  <span>Send Request</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView("login");
                  clearMessages();
                }}
                className={`w-full border py-2 rounded-[6px] font-semibold text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer font-mono ${
                  theme === "dark"
                    ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-black"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            </div>
          </form>
        )}

        {/* View 3: Reset Password Form */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-zinc-400 text-center leading-relaxed font-mono">
              Configure a new password for your account.
            </p>

            <div className="space-y-3">
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  New Password
                </label>
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  Confirm Password
                </label>
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
              className={`w-full disabled:opacity-50 py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer font-mono ${
                theme === "dark"
                  ? "bg-[#ffffff] hover:bg-[#e4e4e7] text-black"
                  : "bg-[#09090b] hover:bg-[#27272a] text-white"
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/30 border-t-black"></div>
              ) : (
                <span>Save Password</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
