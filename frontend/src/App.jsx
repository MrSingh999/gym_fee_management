import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/ui/Logo';

function AdminLayout({ children }) {
  const {
    isAddModalOpen,
    isEditModalOpen,
    isRenewModalOpen,
    isHistoryModalOpen,
    memberToEdit,
    memberToRenew,
    memberToViewHistory,
    triggerRefresh,
    closeAddModal,
    closeEditModal,
    closeRenewModal,
    closeHistoryModal
  } = useApp();

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
      <AddMemberModal 
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSuccess={triggerRefresh}
      />

      {/* Edit Modal */}
      <EditMemberModal 
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        member={memberToEdit}
        onSuccess={triggerRefresh}
      />

      {/* Renew Modal */}
      <RenewMemberModal 
        isOpen={isRenewModalOpen}
        onClose={closeRenewModal}
        member={memberToRenew}
        onSuccess={triggerRefresh}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={closeHistoryModal}
        member={memberToViewHistory}
      />
    </div>
  );
}

export default function App() {
  const { user, checkingAuth } = useAuth();

  // 1. Loading state on boot session restore
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gym-dark space-y-5">
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-br from-gym-orange via-orange-400 to-amber-500 rounded-2xl opacity-40 blur-md animate-pulse-glow"></div>
          <div className="relative bg-gradient-to-br from-gym-orange to-orange-500 p-4 rounded-2xl text-white shadow-lg">
            <Logo className="h-8 w-8" />
          </div>
        </div>
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gym-border border-t-gym-orange"></div>
        </div>
        <p className="text-gym-text-muted font-semibold text-xs tracking-[0.15em] uppercase">Verifying Session</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Unauthenticated route */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/" replace />} 
      />
      
      {/* Member portal route */}
      <Route 
        path="/member-portal" 
        element={user && user.role === 'member' ? <MemberPortal /> : <Navigate to="/login" replace />} 
      />

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
