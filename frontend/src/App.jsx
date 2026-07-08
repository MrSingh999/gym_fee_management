import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Dashboard from '@/pages/Dashboard';
import MemberList from '@/pages/MemberList';
import AddMemberModal from '@/components/admin/AddMemberModal';
import EditMemberModal from '@/components/admin/EditMemberModal';
import RenewMemberModal from '@/components/admin/RenewMemberModal';
import PaymentHistoryModal from '@/components/admin/PaymentHistoryModal';
import Login from '@/pages/Login';
import MemberPortal from '@/pages/MemberPortal';
import Overview from '@/pages/member/Overview';
import Workouts from '@/pages/member/Workouts';
import Billing from '@/pages/member/Billing';
import Security from '@/pages/member/Security';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';

const BootLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black space-y-6 transition-colors duration-300">
      <div className="relative h-24 w-24">
        {/* Faded base logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Logo className="h-full w-full text-black dark:text-white" />
        </motion.div>
        
        {/* Filled logo that reveals */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ 
            scale: [0.8, 1, 1, 1.05, 1], // Entrance, static filling phase, then pulse
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)'
          }}
          transition={{ 
            scale: {
              times: [0, 0.2, 0.6, 0.8, 1],
              duration: 4,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 0.5
            },
            opacity: { duration: 0.8, ease: "easeOut" },
            clipPath: { duration: 2, ease: "easeInOut", delay: 0.5 }
          }}
          className="absolute inset-0"
        >
          <Logo className="h-full w-full text-black dark:text-white" />
        </motion.div>
      </div>
      
      <motion.p 
        initial={{ opacity: 0, y: 10, letterSpacing: "0.1em" }}
        animate={{ 
          opacity: [0, 1, 0.5, 1],
          y: 0, 
          letterSpacing: "0.2em" 
        }}
        transition={{ 
          opacity: {
            times: [0, 0.25, 0.6, 1],
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 0.5
          },
          y: { duration: 1, ease: "easeOut", delay: 0.2 },
          letterSpacing: { duration: 1, ease: "easeOut", delay: 0.2 }
        }}
        className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase"
      >
        Loading System
      </motion.p>
    </div>
  );
};

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gym-dark text-slate-800 dark:text-gray-100">
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 pb-28 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Add Modal */}
      <AddMemberModal />

      {/* Edit Modal */}
      <EditMemberModal />

      {/* Renew Modal */}
      <RenewMemberModal />

      {/* Payment History Modal */}
      <PaymentHistoryModal />
    </div>
  );
}

export default function App() {
  const { user, checkingAuth } = useAuth();
  const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(() => {
    try {
      return !!sessionStorage.getItem('firstLoadDone');
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('firstLoadDone')) {
        const timer = setTimeout(() => {
          setMinLoadTimeElapsed(true);
          try {
            sessionStorage.setItem('firstLoadDone', 'true');
          } catch (e) {}
        }, 2000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      setMinLoadTimeElapsed(true);
    }
  }, []);

  // 1. Loading state on boot session restore, or minimum 2s loader on first website entry
  if (checkingAuth || (!minLoadTimeElapsed && !(() => {
    try {
      return sessionStorage.getItem('firstLoadDone');
    } catch (e) {
      return false;
    }
  })())) {
    return <BootLoader />;
  }

  return (
    <Routes>
      {/* Unauthenticated route */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/" replace />} 
      />
      
      {/* Member portal route with nested tabs */}
      <Route 
        path="/member-portal" 
        element={user && user.role === 'member' ? <MemberPortal /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="billing" element={<Billing />} />
        <Route path="security" element={<Security />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>

      {/* Root redirect depending on role */}
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'member' ? (
              <Navigate to="/member-portal" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Admin Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          user && user.role === 'admin' ? (
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Admin Members Directory */}
      <Route 
        path="/members" 
        element={
          user && user.role === 'admin' ? (
            <AdminLayout>
              <MemberList />
            </AdminLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
