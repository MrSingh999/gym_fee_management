import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [memberToRenew, setMemberToRenew] = useState(null);
  const [memberToViewHistory, setMemberToViewHistory] = useState(null);
  
  // Refresh trigger to reload data in child components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const openAddModal = () => {
    setMemberToEdit(null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openEditModal = (member) => {
    setMemberToEdit(member);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setMemberToEdit(null);
  };

  const openRenewModal = (member) => {
    setMemberToRenew(member);
    setIsRenewModalOpen(true);
  };

  const closeRenewModal = () => {
    setIsRenewModalOpen(false);
    setMemberToRenew(null);
  };

  const openHistoryModal = (member) => {
    setMemberToViewHistory(member);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setMemberToViewHistory(null);
  };

  return (
    <AppContext.Provider value={{
      isAddModalOpen,
      isEditModalOpen,
      isRenewModalOpen,
      memberToEdit,
      memberToRenew,
      refreshTrigger,
      triggerRefresh,
      openAddModal,
      closeAddModal,
      openEditModal,
      closeEditModal,
      openRenewModal,
      closeRenewModal,
      isHistoryModalOpen,
      memberToViewHistory,
      openHistoryModal,
      closeHistoryModal
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
