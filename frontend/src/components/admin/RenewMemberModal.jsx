import React, { useState, useEffect } from "react";
import { X, RefreshCw, Calendar, AlertCircle } from "lucide-react";
import { memberService } from "@/services/memberService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export default function RenewMemberModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}) {
  const [membershipType, setMembershipType] = useState("workout");
  const [renewalType, setRenewalType] = useState("1"); // '1', '2', '3', '6', '12', 'custom_months', 'custom_date'
  const [customMonths, setCustomMonths] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [futureStartDate, setFutureStartDate] = useState("");
  const [activeTab, setActiveTab] = useState("standard"); // 'standard' or 'future'
  const [feeAmount, setFeeAmount] = useState("");
  const [calculatedDates, setCalculatedDates] = useState({
    start: null,
    end: null,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getPriceForPlan = (plan, duration) => {
    const monthlyRate = plan === "workout + cardio" ? 1000 : 700;
    return monthlyRate * Number(duration || 1);
  };

  const suggestFee = (
    plan,
    duration,
    customMns,
    customDt,
    memb,
    startDtOverride,
  ) => {
    if (!memb) return "0";

    if (duration !== "custom_months" && duration !== "custom_date") {
      return getPriceForPlan(plan, duration).toString();
    }

    if (duration === "custom_months") {
      return getPriceForPlan(plan, customMns || 1).toString();
    }

    // custom_date
    if (customDt) {
      let newStart;
      if (startDtOverride) {
        newStart = new Date(startDtOverride);
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentEnd = new Date(memb.endDate);
        currentEnd.setHours(0, 0, 0, 0);
        newStart = currentEnd > today ? currentEnd : today;
      }

      const newEnd = new Date(customDt);
      const diffTime = Math.max(0, newEnd.getTime() - newStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const monthlyRate = plan === "workout + cardio" ? 1000 : 700;
      const dailyRate = monthlyRate / 30;
      return Math.round(diffDays * dailyRate).toString();
    }

    return getPriceForPlan(plan, 1).toString();
  };

  useEffect(() => {
    if (member) {
      const plan = member.membershipType || "workout";
      setMembershipType(plan);
      setRenewalType("1");
      setCustomMonths("");
      setCustomDate("");
      setFutureStartDate("");
      setActiveTab("standard");
      setFeeAmount(getPriceForPlan(plan, 1).toString());
      calculateNewDates(plan, "1", "", "", member, null);
    }
    setError(null);
  }, [member, isOpen]);

  const calculateNewDates = (
    plan,
    duration,
    customMns,
    customDt,
    memb,
    startDtOverride,
  ) => {
    if (!memb) return;

    let newStart;
    if (startDtOverride) {
      newStart = new Date(startDtOverride);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentEnd = new Date(memb.endDate);
      currentEnd.setHours(0, 0, 0, 0);

      // If membership is active/due, extend from current end date. Otherwise start fresh from today
      newStart = currentEnd > today ? currentEnd : today;
    }

    const newEnd = new Date(newStart);

    if (duration === "custom_date") {
      if (customDt) {
        newEnd.setTime(new Date(customDt).getTime());
      }
    } else {
      const monthsToAdd =
        duration === "custom_months"
          ? Number(customMns || 1)
          : Number(duration);
      newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
    }

    setCalculatedDates({
      start: newStart,
      end: newEnd,
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    let startOverride = null;
    if (tab === "future") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentEnd = new Date(member.endDate);
      currentEnd.setHours(0, 0, 0, 0);
      const autoStart = currentEnd > today ? currentEnd : today;
      const startStr = autoStart.toISOString().split("T")[0];
      setFutureStartDate(startStr);
      startOverride = startStr;
    } else {
      setFutureStartDate("");
    }

    const price = suggestFee(
      membershipType,
      renewalType,
      customMonths,
      customDate,
      member,
      startOverride,
    );
    setFeeAmount(price);
    calculateNewDates(
      membershipType,
      renewalType,
      customMonths,
      customDate,
      member,
      startOverride,
    );
  };

  const handleDurationChange = (duration) => {
    setRenewalType(duration);

    const startOverride = activeTab === "future" ? futureStartDate : null;
    const price = suggestFee(
      membershipType,
      duration,
      customMonths,
      customDate,
      member,
      startOverride,
    );
    setFeeAmount(price);

    calculateNewDates(
      membershipType,
      duration,
      customMonths,
      customDate,
      member,
      startOverride,
    );
  };

  const handleCustomMonthsChange = (e) => {
    const val = e.target.value;
    setCustomMonths(val);

    const startOverride = activeTab === "future" ? futureStartDate : null;
    const price = suggestFee(
      membershipType,
      renewalType,
      val,
      customDate,
      member,
      startOverride,
    );
    setFeeAmount(price);

    calculateNewDates(
      membershipType,
      renewalType,
      val,
      customDate,
      member,
      startOverride,
    );
  };

  const handleCustomDateChange = (dt) => {
    setCustomDate(dt);

    const startOverride = activeTab === "future" ? futureStartDate : null;
    const price = suggestFee(
      membershipType,
      renewalType,
      customMonths,
      dt,
      member,
      startOverride,
    );
    setFeeAmount(price);

    calculateNewDates(
      membershipType,
      renewalType,
      customMonths,
      dt,
      member,
      startOverride,
    );
  };

  const handleFutureStartDateChange = (dt) => {
    setFutureStartDate(dt);

    const price = suggestFee(
      membershipType,
      renewalType,
      customMonths,
      customDate,
      member,
      dt,
    );
    setFeeAmount(price);

    calculateNewDates(
      membershipType,
      renewalType,
      customMonths,
      customDate,
      member,
      dt,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!feeAmount) {
      setError("Please specify the renewal payment amount.");
      return;
    }

    const isCustomDate = renewalType === "custom_date";
    const isCustomMonths = renewalType === "custom_months";

    if (isCustomDate && !customDate) {
      setError("Please select a custom expiration date.");
      return;
    }

    if (isCustomMonths && (!customMonths || Number(customMonths) <= 0)) {
      setError("Please enter a valid number of months.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        feeAmount: Number(feeAmount),
        membershipType,
      };

      if (activeTab === "future" && futureStartDate) {
        payload.startDate = futureStartDate;
      }

      if (isCustomDate) {
        payload.renewalType = "custom";
        payload.customDate = customDate;
      } else {
        payload.renewalType = "months";
        payload.months = isCustomMonths
          ? Number(customMonths)
          : Number(renewalType);
      }

      await memberService.renewMember(member._id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to renew membership.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen || !member) return null;

  const inputClass = "w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-3 text-base text-[var(--text-primary)] placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200";
  const labelClass = "text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider";
  const selectTriggerClass = "w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-3 h-auto text-base text-[var(--text-primary)] cursor-pointer hover:border-[var(--border-color-hover)] focus:border-gym-orange transition-all duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-md rounded-[16px] shadow-2xl overflow-hidden border border-[var(--border-color-hover)] animate-slide-up my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gym-orange/30 to-transparent"></div>
          <h2 className="font-bold text-lg text-[var(--text-primary)] flex items-center space-x-2">
            <RefreshCw className="h-4.5 w-4.5 text-gym-orange" />
            <span>Renew Membership</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[6px] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-sm animate-fade-in" role="alert">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="text-[13px]">{error}</span>
              </div>
            )}

            {/* Member Details Summary */}
            <div className="bg-[var(--bg-elevated)]/50 border border-[var(--border-color)] p-4 rounded-[6px] space-y-2.5">
              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
                  Member
                </p>
                <h3 className="font-bold text-[var(--text-primary)] text-lg">
                  {member.name}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[var(--border-color)]/50 text-xs">
                <div>
                  <span className="text-[var(--text-muted)]">Current Plan:</span>
                  <p className="text-[var(--text-primary)] capitalize font-semibold mt-0.5">
                    {member.membershipType}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">End Date:</span>
                  <p className="text-[var(--text-primary)] font-semibold mt-0.5">
                    {formatDate(new Date(member.endDate))}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-gym-dark/40 border border-[var(--border-color)] p-1 rounded-[6px]">
              <button
                type="button"
                onClick={() => handleTabChange("standard")}
                className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 rounded-[6px] cursor-pointer ${
                  activeTab === "standard"
                    ? "bg-gym-orange text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("future")}
                className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 rounded-[6px] cursor-pointer ${
                  activeTab === "future"
                    ? "bg-gym-orange text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Future Start
              </button>
            </div>

            <div className="space-y-4">
              {/* Custom Start Date (Future Extension tab only) */}
              {activeTab === "future" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className={labelClass}>Start Date *</label>
                  <DatePicker
                    value={futureStartDate}
                    onChange={handleFutureStartDateChange}
                    placeholder="Select start date"
                    required
                  />
                </div>
              )}

              {/* Renewal Term Selection */}
              <div className="space-y-1.5">
                <label className={labelClass}>Duration *</label>
                <Select
                  value={renewalType}
                  onValueChange={handleDurationChange}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue>
                      {renewalType === '1' && '1 Month'}
                      {renewalType === '2' && '2 Months'}
                      {renewalType === '3' && '3 Months'}
                      {renewalType === '6' && '6 Months'}
                      {renewalType === '12' && '12 Months (1 Year)'}
                      {renewalType === 'custom_months' && 'Custom Months'}
                      {renewalType === 'custom_date' && 'Custom Date'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color-hover)] rounded-[6px] shadow-2xl">
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="2">2 Months</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months (1 Year)</SelectItem>
                    <SelectItem value="custom_months">Custom Months</SelectItem>
                    <SelectItem value="custom_date">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Months Input */}
              {renewalType === "custom_months" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className={labelClass}>Number of Months *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={customMonths}
                    onChange={handleCustomMonthsChange}
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Custom Date Input */}
              {renewalType === "custom_date" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className={labelClass}>Custom End Date *</label>
                  <DatePicker
                    value={customDate}
                    onChange={handleCustomDateChange}
                    placeholder="Select end date"
                    required
                  />
                </div>
              )}

              {/* Renewal Fee */}
              <div className="space-y-1.5">
                <label className={labelClass}>Renewal Fee (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-[var(--text-muted)]">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="Amount in Rupees"
                    className={`${inputClass} !pl-8`}
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {calculatedDates.start && calculatedDates.end && (
                <div className="bg-gym-orange/[0.04] border border-gym-orange/10 p-4 rounded-[6px] space-y-2 text-xs animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)] flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-[var(--text-muted)]" /> Start Date:
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                      {formatDate(calculatedDates.start)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)] flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-[var(--text-muted)]" /> New Expiry:
                    </span>
                    <span className="text-gym-orange font-bold tabular-nums">
                      {formatDate(calculatedDates.end)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-[var(--border-color)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer h-11 flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white px-5 py-3 rounded-[6px] text-sm font-bold transition-all duration-250 shadow-lg shadow-gym-orange/15 cursor-pointer h-11"
            >
              <span>{submitting ? "Processing..." : "Confirm Renewal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
