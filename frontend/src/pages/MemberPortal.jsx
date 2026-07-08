import React, { useState } from 'react';
import { Dumbbell, CreditCard, User, Lock, LogOut, Sun, Moon } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Logo from "@/components/ui/Logo";
import StatusBadge from "@/components/member/StatusBadge";
import { calcMembership } from "@/lib/memberHelpers";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import ImageViewer from '@/components/ImageViewer';

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "workouts", label: "Workouts", icon: Dumbbell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Lock },
];

export default function MemberPortal() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { remainingDays, isOverdue, isInactive } = calcMembership(user);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [viewImage, setViewImage] = useState(null);

  const confirmLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gym-dark text-slate-800 dark:text-gray-100">
      {/* Navbar */}
      <nav className="glass-panel gradient-border-bottom sticky top-0 z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo className="h-9 w-9 text-(--text-primary)" />
            <span className="font-bold text-lg tracking-tight text-(--text-primary)">
              HEAVEN'S<span className="text-(--text-secondary) font-normal ml-0.5">ARENA</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              className="flex items-center justify-center w-9 h-9 rounded-[6px] border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-all duration-200 cursor-pointer">
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <button onClick={() => setShowLogoutAlert(true)}
              className="flex items-center space-x-1.5 border border-(--border-color) hover:border-red-500/30 text-(--text-secondary) hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 md:px-3 rounded-[6px] text-xs font-bold transition-all duration-200 cursor-pointer">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 pb-28 md:pb-8 space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border border-(--border-color-hover) bg-zinc-950 shrink-0 shadow-md">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewImage(user.profilePicture)}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  <User className="h-7 w-7" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-(--text-primary) tracking-tight">
                Hey, <span className="gradient-text">{user.name}</span>!
              </h1>
              <p className="text-(--text-secondary) mt-1.5 text-xs sm:text-sm">Welcome back to your fitness portal. Track your progress below.</p>
            </div>
          </div>
          <StatusBadge isOverdue={isOverdue} isInactive={isInactive} remainingDays={remainingDays} />
        </div>

        {/* Tab Nav — visible on desktop, hidden on mobile */}
        <div className="hidden md:flex space-x-1 bg-gym-dark/50 border border-(--border-color) p-1 rounded-[6px] w-full overflow-x-auto hide-scrollbar animate-fade-in">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink key={tab.id} to={`/member-portal/${tab.id}`}
                className={({ isActive }) =>
                  `relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-[6px] text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer z-10 whitespace-nowrap ${
                    isActive ? "text-black dark:text-white" : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`
                }>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="member-portal-active-tab"
                        className="absolute inset-0 bg-white dark:bg-[#18181b] rounded-[6px] -z-10 border border-(--border-color-hover) shadow-sm dark:shadow-none"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-center leading-none">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[50vh]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Tab Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gym-dark/90 backdrop-blur-md border-t border-(--border-color) px-2 py-2 flex justify-around items-center safe-bottom shadow-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink key={tab.id} to={`/member-portal/${tab.id}`}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-bold transition-all duration-200 cursor-pointer select-none ${
                  isActive ? "text-black dark:text-white" : "text-(--text-muted) hover:text-(--text-secondary)"
                }`
              }>
              <Icon className="h-5 w-5 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-(--border-color) py-4 mt-auto max-md:mb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-[10px] text-(--text-muted) uppercase tracking-wider font-semibold">© 2026 APEX FITNESS. All Rights Reserved.</p>
          <p className="text-[10px] text-(--text-muted)">Powered by APEX Gym Management System</p>
        </div>
      </footer>

      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Member Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of your gym portal account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmLogout}>
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>

      <ImageViewer
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        src={viewImage}
        alt="Profile picture"
      />
    </div>
  );
}
