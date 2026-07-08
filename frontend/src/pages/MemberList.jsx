import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Edit, Trash2, Calendar, Phone, RefreshCw, CheckCircle, Clock, AlertTriangle, User, History } from 'lucide-react';
import { memberService } from '@/services/memberService';
import { useApp } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import ImageViewer from '@/components/ImageViewer';
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

export default function MemberList() {
  const { openEditModal, openRenewModal, openHistoryModal, refreshTrigger } = useApp();
  const [viewImage, setViewImage] = useState(null);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortOption, setSortOption] = useState('joining-desc');

  // Debounce search: only update debouncedSearch 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch, statusFilter, planFilter, refreshTrigger]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getMembers({
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
        membershipType: planFilter === 'all' ? '' : planFilter,
      });
      setMembers(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve members list from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    setDeleteMemberTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteMemberTarget) return;
    const { id } = deleteMemberTarget;
    try {
      await memberService.deleteMember(id);
      fetchMembers(); // refresh
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to delete member. Please try again.');
    } finally {
      setDeleteMemberTarget(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: {
        label: 'Active',
        dotClass: 'status-dot-active',
        badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/15',
      },
      due: {
        label: 'Due Soon',
        dotClass: 'status-dot-due',
        badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 dark:border-amber-500/15',
      },
      overdue: {
        label: 'Overdue',
        dotClass: 'status-dot-overdue',
        badgeClass: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 dark:border-red-500/15',
      },
      inactive: {
        label: 'Inactive',
        dotClass: '',
        badgeClass: 'text-(--text-muted) bg-white/[0.03] border-(--border-color)',
      },
    };

    const config = configs[status] || configs.inactive;

    return (
      <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit ${config.badgeClass}`}>
        {config.dotClass ? (
          <span className={`status-dot ${config.dotClass}`}></span>
        ) : (
          <User className="h-3 w-3 shrink-0" />
        )}
        <span>{config.label}</span>
      </span>
    );
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortOption === 'joining-desc') {
      return new Date(b.joiningDate || b.createdAt) - new Date(a.joiningDate || a.createdAt);
    } else if (sortOption === 'joining-asc') {
      return new Date(a.joiningDate || a.createdAt) - new Date(b.joiningDate || b.createdAt);
    } else if (sortOption === 'expiry-desc') {
      return new Date(b.feeEndDate) - new Date(a.feeEndDate);
    } else if (sortOption === 'expiry-asc') {
      return new Date(a.feeEndDate) - new Date(b.feeEndDate);
    }
    return 0;
  });

  const selectTriggerClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] pl-10 pr-4 py-2.5 h-auto text-sm text-(--text-primary) cursor-pointer hover:border-(--border-color-hover) focus:border-zinc-400 transition-all duration-200 font-mono";

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="animate-fade-in">
        <h1 className="font-bold text-2xl text-(--text-primary) tracking-tight">
          Members <span className="text-(--text-secondary) font-normal ml-0.5">Directory</span>
        </h1>
        <p className="text-(--text-secondary) mt-1 text-xs font-mono">Registry list of active and inactive gym members.</p>
      </div>

      {/* Search & Filter Header Panel */}
      <div className="glass-panel p-4 md:p-5 rounded-[16px] animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-(--text-muted) uppercase tracking-wider pl-0.5 font-mono">Search Member</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-(--text-muted)" />
              <input
                type="text"
                placeholder="Name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] pl-10 pr-4 py-2.5 text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-zinc-400 transition-all duration-200 font-mono"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-(--text-muted) uppercase tracking-wider pl-0.5 font-mono">Status</label>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3.5 top-2.5 h-4 w-4 text-(--text-muted) z-10 pointer-events-none" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="due">Due Soon</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plan Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-(--text-muted) uppercase tracking-wider pl-0.5 font-mono">Membership Plan</label>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3.5 top-2.5 h-4 w-4 text-(--text-muted) z-10 pointer-events-none" />
              <Select
                value={planFilter}
                onValueChange={setPlanFilter}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="strength training">Strength Training</SelectItem>
                  <SelectItem value="strength and cardio">Strength & Cardio</SelectItem>
                  <SelectItem value="personal training">Personal Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort Date Timeline */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-(--text-muted) uppercase tracking-wider pl-0.5 font-mono">Sort Timeline</label>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3.5 top-2.5 h-4 w-4 text-(--text-muted) z-10 pointer-events-none" />
              <Select
                value={sortOption}
                onValueChange={setSortOption}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Sort Timeline" />
                </SelectTrigger>
                <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                  <SelectItem value="joining-desc">Joining: Newest First</SelectItem>
                  <SelectItem value="joining-asc">Joining: Oldest First</SelectItem>
                  <SelectItem value="expiry-desc">Expiry: Latest First</SelectItem>
                  <SelectItem value="expiry-asc">Expiry: Earliest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </div>

      {/* Directory Table Panel */}
      <div className="glass-panel rounded-[16px] overflow-hidden animate-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-(--border-color) border-t-(--text-primary)"></div>
            <p className="text-(--text-muted) text-sm font-mono uppercase tracking-wider text-xs">Loading directory...</p>
          </div>
        ) : error ? (
          <div className="text-center py-14">
            <div className="w-12 h-12 bg-red-500/10 rounded-[16px] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={fetchMembers}
              className="inline-flex items-center space-x-2 bg-white/[0.03] border border-(--border-color) hover:bg-(--bg-elevated) text-(--text-primary) px-4 py-2 rounded-[6px] text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-(--text-secondary) text-sm font-semibold">No records match your query.</p>
            <p className="text-xs text-(--text-muted) mt-1 font-mono">Try adjusting search or filter criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-(--bg-elevated)/50 border-b border-(--border-color) text-(--text-muted) text-[10px] uppercase tracking-wider font-bold font-mono">
                    <th className="py-3.5 px-5">Member</th>
                    <th className="py-3.5 px-5">Gender / DOB</th>
                    <th className="py-3.5 px-5">Plan</th>
                    <th className="py-3.5 px-5">Timeline</th>
                    <th className="py-3.5 px-5">Fee</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-color)/30 text-sm">
                  <AnimatePresence>
                    {sortedMembers.map((member, idx) => (
                      <motion.tr 
                        key={member._id || idx} 
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.01 }}
                        className="table-row-hover table-zebra"
                      >
                        
                        {/* Member Info */}
                        <td className="py-3 px-5">
                          <div className="flex items-center space-x-3">
                            {member.profilePicture ? (
                              <img src={member.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border border-(--border-color) shrink-0 cursor-pointer" onClick={() => setViewImage(member.profilePicture)} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gym-orange/20 to-orange-500/20 border border-(--border-color) text-gym-orange flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                                {member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-(--text-primary) text-[13px] truncate">{member.name}</div>
                              <div className="flex items-center text-xs text-(--text-muted) space-x-1.5 mt-0.5 font-mono">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">{member.phone || member.mobile}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Gender / DOB */}
                        <td className="py-3 px-5">
                          <div className="text-(--text-secondary) capitalize text-[13px]">{member.gender || '—'}</div>
                          <div className="text-xs text-(--text-muted) mt-0.5 font-mono">
                            {member.dob ? formatDate(member.dob) : '—'}
                          </div>
                        </td>

                        {/* Subscription Plan */}
                        <td className="py-3 px-5">
                          <span className="text-(--text-secondary) font-medium capitalize text-[13px] font-mono">{member.membershipType || (member.plan && typeof member.plan === 'object' ? member.plan.name : '')}</span>
                        </td>

                        {/* Timeline Details */}
                        <td className="py-3 px-5">
                          <div className="flex items-center text-xs text-(--text-secondary) space-x-1 font-mono">
                            <Calendar className="h-3 w-3 text-(--text-muted) shrink-0" />
                            <span className="tabular-nums">
                              {formatDate(member.startDate || member.feeStartDate)} → {formatDate(member.endDate || member.feeEndDate)}
                            </span>
                          </div>
                        </td>

                        {/* Fee Dues */}
                        <td className="py-3 px-5 font-bold text-(--text-primary) tabular-nums font-mono">
                          ₹{member.feeAmount.toLocaleString()}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-5">
                          <div className="flex justify-center">
                            {getStatusBadge(member.status)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openRenewModal(member)}
                              className="bg-(--text-primary) hover:opacity-90 text-(--bg-canvas) px-3 py-1.5 rounded-[4px] text-[10px] font-bold transition-all duration-200 cursor-pointer border border-(--border-color-hover)"
                            >
                              Renew
                            </button>
                            <button
                              onClick={() => openHistoryModal(member)}
                              title="Payment History"
                              className="p-1.5 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) hover:border-(--border-color-hover) transition-all duration-200 cursor-pointer"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(member)}
                              title="Edit Details"
                              className="p-1.5 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) hover:border-(--border-color-hover) transition-all duration-200 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(member._id, member.name)}
                              title="Delete Member"
                              className="p-1.5 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-(--border-color)/30">
              <AnimatePresence>
                {sortedMembers.map((member, idx) => (
                  <motion.div 
                    key={member._id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="p-4 space-y-3"
                  >
                    {/* Header row: name & status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {member.profilePicture ? (
                          <img src={member.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover border border-(--border-color) shrink-0 cursor-pointer" onClick={() => setViewImage(member.profilePicture)} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gym-orange/20 to-orange-500/20 border border-(--border-color) text-gym-orange flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                            {member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-(--text-primary) leading-snug truncate">{member.name}</h3>
                          <div className="flex items-center text-xs text-(--text-muted) mt-1 space-x-2">
                            <span className="capitalize">{member.gender || '—'}</span>
                            <span>•</span>
                            <span className="font-mono">{member.dob ? formatDate(member.dob) : 'DOB —'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(member.status)}
                      </div>
                    </div>

                    {/* Details block */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/[0.01] border border-(--border-color)/40 rounded-[8px] p-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Plan Type</p>
                        <p className="font-semibold text-(--text-primary) capitalize font-mono">{member.membershipType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Fee Amount</p>
                        <p className="font-bold text-(--text-primary) font-mono">₹{member.feeAmount.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1 col-span-2 pt-2 border-t border-(--border-color)/20">
                        <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Timeline</p>
                        <p className="text-(--text-secondary) font-medium tabular-nums font-mono">
                          {formatDate(member.startDate || member.feeStartDate)} → {formatDate(member.endDate || member.feeEndDate)}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Contact */}
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`tel:${member.phone || member.mobile}`}
                        className="flex items-center space-x-1.5 text-xs text-(--text-primary) hover:opacity-80 font-bold transition-all duration-200 h-9 px-1 rounded-[6px] font-mono"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{member.phone || member.mobile}</span>
                      </a>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openRenewModal(member)}
                          className="bg-(--text-primary) text-(--bg-canvas) px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all duration-200 cursor-pointer h-9"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => openHistoryModal(member)}
                          aria-label="Payment History"
                          className="p-2 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-all duration-200 cursor-pointer h-9 w-9 flex items-center justify-center"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          aria-label="Edit Member"
                          className="p-2 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-all duration-200 cursor-pointer h-9 w-9 flex items-center justify-center"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id, member.name)}
                          aria-label="Delete Member"
                          className="p-2 border border-(--border-color) rounded-[4px] text-(--text-secondary) hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer h-9 w-9 flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <ImageViewer
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        src={viewImage}
        alt="Member profile photo"
      />

      <AlertDialog open={!!deleteMemberTarget} onOpenChange={(open) => !open && setDeleteMemberTarget(null)}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete member: <strong className="text-(--text-primary)">"{deleteMemberTarget?.name}"</strong>? This action cannot be undone and will remove all their records from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>

      <AlertDialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-500">Operation Failed</AlertDialogTitle>
              <AlertDialogDescription>
                {errorMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorMessage(null)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  );
}
