import React, { useState, useEffect } from "react";
import { User, Activity, Clock, Dumbbell, Calendar, FileText, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatDate, calculateAge, calcMembership } from "@/lib/memberHelpers";
import ProgressRing from "@/components/member/ProgressRing";
import ProfileDetailCard from "@/components/member/ProfileDetailCard";
import ExpiryAlert from "@/components/member/ExpiryAlert";
import ImageViewer from "@/components/ImageViewer";
import { motion } from "framer-motion";
import { workoutService } from "@/services/workoutService";

export default function Overview() {
  const { user } = useAuth();
  const { remainingDays, percentRemaining, isDisabled } = calcMembership(user);
  const [viewImage, setViewImage] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  useEffect(() => {
    fetchMyWorkouts();
  }, []);

  const fetchMyWorkouts = async () => {
    try {
      const data = await workoutService.getMyWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.error("Error fetching workouts on overview:", err);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const profileItems = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Activity, label: "Mobile Number", value: user.mobile || user.phone },
    { icon: Clock, label: "Email Address", value: user.email || "No email registered" },
    { icon: Dumbbell, label: "Membership Plan", value: `${user.plan?.name || "Workout"} Plan`, capitalize: true },
    { icon: Calendar, label: "Age / Gender", value: `${calculateAge(user.dob)} Years / ${user.gender || "N/A"}` },
    { icon: FileText, label: "Member Since", value: formatDate(user.joiningDate) },
  ];

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
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {/* Progress Ring Card */}
      {/* Left Column: Validity & Training Plan */}
      <div className="lg:col-span-1 space-y-4 sm:space-y-6">
        {/* Progress Ring Card */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel p-4 sm:p-6 rounded-[16px] flex flex-col items-center justify-center text-center space-y-5 border border-(--border-color-hover) w-full"
        >
          <h3 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono">Membership Validity</h3>
          <ProgressRing remainingDays={remainingDays} percentRemaining={percentRemaining} />
          <div className="space-y-1.5 w-full">
            <div className="flex justify-between text-xs text-(--text-secondary) font-mono">
              <span>Active Period</span>
              <span className="font-semibold text-(--text-primary)">{percentRemaining}% Remaining</span>
            </div>
            <div className="w-full bg-(--bg-elevated) border border-(--border-color) p-3.5 rounded-[8px] space-y-2 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-(--text-muted)">Start:</span>
                <span className="font-semibold text-(--text-primary)">{formatDate(user.feeStartDate)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-(--text-muted)">Expiry:</span>
                <span className="font-semibold text-(--text-primary)">{formatDate(user.feeEndDate)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Unified Plan & Routine Card */}
        <motion.div
          variants={itemVariants}
          className="glass-panel p-4 sm:p-5 rounded-[16px] border border-(--border-color-hover) space-y-4 text-left w-full"
        >
          {/* Header */}
          <div className="flex items-center space-x-2 border-b border-(--border-color)/40 pb-3">
            <div className="p-1.5 bg-gym-orange/10 text-gym-orange rounded-[6px]">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-(--text-muted) font-mono">My Plan & Routine</h3>
          </div>

          {/* Membership Plan Details Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-(--text-primary) capitalize font-mono leading-none">
                {user.membershipType || "Gym Plan"}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[4px] font-mono leading-none shrink-0">
                ₹{user.feeAmount || "700"} / 30 Days
              </span>
            </div>
            <p className="text-[11px] text-(--text-secondary) leading-relaxed">
              {(() => {
                const plan = (user.membershipType || "").toLowerCase();
                if (plan.includes("strength training")) {
                  return "Full access to our premium strength equipment, free weights section, and customized training splits.";
                }
                if (plan.includes("strength and cardio") || plan.includes("strength & cardio")) {
                  return "Access to all strength equipment plus the cardio zone, treadmills, ellipticals, and customized routines.";
                }
                if (plan.includes("personal training")) {
                  return "One-on-one personal coaching, custom training splits, diet planning, and goal tracking sessions.";
                }
                return "Full access to gym facilities and trainer-designed workout splits.";
              })()}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-(--border-color)/40 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono">Workout Split</h4>
              {workouts.length > 0 && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                  workouts[0].assignmentType === 'ALL'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                }`}>
                  {workouts[0].assignmentType === 'ALL' ? 'General' : 'Custom'}
                </span>
              )}
            </div>

            {loadingWorkouts ? (
              <div className="flex items-center justify-center py-2 space-x-2">
                <RefreshCw className="h-3.5 w-3.5 text-zinc-500 animate-spin" />
                <span className="text-[11px] text-(--text-muted) font-mono uppercase">Syncing routine...</span>
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center p-3 bg-gym-dark/25 rounded-[6px] border border-(--border-color)/50">
                <p className="text-[11px] text-(--text-muted) italic">No workout split assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h5 className="font-bold text-xs text-(--text-primary) font-mono truncate">
                    {workouts[0].title}
                  </h5>
                  <p className="text-[11px] text-(--text-muted) mt-1 line-clamp-1">
                    {workouts[0].description || "Personalized workout program."}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-(--border-color)/20 text-[10px] text-(--text-muted) font-mono">
                  <span>{workouts[0].dayCount || 0} Routine Days</span>
                  <Link
                    to="/member-portal/workouts"
                    className="text-gym-orange hover:underline flex items-center space-x-0.5 font-bold cursor-pointer active:scale-95 transition-transform"
                  >
                    <span>Start Routine</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Profile Details */}
      <motion.div 
        variants={itemVariants}
        className="glass-panel p-4 sm:p-6 rounded-[16px] space-y-4 sm:space-y-6 lg:col-span-2 border border-(--border-color-hover)"
      >
        <div className="border-b border-(--border-color) pb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-(--text-primary) font-mono">Profile Overview</h3>
            <p className="text-xs text-(--text-secondary)">Your registered personal and member details.</p>
          </div>
          {/* Profile Picture (Non-editable) */}
          <div className="h-12 w-12 rounded-full overflow-hidden border border-(--border-color-hover) bg-zinc-950 shrink-0 shadow-sm">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewImage(user.profilePicture)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-500">
                <User className="h-6 w-6" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {profileItems.map((item) => (
            <ProfileDetailCard key={item.label} {...item} />
          ))}
        </div>

        <ExpiryAlert isDisabled={isDisabled} remainingDays={remainingDays} />
      </motion.div>

      <ImageViewer
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        src={viewImage}
        alt="Profile picture"
      />
    </motion.div>
  );
}
