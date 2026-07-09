import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, UserPlus, LogOut, Sun, Moon, Dumbbell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/ui/Logo';
import { motion } from 'framer-motion';
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

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { openAddModal } = useApp();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItemClass = (isActive) => 
    `relative flex items-center space-x-2 px-4 py-1.5 rounded-[4px] font-medium text-sm transition-colors duration-250 cursor-pointer z-10 ${
      isActive 
        ? 'text-(--text-primary) font-semibold' 
        : 'text-(--text-secondary) hover:text-(--text-primary)'
    }`;

  const renderActiveBg = () => (
    <motion.div
      layoutId="navbar-active-bg"
      className="absolute inset-0 bg-(--bg-card) rounded-[4px] -z-10 border border-(--border-color-hover) shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-none"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />
  );

  return (
    <>
      <nav className="glass-panel gradient-border-bottom sticky top-0 z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link 
            to="/dashboard"
            className="flex items-center space-x-3 cursor-pointer group decoration-none" 
          >
            <Logo className="h-9 w-9 text-(--text-primary)" />
            <span className="font-bold text-lg tracking-tight text-(--text-primary)">
              HEAVEN'S<span className="text-(--text-secondary) font-normal ml-0.5">ARENA</span>
            </span>
          </Link>

          {/* Mobile Theme Toggle (Visible only on mobile) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-[8px] border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) hover:border-(--border-color-hover) transition-colors duration-200 cursor-pointer active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-zinc-400" />
              ) : (
                <Moon className="h-4 w-4 text-zinc-600" />
              )}
            </button>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <div className="hidden md:flex items-center bg-(--bg-elevated) border border-(--border-color) rounded-[6px] p-0.5 relative">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => navItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && renderActiveBg()}
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>
            
            <NavLink
              to="/members"
              className={({ isActive }) => navItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && renderActiveBg()}
                  <Users className="h-3.5 w-3.5" />
                  <span>Members</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/workouts"
              className={({ isActive }) => navItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && renderActiveBg()}
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>Workouts</span>
                </>
              )}
            </NavLink>
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) hover:border-(--border-color-hover) transition-all duration-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-zinc-600" />
              )}
            </button>

            {/* New Member */}
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 px-4 py-1.5 rounded-[6px] font-semibold text-sm transition-all duration-200 cursor-pointer border border-(--border-color-hover)"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Member</span>
            </button>
            
            {/* Logout */}
            <button
              onClick={() => setShowLogoutAlert(true)}
              title="Log Out"
              className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-(--border-color) text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-(--bg-canvas)/90 backdrop-blur-xl border-t border-(--border-color) px-2 pt-1.5 pb-safe flex items-center justify-between">
        
        {/* Dashboard Tab */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] transition-colors duration-200 cursor-pointer active:scale-95 ${
            isActive
              ? 'text-(--text-primary) font-bold'
              : 'text-(--text-secondary)'
          }`}
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`h-5 w-5 ${isActive ? 'scale-105' : ''}`} />
              <span className="text-[10px] mt-1 tracking-wide">Console</span>
            </>
          )}
        </NavLink>

        {/* Directory Tab */}
        <NavLink
          to="/members"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] transition-colors duration-200 cursor-pointer active:scale-95 ${
            isActive
              ? 'text-(--text-primary) font-bold'
              : 'text-(--text-secondary)'
          }`}
        >
          {({ isActive }) => (
            <>
              <Users className={`h-5 w-5 ${isActive ? 'scale-105' : ''}`} />
              <span className="text-[10px] mt-1 tracking-wide">Members</span>
            </>
          )}
        </NavLink>

        {/* Central Add FAB */}
        <div className="flex-1 flex justify-center -translate-y-4">
          <button
            onClick={openAddModal}
            aria-label="Add New Member"
            className="flex items-center justify-center w-13 h-13 rounded-full bg-(--text-primary) text-(--bg-canvas) shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer border border-(--border-color-hover)"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>

        {/* Workouts Tab */}
        <NavLink
          to="/workouts"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] transition-colors duration-200 cursor-pointer active:scale-95 ${
            isActive
              ? 'text-(--text-primary) font-bold'
              : 'text-(--text-secondary)'
          }`}
        >
          {({ isActive }) => (
            <>
              <Dumbbell className={`h-5 w-5 ${isActive ? 'scale-105' : ''}`} />
              <span className="text-[10px] mt-1 tracking-wide">Workouts</span>
            </>
          )}
        </NavLink>

        {/* Logout Action */}
        <button
          onClick={() => setShowLogoutAlert(true)}
          aria-label="Log Out"
          className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] text-(--text-secondary) hover:text-red-500 transition-colors duration-200 cursor-pointer active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-wide">Logout</span>
        </button>

      </div>

      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Admin Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of the admin console?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmLogout}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
}
