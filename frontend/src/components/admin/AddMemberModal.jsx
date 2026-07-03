import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { memberService } from "@/services/memberService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export default function AddMemberModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    dob: "",
    phone: "",
    email: "",
    membershipType: "workout",
    startDate: new Date().toISOString().split("T")[0],
    feeAmount: "700",
    password: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        gender: "Male",
        dob: "",
        phone: "",
        email: "",
        membershipType: "strength training",
        startDate: new Date().toISOString().split("T")[0],
        feeAmount: "700",
        password: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const handleTypeChange = (type) => {
    let price = "700";
    if (type === "strength and cardio") {
      price = "1000";
    } else if (type === "personal training") {
      price = "2000";
    }

    setFormData({
      ...formData,
      membershipType: type,
      feeAmount: price,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone || !formData.dob || !formData.feeAmount) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await memberService.createMember({
        ...formData,
        feeAmount: Number(formData.feeAmount),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while registering the member.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-gym-orange transition-all duration-200";
  const labelClass = "text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider";
  const selectTriggerClass = "w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-2.5 h-auto text-sm text-[var(--text-primary)] cursor-pointer hover:border-[var(--border-color-hover)] focus:border-gym-orange transition-all duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-2xl rounded-[16px] shadow-2xl overflow-hidden border border-[var(--border-color-hover)] animate-slide-up my-auto max-h-[90vh] md:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gym-orange/30 to-transparent"></div>
          <h2 className="font-bold text-lg text-[var(--text-primary)]">
            Register New Member
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[6px] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-sm animate-fade-in" role="alert">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="text-[13px]">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className={labelClass}>Gender *</label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color-hover)] rounded-[6px] shadow-2xl">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className={labelClass}>Date of Birth *</label>
                <DatePicker
                  value={formData.dob}
                  onChange={(val) => setFormData({ ...formData, dob: val })}
                  placeholder="Select date of birth"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className={labelClass}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </div>

              {/* Membership Plan */}
              <div className="space-y-1.5">
                <label className={labelClass}>Membership Plan *</label>
                <Select
                  value={formData.membershipType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue>
                      {formData.membershipType === 'strength training' && 'Strength Training'}
                      {formData.membershipType === 'strength and cardio' && 'Strength & Cardio'}
                      {formData.membershipType === 'personal training' && 'Personal Training'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color-hover)] rounded-[6px] shadow-2xl">
                    <SelectItem value="strength training">Strength Training</SelectItem>
                    <SelectItem value="strength and cardio">Strength & Cardio</SelectItem>
                    <SelectItem value="personal training">Personal Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Membership Price */}
              <div className="space-y-1.5">
                <label className={labelClass}>Fee (₹) *</label>
                <input
                  type="number"
                  name="feeAmount"
                  required
                  min="0"
                  value={formData.feeAmount}
                  onChange={handleChange}
                  placeholder="Amount in Rupees"
                  className={inputClass}
                />
              </div>

              {/* Membership Start Date */}
              <div className="space-y-1.5">
                <label className={labelClass}>Start Date *</label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, startDate: val })}
                  placeholder="Select start date"
                  required
                />
              </div>

              {/* Member Password */}
              <div className="space-y-1.5">
                <label className={labelClass}>Login Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Default: member123"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-[var(--border-color)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white px-5 py-2.5 rounded-[6px] text-sm font-semibold transition-all duration-200 shadow-lg shadow-gym-orange/15 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? "Registering..." : "Register Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
