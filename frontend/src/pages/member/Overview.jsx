import React, { useState } from "react";
import { User, Activity, Clock, Dumbbell, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDate, calculateAge, calcMembership } from "@/lib/memberHelpers";
import ProgressRing from "@/components/member/ProgressRing";
import ProfileDetailCard from "@/components/member/ProfileDetailCard";
import ExpiryAlert from "@/components/member/ExpiryAlert";
import ImageViewer from "@/components/ImageViewer";

export default function Overview() {
  const { user } = useAuth();
  const { remainingDays, percentRemaining, isDisabled } = calcMembership(user);
  const [viewImage, setViewImage] = useState(null);

  const profileItems = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Activity, label: "Mobile Number", value: user.mobile || user.phone },
    { icon: Clock, label: "Email Address", value: user.email || "No email registered" },
    { icon: Dumbbell, label: "Membership Plan", value: `${user.plan?.name || "Workout"} Plan`, capitalize: true },
    { icon: Calendar, label: "Age / Gender", value: `${calculateAge(user.dob)} Years / ${user.gender || "N/A"}` },
    { icon: FileText, label: "Member Since", value: formatDate(user.joiningDate) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
      {/* Progress Ring Card */}
      <div className="glass-panel p-4 sm:p-6 rounded-[16px] flex flex-col items-center justify-center text-center space-y-5 border border-(--border-color-hover) lg:col-span-1">
        <h3 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Membership Validity</h3>
        <ProgressRing remainingDays={remainingDays} percentRemaining={percentRemaining} />
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between text-xs text-(--text-secondary) font-mono">
            <span>Active Period</span>
            <span className="font-semibold text-(--text-primary)">{percentRemaining}% Remaining</span>
          </div>
          <div className="w-full bg-gym-dark/50 border border-(--border-color) p-3.5 rounded-[6px] space-y-2 font-mono">
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
      </div>

      {/* Profile Details */}
      <div className="glass-panel p-4 sm:p-6 rounded-[16px] space-y-4 sm:space-y-6 lg:col-span-2 border border-(--border-color-hover)">
        <div className="border-b border-(--border-color) pb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-(--text-primary)">Profile Overview</h3>
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
      </div>

      <ImageViewer
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        src={viewImage}
        alt="Profile picture"
      />
    </div>
  );
}
