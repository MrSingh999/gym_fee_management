import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Calendar,
  CreditCard,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Sun,
  Moon,
  TrendingUp,
  FileText,
  BadgeAlert,
  ChevronRight,
  TrendingDown,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { memberService } from "@/services/memberService";
import { authService } from "@/services/authService";

export default function MemberPortal() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'workouts', 'billing'
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  // Security Form States
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [securityError, setSecurityError] = useState(null);
  const [securitySuccess, setSecuritySuccess] = useState(null);
  const [securitySubmitting, setSecuritySubmitting] = useState(false);

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    const { currentPassword, newPassword, confirmPassword } = securityForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }

    setSecuritySubmitting(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setSecuritySuccess("Password updated successfully.");
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      setSecurityError(err.message || "Failed to update password.");
    } finally {
      setSecuritySubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "billing") {
      fetchPaymentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchPaymentHistory = async () => {
    const memberId = user?.id || user?._id;
    if (!memberId) return;

    setLoadingPayments(true);
    setPaymentsError(null);
    try {
      const data = await memberService.getMemberPayments(memberId);
      setPayments(data);
    } catch (err) {
      console.error(err);
      setPaymentsError("Failed to load payment history.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await logout();
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  // Date formatting helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dobStr) => {
    if (!dobStr) return "N/A";
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Membership status & remaining days calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = user.feeStartDate
    ? new Date(user.feeStartDate)
    : new Date();
  const endDate = user.feeEndDate ? new Date(user.feeEndDate) : new Date();
  endDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const totalDays =
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 30;

  const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  const elapsedDays = totalDays - (remainingDays > 0 ? remainingDays : 0);

  const elapsedDaysClamped = Math.max(0, Math.min(totalDays, elapsedDays));
  const percentRemaining =
    totalDays > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(((totalDays - elapsedDaysClamped) / totalDays) * 100),
          ),
        )
      : 0;

  // Define structured workout routines based on plan type
  const getWorkoutRoutine = () => {
    const planName = (user.plan?.name || "strength training").toLowerCase();

    if (planName.includes("personal") || planName.includes("trainer")) {
      return [
        {
          day: "Monday - Saturday",
          focus: "1-on-1 Customized Routine",
          routine:
            "Your training schedule is fully customized by your personal trainer. Please consult with your trainer for your daily specialized routines, progress tracking, and diet plan.",
        },
        {
          day: "Sunday",
          focus: "Active Recovery",
          routine:
            "Relax and recover. Keep up with hydration, follow your customized nutrition plan, and ensure you get 8 hours of quality rest.",
        },
      ];
    }

    if (planName.includes("cardio")) {
      return [
        {
          day: "Monday",
          focus: "Chest & Triceps + HIIT Cardio",
          routine:
            "Bench press (4x8), Incline dumbbell press (3x10), Overhead tricep extension (3x12), Cable chest fly (3x15). Finisher: 15 mins HIIT Treadmill Sprints (30s on, 30s off).",
        },
        {
          day: "Tuesday",
          focus: "Back & Biceps + LISS Cardio",
          routine:
            "Deadlift (4x6), Lat pulldowns (3x10), Seated cable row (3x12), Hammer curls (3x15), Incline bicep curl (3x12). Finisher: 20 mins LISS Stairmaster.",
        },
        {
          day: "Wednesday",
          focus: "Legs & Core Intensity",
          routine:
            "Barbell back squats (4x8), Leg press (3x10), Romanian deadlifts (3x12), Standing calf raises (4x15), Hanging leg raises (3x15), Plank hold (3x60s).",
        },
        {
          day: "Thursday",
          focus: "Shoulders & Arms + Rowing",
          routine:
            "Military press (4x8), Lateral raises (4x12), Face pulls (3x15), Tricep pushdowns (3x12), Barbell curls (3x10). Finisher: 15 mins Rowing Machine interval.",
        },
        {
          day: "Friday",
          focus: "Full Body Conditioning",
          routine:
            "Kettlebell swings (4x15), Dumbbell thrusters (3x10), Pull-ups (3x max), Push-ups (3x20), Mountain climbers (3x45s). Finisher: 10 mins HIIT Elliptical.",
        },
        {
          day: "Saturday",
          focus: "Active Recovery & Cardio",
          routine:
            "30 mins low-intensity steady-state (LISS) jogging or cycling, followed by deep static stretching & foam rolling (20 mins).",
        },
        {
          day: "Sunday",
          focus: "Rest Day (Rejuvenate)",
          routine:
            "Complete rest. Focus on hydration, high protein intake, and getting 8 hours of quality sleep.",
        },
      ];
    } else {
      return [
        {
          day: "Monday",
          focus: "Chest & Triceps Power",
          routine:
            "Bench press (4x8), Incline dumbbell press (3x10), Cable flyes (3x12), Skull crushers (3x10), Tricep overhead extensions (3x12).",
        },
        {
          day: "Tuesday",
          focus: "Back & Biceps Width",
          routine:
            "Pull-ups (4x max), Barbell rows (4x8), Lat pulldowns (3x10), Barbell bicep curls (3x10), Hammer curls (3x12).",
        },
        {
          day: "Wednesday",
          focus: "Legs / Lower Body",
          routine:
            "Squats (4x8), Romanian deadlifts (3x10), Leg extensions (3x12), Lying leg curls (3x12), Standing calf raises (4x15).",
        },
        {
          day: "Thursday",
          focus: "Shoulders & Trap Mass",
          routine:
            "Overhead barbell press (4x8), Dumbbell lateral raises (4x12), Bent-over rear delt flyes (3x15), Dumbbell shrugs (3x12).",
        },
        {
          day: "Friday",
          focus: "Arm Day Pumps & Core",
          routine:
            "Close-grip bench press (3x10), Preacher curls (3x10), Tricep pushdowns (3x12), Incline dumbbell curls (3x12), Hanging leg raises (3x15), Crunches (3x20).",
        },
        {
          day: "Saturday",
          focus: "Active Mobility & Stretch",
          routine:
            "Light cardio (15 min jog), followed by dynamic stretching, yoga poses, and functional core movements (Plank holds, Bird-dog).",
        },
        {
          day: "Sunday",
          focus: "Rest Day",
          routine:
            "Allow muscle tissues to recover. Hydrate well and perform light walking.",
        },
      ];
    }
  };

  const workoutRoutine = getWorkoutRoutine();

  // Status visual configurations
  const isOverdue =
    remainingDays < 0 ||
    user.status?.toLowerCase() === "expired" ||
    user.status?.toLowerCase() === "overdue";
  const isInactive = user.status?.toLowerCase() === "inactive";
  const isDisabled = isOverdue || isInactive;

  const getStatusBadge = () => {
    const computedStatus = user.status?.toLowerCase();

    if (isOverdue || isInactive) {
      return (
        <span className="inline-flex items-center space-x-1 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full animate-pulse-glow">
          <span className="status-dot status-dot-overdue"></span>
          <span>INACTIVE</span>
        </span>
      );
    } else if (remainingDays <= 7) {
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full animate-pulse-glow">
          <span className="status-dot status-dot-due"></span>
          <span>RENEWAL DUE</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wider px-3 py-1 rounded-full">
          <span className="status-dot status-dot-active"></span>
          <span>ACTIVE</span>
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gym-dark text-slate-800 dark:text-gray-100">
      {/* Member Navbar */}
      <nav className="glass-panel gradient-border-bottom sticky top-0 z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-gym-orange to-orange-400 p-2.5 rounded-[6px] text-white shadow-lg">
              <Dumbbell className="h-5 w-5 animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-wide text-[var(--text-primary)]">
              APEX<span className="gradient-text">FITNESS</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              className="flex items-center justify-center w-9 h-9 rounded-[6px] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 border border-[var(--border-color)] hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 pb-20 md:py-8 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] tracking-tight">
              Hey, <span className="gradient-text">{user.name}</span>!
            </h1>
            <p className="text-[var(--text-secondary)] mt-1.5 text-xs sm:text-sm">
              Welcome back to your fitness portal. Track your progress below.
            </p>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Tab Controller */}
        <div className="flex space-x-1 bg-gym-dark/50 border border-[var(--border-color)] p-1 rounded-[6px] w-full max-w-lg animate-fade-in stagger-2">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "workouts", label: "Workouts", icon: Dumbbell },
            { id: "billing", label: "Billing History", icon: CreditCard },
            { id: "security", label: "Security", icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-[6px] text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gym-orange text-white shadow-md shadow-gym-orange/15"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[50vh]">
          {/* Tab 1: Overview Panel */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in stagger-3">
              {/* Membership Progress Card (Glow indicator) */}
              <div className="glass-panel p-6 rounded-[16px] flex flex-col items-center justify-center text-center space-y-5 border border-[var(--border-color-hover)] lg:col-span-1">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Membership Validity
                </h3>

                {/* SVG Circular Progress Bar */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      strokeWidth="8"
                      stroke="rgba(255,255,255,0.03)"
                      fill="transparent"
                      className="dark:stroke-white/[0.04] stroke-slate-200"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      strokeWidth="8"
                      strokeDasharray={376.8}
                      strokeDashoffset={
                        376.8 - (376.8 * percentRemaining) / 100
                      }
                      strokeLinecap="round"
                      stroke={
                        remainingDays < 0
                          ? "#ef4444"
                          : remainingDays <= 7
                            ? "#eab308"
                            : "#f97316"
                      }
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                      {remainingDays > 0 ? remainingDays : 0}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                      Days Left
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 w-full">
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>Active Period</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {percentRemaining}% Time Remaining
                    </span>
                  </div>
                  <div className="w-full bg-gym-dark/50 border border-[var(--border-color)] p-3.5 rounded-[6px] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">
                        Start Date:
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatDate(user.feeStartDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">
                        Expiry Date:
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatDate(user.feeEndDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Profile details */}
              <div className="glass-panel p-6 rounded-[16px] space-y-6 lg:col-span-2 border border-[var(--border-color-hover)]">
                <div className="border-b border-[var(--border-color)] pb-4">
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">
                    Profile Overview
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Your registered personal and member details.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item: Name */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Full Name
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                        {user.name}
                      </h4>
                    </div>
                  </div>

                  {/* Item: Contact */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Mobile Number
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                        {user.mobile || user.phone}
                      </h4>
                    </div>
                  </div>

                  {/* Item: Email */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Email Address
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                        {user.email || "No email registered"}
                      </h4>
                    </div>
                  </div>

                  {/* Item: Plan Tier */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Membership Plan
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 capitalize truncate">
                        {user.plan?.name || "Workout"} Plan
                      </h4>
                    </div>
                  </div>

                  {/* Item: Age & Gender */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Age / Gender
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                        {calculateAge(user.dob)} Years / {user.gender || "N/A"}
                      </h4>
                    </div>
                  </div>

                  {/* Item: Joining Date */}
                  <div className="bg-gym-dark/30 border border-[var(--border-color)]/40 p-4 rounded-[6px] flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gym-orange/10 text-gym-orange rounded-[6px] shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                        Member Since
                      </p>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                        {formatDate(user.joiningDate)}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Expiry alerts */}
                {isDisabled ? (
                  <div className="flex items-start space-x-3 p-4 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px]">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                    <div className="text-xs">
                      <strong className="font-bold text-red-400">
                        Membership has Expired!
                      </strong>
                      <p className="mt-1 leading-relaxed text-red-400/90">
                        Your gym entry credentials might be suspended. Please
                        reach out to the gym administrator to renew your plan.
                      </p>
                    </div>
                  </div>
                ) : remainingDays <= 7 ? (
                  <div className="flex items-start space-x-3 p-4 bg-amber-500/[0.06] border border-amber-500/15 text-amber-400 rounded-[6px] animate-pulse-glow">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
                    <div className="text-xs">
                      <strong className="font-bold text-amber-400">
                        Membership Expires Soon!
                      </strong>
                      <p className="mt-1 leading-relaxed text-amber-400/90">
                        Your plan will expire in {remainingDays} days. Contact
                        the reception desk to prevent any disruption in gym
                        access.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3 p-4 bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-400 rounded-[6px]">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
                    <div className="text-xs">
                      <strong className="font-bold text-emerald-400">
                        Everything Looks Great!
                      </strong>
                      <p className="mt-1 leading-relaxed text-emerald-400/95">
                        Your membership status is fully active. Follow your
                        daily training split in the Workouts tab!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Workouts Panel */}
          {activeTab === "workouts" && (
            <div className="space-y-6 animate-fade-in stagger-3">
              {/* Header card with plan description */}
              <div className="glass-panel p-6 rounded-[16px] border border-[var(--border-color-hover)] space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] text-gym-orange bg-gym-orange/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      Current Training Plan
                    </span>
                    <h2 className="font-bold text-xl sm:text-2xl text-[var(--text-primary)] capitalize mt-2">
                      {user.plan?.name || "Workout"} Split
                    </h2>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                      Plan Rate
                    </p>
                    <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
                      ₹{(user.plan?.price || 700).toLocaleString()}{" "}
                      <span className="text-xs text-[var(--text-muted)] font-normal">
                        / {user.plan?.durationDays || 30} days
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-gym-dark/45 border border-[var(--border-color)] p-4 rounded-[6px]">
                  <h4 className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5">
                    Plan Description
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {user.plan?.description ||
                      "Your gym training routine configured for general muscle hypertrophy, strength, and structural fitness."}
                  </p>
                </div>
              </div>

              {/* Weekly Workout Split */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-[var(--text-primary)] pl-1">
                  Weekly Training Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                  {workoutRoutine.map((item, idx) => {
                    const isToday =
                      today.getDay() === (idx === 6 ? 0 : idx + 1); // map indexes to days

                    return (
                      <div
                        key={item.day}
                        className={`p-4 rounded-[6px] border transition-all duration-300 ${
                          isToday
                            ? "bg-gym-orange/[0.04] border-gym-orange ring-1 ring-gym-orange/20 shadow-md shadow-gym-orange/5"
                            : "bg-gym-dark/25 hover:bg-gym-dark/40 border-[var(--border-color)] hover:border-[var(--border-color-hover)]"
                        }`}
                      >
                        <div className="flex justify-between items-center pb-2.5 border-b border-[var(--border-color)]/40">
                          <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                            {item.day}
                          </span>
                          {isToday && (
                            <span className="bg-gym-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <h4
                            className={`font-bold text-xs tracking-wide ${isToday ? "text-gym-orange" : "text-[var(--text-primary)]"}`}
                          >
                            {item.focus}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-2 line-clamp-5 hover:line-clamp-none transition-all duration-300">
                            {item.routine}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Billing History Panel */}
          {activeTab === "billing" && (
            <div className="glass-panel p-5 sm:p-6 rounded-[16px] border border-[var(--border-color-hover)] space-y-6 animate-fade-in stagger-3">
              <div className="border-b border-[var(--border-color)] pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">
                    Billing History
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Overview of all subscription invoices and renewals.
                  </p>
                </div>
                <div className="p-2.5 bg-gym-dark/50 border border-[var(--border-color)] rounded-[6px]">
                  <CreditCard className="h-5 w-5 text-gym-orange" />
                </div>
              </div>

              {loadingPayments ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border-color)] border-t-gym-orange mx-auto"></div>
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    Loading billing data...
                  </p>
                </div>
              ) : paymentsError ? (
                <div className="text-center py-8 text-red-400 text-xs">
                  {paymentsError}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-muted)] text-xs">
                  No payment invoices found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[6px] border border-[var(--border-color)] bg-gym-dark/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gym-dark/70 border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Paid On</th>
                        <th className="p-4">Membership Plan</th>
                        <th className="p-4">Billing Period</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gym-border/30">
                      {payments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="table-row-hover hover:bg-[var(--bg-elevated)]/20 text-[var(--text-secondary)]"
                        >
                          <td className="p-4 font-semibold text-[var(--text-primary)]">
                            {formatDate(
                              payment.paymentDate || payment.createdAt,
                            )}
                          </td>
                          <td className="p-4 capitalize">
                            {payment.plan?.name || "Workout"}
                          </td>
                          <td className="p-4">
                            {formatDate(payment.startDate)} —{" "}
                            {formatDate(payment.endDate)}
                          </td>
                          <td className="p-4 font-bold text-[var(--text-primary)] tabular-nums">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gym-dark/50 border border-[var(--border-color)] text-[10px] font-semibold uppercase tracking-wide">
                              {payment.paymentMethod || "Cash"}
                            </span>
                          </td>
                          <td
                            className="p-4 max-w-[200px] truncate"
                            title={payment.remarks}
                          >
                            {payment.remarks || "Standard Renewal"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Security Panel */}
          {activeTab === "security" && (
            <div className="glass-panel p-5 sm:p-6 rounded-[16px] border border-[var(--border-color-hover)] max-w-xl mx-auto space-y-6 animate-fade-in stagger-3">
              <div className="border-b border-[var(--border-color)] pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">
                    Account Security
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Update your login credentials to secure your account.
                  </p>
                </div>
                <div className="p-2.5 bg-gym-dark/50 border border-[var(--border-color)] rounded-[6px]">
                  <Lock className="h-5 w-5 text-gym-orange" />
                </div>
              </div>

              {securityError && (
                <div
                  className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-xs animate-fade-in"
                  role="alert"
                >
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{securityError}</span>
                </div>
              )}

              {securitySuccess && (
                <div
                  className="flex items-start space-x-2.5 p-3 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 rounded-[6px] text-xs animate-fade-in"
                  role="status"
                >
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={securityForm.newPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Minimum 6 characters"
                    className="w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.confirmPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repeat new password"
                    className="w-full bg-white/[0.03] border border-[var(--border-color)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={securitySubmitting}
                    className="w-full bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-white py-2.5 rounded-[6px] font-bold text-sm transition-all duration-200 shadow-lg shadow-gym-orange/15 hover:shadow-gym-orange/25 flex items-center justify-center space-x-2 cursor-pointer h-11"
                  >
                    {securitySubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-(--border-color) py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            © 2026 APEX FITNESS. All Rights Reserved.
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Powered by APEX Gym Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
