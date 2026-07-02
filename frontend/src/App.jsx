import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Dashboard from '@/features/dashboard/components/Dashboard';
import MemberList from '@/features/members/components/MemberList';
import AddMemberModal from '@/features/members/components/AddMemberModal';
import EditMemberModal from '@/features/members/components/EditMemberModal';
import RenewMemberModal from '@/features/members/components/RenewMemberModal';
import Login from '@/features/auth/components/Login';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Dumbbell } from 'lucide-react';

export default function App() {
  const { user, checkingAuth } = useAuth();
  const {
    activeTab,
    isAddModalOpen,
    isEditModalOpen,
    isRenewModalOpen,
    memberToEdit,
    memberToRenew,
    triggerRefresh,
    closeAddModal,
    closeEditModal,
    closeRenewModal
  } = useApp();

  // 1. Loading state on boot session restore
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gym-dark space-y-5">
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-br from-gym-orange via-orange-400 to-amber-500 rounded-2xl opacity-40 blur-md animate-pulse-glow"></div>
          <div className="relative bg-gradient-to-br from-gym-orange to-orange-500 p-4 rounded-2xl text-white shadow-lg">
            <Dumbbell className="h-8 w-8" />
          </div>
        </div>
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gym-border border-t-gym-orange"></div>
        </div>
        <p className="text-gym-text-muted font-semibold text-xs tracking-[0.15em] uppercase">Verifying Session</p>
      </div>
    );
  }

  // 2. Unauthenticated state -> render Login component
  if (!user) {
    return <Login />;
  }

  // 3. Authenticated state -> render main gym management dashboard
  return (
    <div className="min-h-screen flex flex-col bg-gym-dark text-slate-800 dark:text-gray-100">
      
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        {activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <MemberList />
        )}
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

    </div>
  );
}
