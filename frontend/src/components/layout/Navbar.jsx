import React from 'react';
import { Dumbbell, Users, LayoutDashboard, UserPlus, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { activeTab, setActiveTab, openAddModal } = useApp();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of the admin console?')) {
      try {
        await logout();
        setActiveTab('dashboard'); // reset to dashboard
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  return (
    <>
      <nav className="glass-panel gradient-border-bottom sticky top-0 z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative bg-gradient-to-br from-gym-orange to-orange-400 p-2.5 rounded-xl text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_-4px_rgba(249,115,22,0.5)]">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-slate-800 dark:text-white">
              APEX<span className="gradient-text">FITNESS</span>
            </span>
          </div>

          {/* Navigation Tabs (Desktop only) */}
          <div className="hidden md:flex items-center bg-gym-dark/40 border border-gym-border rounded-xl p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-250 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/20'
                  : 'text-gym-text-secondary hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('members')}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-250 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/20'
                  : 'text-gym-text-secondary hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Members</span>
            </button>
          </div>

          {/* Quick Actions (Desktop only) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gym-border text-gym-text-secondary hover:text-white hover:bg-gym-elevated hover:border-gym-border-hover transition-all duration-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>

            {/* New Member */}
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-gym-orange to-orange-500 hover:from-gym-orange-hover hover:to-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-250 shadow-lg shadow-gym-orange/20 hover:shadow-gym-orange/30 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Member</span>
            </button>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gym-border text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Ergonomic Phone UI) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gym-dark/85 backdrop-blur-xl border-t border-gym-border px-4 py-2 pb-safe flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-gym-orange font-bold'
              : 'text-gym-text-secondary hover:text-white'
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 tracking-wide">Console</span>
        </button>

        {/* Directory Tab */}
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'members'
              ? 'text-gym-orange font-bold'
              : 'text-gym-text-secondary hover:text-white'
          }`}
        >
          <Users className={`h-5 w-5 ${activeTab === 'members' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 tracking-wide">Members</span>
        </button>

        {/* Central Add FAB */}
        <div className="flex-1 flex justify-center -translate-y-4">
          <button
            onClick={openAddModal}
            aria-label="Add New Member"
            className="flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-br from-gym-orange to-orange-500 text-white shadow-lg shadow-gym-orange/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-orange-400/20"
          >
            <UserPlus className="h-6 w-6" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex flex-col items-center justify-center flex-1 py-1 text-gym-text-secondary hover:text-white transition-all duration-200 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-500" />
          )}
          <span className="text-[10px] mt-1 tracking-wide">Theme</span>
        </button>

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          aria-label="Log Out"
          className="flex flex-col items-center justify-center flex-1 py-1 text-gym-text-secondary hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-wide">Logout</span>
        </button>

      </div>
    </>
  );
}
