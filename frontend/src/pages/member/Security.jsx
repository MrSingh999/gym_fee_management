import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";
import { motion } from "framer-motion";

export default function Security() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { currentPassword, newPassword, confirmPassword } = form;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setSuccess("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] pl-4 pr-11 py-3 text-sm text-(--text-primary) placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200 font-mono";

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 22 
      } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="glass-panel p-4 sm:p-6 rounded-[16px] border border-(--border-color-hover) max-w-xl mx-auto space-y-4 sm:space-y-6"
    >
      <motion.div variants={itemVariants} className="border-b border-(--border-color) pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-(--text-primary) font-mono">Account Security</h3>
          <p className="text-xs text-(--text-secondary)">Update your login credentials to secure your account.</p>
        </div>
        <div className="p-2.5 bg-gym-dark/50 border border-(--border-color) rounded-[6px]">
          <Lock className="h-5 w-5 text-gym-orange" />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-xs font-mono" role="alert">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div variants={itemVariants} className="flex items-start space-x-2.5 p-3 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 rounded-[6px] text-xs font-mono" role="status">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? "text" : "password"} required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} placeholder="Enter current password" className={inputClass} />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer select-none">
              {showCurrent ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono">New Password</label>
          <div className="relative">
            <input type={showNew ? "text" : "password"} required minLength="6" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Minimum 6 characters" className={inputClass} />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer select-none">
              {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono">Confirm New Password</label>
          <div className="relative">
            <input type={showConfirm ? "text" : "password"} required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat new password" className={inputClass} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer select-none">
              {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <motion.button 
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            type="submit" 
            disabled={submitting}
            className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 hover:shadow-gym-orange/25 flex items-center justify-center space-x-2 cursor-pointer h-11 font-mono uppercase tracking-wider"
          >
            {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div> : <span>Update Password</span>}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
