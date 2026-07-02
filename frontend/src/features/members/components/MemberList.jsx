import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Edit, Trash2, Calendar, Phone, RefreshCw, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { memberService } from '../services/memberService';
import { useApp } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MemberList() {
  const { openEditModal, openRenewModal, refreshTrigger } = useApp();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, statusFilter, planFilter, refreshTrigger]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getMembers({
        search: searchTerm,
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete member: "${name}"? This action cannot be undone.`)) {
      try {
        await memberService.deleteMember(id);
        fetchMembers(); // refresh
      } catch (err) {
        console.error(err);
        alert('Failed to delete member.');
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: {
        icon: CheckCircle,
        label: 'Active',
        dotClass: 'status-dot-active',
        badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
      },
      due: {
        icon: Clock,
        label: 'Due Soon',
        dotClass: 'status-dot-due',
        badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
      },
      overdue: {
        icon: AlertTriangle,
        label: 'Overdue',
        dotClass: 'status-dot-overdue',
        badgeClass: 'text-red-400 bg-red-500/10 border-red-500/15',
      },
      inactive: {
        icon: User,
        label: 'Inactive',
        dotClass: '',
        badgeClass: 'text-gym-text-muted bg-white/[0.03] border-gym-border',
      },
    };

    const config = configs[status] || configs.inactive;

    return (
      <span className={`inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border w-fit ${config.badgeClass}`}>
        {config.dotClass ? (
          <span className={`status-dot ${config.dotClass}`}></span>
        ) : (
          <User className="h-3 w-3 shrink-0" />
        )}
        <span>{config.label}</span>
      </span>
    );
  };

  const selectTriggerClass = "w-full bg-white/[0.04] border border-gym-border rounded-xl pl-10 pr-4 py-3 h-auto text-base text-slate-800 dark:text-white cursor-pointer hover:border-gym-border-hover focus:border-gym-orange transition-all duration-200";

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="animate-fade-in">
        <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white tracking-tight">
          Members <span className="gradient-text">Directory</span>
        </h1>
        <p className="text-gym-text-secondary mt-1.5 text-sm">Manage, search, and update gym member records.</p>
      </div>

      {/* Search & Filter Header Panel */}
      <div className="glass-panel p-4 md:p-5 rounded-2xl animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gym-text-muted" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.04] border border-gym-border rounded-xl pl-10 pr-4 py-3 text-base text-slate-800 dark:text-white placeholder-gym-text-muted focus:outline-none focus:border-gym-orange transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3.5 top-3.5 h-4 w-4 text-gym-text-muted z-10 pointer-events-none" />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue>
                  {statusFilter === 'all' && 'All Statuses'}
                  {statusFilter === 'active' && 'Active'}
                  {statusFilter === 'due' && 'Due Soon'}
                  {statusFilter === 'overdue' && 'Overdue'}
                  {statusFilter === 'inactive' && 'Inactive'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gym-card backdrop-blur-xl border border-gym-border-hover rounded-xl shadow-2xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="due">Due Soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan Filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3.5 top-3.5 h-4 w-4 text-gym-text-muted z-10 pointer-events-none" />
            <Select
              value={planFilter}
              onValueChange={setPlanFilter}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue>
                  {planFilter === 'all' && 'All Plans'}
                  {planFilter === 'workout' && 'Workout'}
                  {planFilter === 'workout + cardio' && 'Workout + Cardio'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gym-card backdrop-blur-xl border border-gym-border-hover rounded-xl shadow-2xl">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
                <SelectItem value="workout + cardio">Workout + Cardio</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Directory Table Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gym-border border-t-gym-orange"></div>
            <p className="text-gym-text-muted text-sm">Loading directory...</p>
          </div>
        ) : error ? (
          <div className="text-center py-14">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={fetchMembers}
              className="inline-flex items-center space-x-2 bg-white/[0.04] border border-gym-border hover:bg-gym-elevated text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gym-text-secondary text-sm font-semibold">No records match your query.</p>
            <p className="text-xs text-gym-text-muted mt-1">Try adjusting search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gym-elevated/50 border-b border-gym-border text-gym-text-muted text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-4 px-5">Member</th>
                  <th className="py-4 px-5">Gender / DOB</th>
                  <th className="py-4 px-5">Plan</th>
                  <th className="py-4 px-5">Timeline</th>
                  <th className="py-4 px-5">Fee</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/30 text-sm">
                {members.map((member, idx) => (
                  <tr 
                    key={member._id} 
                    className="table-row-hover table-zebra"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    
                    {/* Member Info */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800 dark:text-white">{member.name}</div>
                      <div className="flex items-center text-xs text-gym-text-muted space-x-1.5 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    </td>

                    {/* Gender / DOB */}
                    <td className="py-3.5 px-5">
                      <div className="text-gym-text-secondary capitalize text-[13px]">{member.gender || '—'}</div>
                      <div className="text-xs text-gym-text-muted mt-0.5">
                        {member.dob ? formatDate(member.dob) : '—'}
                      </div>
                    </td>

                    {/* Subscription Plan */}
                    <td className="py-3.5 px-5">
                      <span className="text-gym-text-secondary font-medium capitalize text-[13px]">{member.membershipType}</span>
                    </td>

                    {/* Timeline Details */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center text-xs text-gym-text-secondary space-x-1">
                        <Calendar className="h-3 w-3 text-gym-text-muted shrink-0" />
                        <span className="tabular-nums">
                          {formatDate(member.startDate)} → {formatDate(member.endDate)}
                        </span>
                      </div>
                    </td>

                    {/* Fee Dues */}
                    <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-white tabular-nums">
                      ₹{member.feeAmount.toLocaleString()}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5">
                      <div className="flex justify-center">
                        {getStatusBadge(member.status)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openRenewModal(member)}
                          className="bg-gym-orange/10 hover:bg-gym-orange text-gym-orange hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 border border-gym-orange/20 hover:border-gym-orange cursor-pointer"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          title="Edit Details"
                          className="p-2 border border-gym-border rounded-lg text-gym-text-secondary hover:text-white hover:bg-gym-elevated hover:border-gym-border-hover transition-all duration-200 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id, member.name)}
                          title="Delete Member"
                          className="p-2 border border-gym-border rounded-lg text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
