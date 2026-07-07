import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";

export default function Security() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-4 py-3 text-sm text-(--text-primary) placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200";

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-[16px] border border-(--border-color-hover) max-w-xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div className="border-b border-(--border-color) pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-(--text-primary)">Account Security</h3>
          <p className="text-xs text-(--text-secondary)">Update your login credentials to secure your account.</p>
        </div>
        <div className="p-2.5 bg-gym-dark/50 border border-(--border-color) rounded-[6px]">
          <Lock className="h-5 w-5 text-gym-orange" />
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-xs" role="alert">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start space-x-2.5 p-3 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 rounded-[6px] text-xs" role="status">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider">Current Password</label>
          <input type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} placeholder="Enter current password" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider">New Password</label>
          <input type="password" required minLength="6" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Minimum 6 characters" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider">Confirm New Password</label>
          <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat new password" className={inputClass} />
        </div>
        <div className="pt-2">
          <button type="submit" disabled={submitting}
            className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 hover:shadow-gym-orange/25 flex items-center justify-center space-x-2 cursor-pointer h-11">
            {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div> : <span>Update Password</span>}
          </button>
        </div>
      </form>
    </div>
  );
}
