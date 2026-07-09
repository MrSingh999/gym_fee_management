import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Plus, Trash2, Edit, Users, UserPlus, Check, X, 
  ChevronDown, ChevronUp, Play, Image, ExternalLink, RefreshCw, MoreVertical, ArrowLeft
} from 'lucide-react';
import { workoutService } from '@/services/workoutService';
import { memberService } from '@/services/memberService';
import { motion, AnimatePresence } from 'framer-motion';

// Import shadcn UI components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function WorkoutManagement() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals state
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programModalData, setProgramModalData] = useState({ title: '', description: '', assignmentType: 'ALL', isActive: true });
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [programModalError, setProgramModalError] = useState(null);

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [dayModalData, setDayModalData] = useState({ dayNumber: '', dayName: '', title: '' });
  const [editingDayId, setEditingDayId] = useState(null);
  const [dayModalError, setDayModalError] = useState(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseModalData, setExerciseModalData] = useState({ name: '', sets: '', reps: '', duration: '', notes: '', image: '', videoUrl: '' });
  const [editingExerciseIdx, setEditingExerciseIdx] = useState(null); // index in day's exercises array
  const [activeDayForExercise, setActiveDayForExercise] = useState(null); // the day document being edited
  const [exerciseModalError, setExerciseModalError] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [assignedMemberIds, setAssignedMemberIds] = useState(new Set());
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Deletion targets for shadcn AlertDialog
  const [deleteProgramTarget, setDeleteProgramTarget] = useState(null);
  const [deleteDayTarget, setDeleteDayTarget] = useState(null);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState(null);

  // Expanded days state (for accordion style)
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (selectedWorkout) {
      fetchWorkoutDetails(selectedWorkout._id);
    } else {
      setSelectedWorkoutDetails(null);
    }
  }, [selectedWorkout]);

  const fetchWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workoutService.getWorkouts();
      setWorkouts(data);
      if (data.length > 0 && !selectedWorkout) {
        setSelectedWorkout(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load workout programs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const details = await workoutService.getWorkoutById(id);
      setSelectedWorkoutDetails(details);
      
      // Keep track of assignments
      const assignedIds = new Set(details.assignments.map(a => a.member._id));
      setAssignedMemberIds(assignedIds);
    } catch (err) {
      console.error(err);
      setError('Failed to load details for this workout program.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // WORKOUT PROGRAM CRUD
  // ────────────────────────────────────────────────────────────────

  const openNewProgramModal = () => {
    setEditingProgramId(null);
    setProgramModalError(null);
    setProgramModalData({ title: '', description: '', assignmentType: 'ALL', isActive: true });
    setIsProgramModalOpen(true);
  };

  const openEditProgramModal = (program) => {
    setEditingProgramId(program._id);
    setProgramModalError(null);
    setProgramModalData({
      title: program.title,
      description: program.description || '',
      assignmentType: program.assignmentType,
      isActive: program.isActive,
    });
    setIsProgramModalOpen(true);
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    if (!programModalData.title.trim()) return;
    setProgramModalError(null);

    try {
      if (editingProgramId) {
        const updated = await workoutService.updateWorkout(editingProgramId, programModalData);
        setWorkouts(workouts.map(w => w._id === editingProgramId ? { ...w, ...updated } : w));
        if (selectedWorkout && selectedWorkout._id === editingProgramId) {
          setSelectedWorkout({ ...selectedWorkout, ...updated });
        }
      } else {
        const created = await workoutService.createWorkout(programModalData);
        setWorkouts([created, ...workouts]);
        setSelectedWorkout(created);
      }
      setIsProgramModalOpen(false);
    } catch (err) {
      setProgramModalError(err.message || 'Error saving program');
    }
  };

  const confirmDeleteProgram = async () => {
    if (!deleteProgramTarget) return;
    const { id } = deleteProgramTarget;
    try {
      await workoutService.deleteWorkout(id);
      const filtered = workouts.filter(w => w._id !== id);
      setWorkouts(filtered);
      if (selectedWorkout && selectedWorkout._id === id) {
        setSelectedWorkout(filtered.length > 0 ? filtered[0] : null);
      }
      setDeleteProgramTarget(null);
    } catch (err) {
      alert(err.message || 'Error deleting program');
    }
  };

  const handleToggleActive = async (program) => {
    try {
      const updated = await workoutService.updateWorkout(program._id, {
        isActive: !program.isActive
      });
      setWorkouts(workouts.map(w => w._id === program._id ? { ...w, isActive: updated.isActive } : w));
      if (selectedWorkout && selectedWorkout._id === program._id) {
        setSelectedWorkout({ ...selectedWorkout, isActive: updated.isActive });
      }
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  // ────────────────────────────────────────────────────────────────
  // WORKOUT DAYS CRUD
  // ────────────────────────────────────────────────────────────────

  const toggleDayExpanded = (dayId) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const openNewDayModal = () => {
    setEditingDayId(null);
    setDayModalError(null);
    const nextDayNum = selectedWorkoutDetails?.days && selectedWorkoutDetails.days.length > 0
      ? Math.max(...selectedWorkoutDetails.days.map(d => d.dayNumber)) + 1
      : 1;

    const suggestedDayName = getDayNameFromNumber(nextDayNum);
    setDayModalData({ dayNumber: nextDayNum, dayName: suggestedDayName, title: '' });
    setIsDayModalOpen(true);
  };

  const getDayNameFromNumber = (num) => {
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[(num - 1) % 7] || 'Monday';
  };

  const openEditDayModal = (day) => {
    setEditingDayId(day._id);
    setDayModalError(null);
    setDayModalData({
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      title: day.title
    });
    setIsDayModalOpen(true);
  };

  const handleDaySubmit = async (e) => {
    e.preventDefault();
    if (!dayModalData.title.trim()) return;
    setDayModalError(null);

    const submitData = {
      ...dayModalData,
      dayNumber: parseInt(dayModalData.dayNumber) || 1
    };

    try {
      if (editingDayId) {
        await workoutService.updateWorkoutDay(editingDayId, submitData);
      } else {
        await workoutService.addWorkoutDay(selectedWorkout._id, submitData);
      }
      fetchWorkoutDetails(selectedWorkout._id);
      setIsDayModalOpen(false);
    } catch (err) {
      setDayModalError(err.message || 'Error saving day');
    }
  };

  const confirmDeleteDay = async () => {
    if (!deleteDayTarget) return;
    const { id } = deleteDayTarget;
    try {
      await workoutService.deleteWorkoutDay(id);
      fetchWorkoutDetails(selectedWorkout._id);
      setDeleteDayTarget(null);
    } catch (err) {
      alert(err.message || 'Error deleting day');
    }
  };

  // ────────────────────────────────────────────────────────────────
  // EXERCISES CRUD (Subdocuments of Day)
  // ────────────────────────────────────────────────────────────────

  const openNewExerciseModal = (day) => {
    setActiveDayForExercise(day);
    setEditingExerciseIdx(null);
    setExerciseModalError(null);
    setExerciseModalData({ name: '', sets: '', reps: '', duration: '', notes: '', image: '', videoUrl: '' });
    setIsExerciseModalOpen(true);
  };

  const openEditExerciseModal = (day, exercise, idx) => {
    setActiveDayForExercise(day);
    setEditingExerciseIdx(idx);
    setExerciseModalError(null);
    setExerciseModalData({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration || '',
      notes: exercise.notes || '',
      image: exercise.image || '',
      videoUrl: exercise.videoUrl || '',
    });
    setIsExerciseModalOpen(true);
  };

  const handleExerciseSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseModalData.name.trim()) return;
    setExerciseModalError(null);

    const submitData = {
      ...exerciseModalData,
      sets: parseInt(exerciseModalData.sets) || 1
    };

    try {
      const updatedExercises = [...activeDayForExercise.exercises];
      if (editingExerciseIdx !== null) {
        updatedExercises[editingExerciseIdx] = submitData;
      } else {
        updatedExercises.push(submitData);
      }

      await workoutService.updateWorkoutDay(activeDayForExercise._id, {
        exercises: updatedExercises
      });

      fetchWorkoutDetails(selectedWorkout._id);
      setIsExerciseModalOpen(false);
    } catch (err) {
      setExerciseModalError(err.message || 'Error saving exercise');
    }
  };

  const confirmDeleteExercise = async () => {
    if (!deleteExerciseTarget) return;
    const { day, idx } = deleteExerciseTarget;
    try {
      const updatedExercises = day.exercises.filter((_, i) => i !== idx);
      await workoutService.updateWorkoutDay(day._id, {
        exercises: updatedExercises
      });
      fetchWorkoutDetails(selectedWorkout._id);
      setDeleteExerciseTarget(null);
    } catch (err) {
      alert(err.message || 'Error deleting exercise');
    }
  };

  // ────────────────────────────────────────────────────────────────
  // ASSIGNMENTS MANAGEMENT
  // ────────────────────────────────────────────────────────────────

  const openAssignmentModal = async () => {
    setSearchMember('');
    setFilterGender('all');
    setFilterPlan('all');
    setIsAssignModalOpen(true);
    setAssigningLoading(true);
    try {
      const allMembers = await memberService.getMembers();
      setMembers(allMembers.filter(m => m.status.toLowerCase() !== 'inactive'));
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningLoading(false);
    }
  };

  const toggleMemberAssignment = async (memberId) => {
    const isCurrentlyAssigned = assignedMemberIds.has(memberId);
    try {
      if (isCurrentlyAssigned) {
        await workoutService.unassignMember(selectedWorkout._id, memberId);
        setAssignedMemberIds(prev => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      } else {
        await workoutService.assignMembers(selectedWorkout._id, [memberId]);
        setAssignedMemberIds(prev => {
          const next = new Set(prev);
          next.add(memberId);
          return next;
        });
      }
      fetchWorkoutDetails(selectedWorkout._id);
    } catch (err) {
      alert(err.message || 'Error updating assignment');
    }
  };

  // Dynamically extract unique plan/membership options from member directory
  const uniquePlansList = Array.from(new Set(members.map(m => m.membershipType || (m.plan && m.plan.name)).filter(Boolean)));

  // Filters members inside modal (Search base + Gender + Plan/MembershipType)
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchMember.toLowerCase()) || 
                          (m.mobile || m.phone || '').includes(searchMember);
    const matchesGender = filterGender === 'all' || m.gender === filterGender;
    const matchesPlan = filterPlan === 'all' || (m.membershipType || (m.plan && m.plan.name)) === filterPlan;
    return matchesSearch && matchesGender && matchesPlan;
  });

  const selectTriggerClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-3.5 py-2.5 h-auto text-sm text-(--text-primary) cursor-pointer hover:border-(--border-color-hover) transition-all duration-200 font-mono";

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl text-(--text-primary) tracking-tight">
            Workout <span className="text-(--text-secondary) font-normal ml-0.5">Management</span>
          </h1>
          <p className="text-(--text-secondary) mt-1 text-xs font-mono">
            Create fitness split routines, add exercises, and assign routines to members.
          </p>
        </div>
        <button
          onClick={openNewProgramModal}
          className="flex items-center space-x-2 bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 px-4 py-2.5 sm:py-2 rounded-[6px] font-semibold text-sm transition-all duration-200 cursor-pointer border border-(--border-color-hover) min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center sm:justify-start active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Program</span>
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4 animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <RefreshCw className="h-8 w-8 text-zinc-500 animate-spin" />
          <p className="text-xs text-(--text-muted) font-mono uppercase tracking-wider">Loading routines</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-[16px] border border-(--border-color-hover) space-y-4 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <div className="w-16 h-16 bg-gym-dark/45 border border-(--border-color) text-zinc-500 rounded-full flex items-center justify-center mx-auto">
            <Dumbbell className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-(--text-primary) font-mono">No Programs Configured</h3>
            <p className="text-xs text-(--text-secondary) mt-1 max-w-sm mx-auto">
              Create your first gym workout split program to start assigning it to members.
            </p>
          </div>
          <button
            onClick={openNewProgramModal}
            className="bg-gym-orange text-gym-action-text px-4 py-2 rounded-[6px] text-xs font-bold transition-all hover:opacity-95"
          >
            Create Routine Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Programs List — hidden on mobile when a program is selected */}
          <div className={`lg:col-span-4 space-y-3 animate-fade-in ${selectedWorkout ? 'hidden lg:block' : 'block'}`} style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <h3 className="font-bold text-sm text-(--text-muted) font-mono uppercase tracking-wider pl-1">Workout Splits</h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {workouts.map((program) => {
                const isSelected = selectedWorkout?._id === program._id;
                return (
                  <div
                    key={program._id}
                    onClick={() => setSelectedWorkout(program)}
                    className={`glass-panel p-4 rounded-[12px] border transition-all duration-200 cursor-pointer relative group ${
                      isSelected
                        ? 'border-gym-orange bg-gym-orange/[0.02] shadow-md shadow-gym-orange/5'
                        : 'border-(--border-color) hover:border-(--border-color-hover) hover:bg-gym-dark/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 pr-6">
                        <h4 className="font-bold text-sm text-(--text-primary) truncate font-mono">{program.title}</h4>
                        <p className="text-[11px] text-(--text-secondary) line-clamp-2 mt-1 leading-normal font-sans">
                          {program.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Dropdown Menu actions trigger inside program card */}
                      <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-500 hover:text-(--text-primary) rounded-[6px] hover:bg-(--bg-elevated) transition-colors cursor-pointer outline-none active:scale-95">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEditProgramModal(program)}>
                              <Edit className="h-3.5 w-3.5 mr-2" />
                              <span>Edit Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(program)}>
                              <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                              <span>{program.isActive ? 'Deactivate' : 'Activate'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              variant="destructive"
                              onClick={() => setDeleteProgramTarget({ id: program._id, title: program.title })}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              <span>Delete Program</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] font-mono shrink-0 uppercase tracking-wider border absolute top-3.5 right-12 transition-all ${
                        program.assignmentType === 'ALL'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/15'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/15'
                      }`}>
                        {program.assignmentType}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-(--border-color)/40 text-[10px] text-(--text-muted) font-mono">
                      <div className="flex space-x-3">
                        <span>{program.dayCount || 0} Days</span>
                        {program.assignmentType === 'SELECTED' && (
                          <span>{program.assignedCount || 0} Assigned</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {program.isActive ? (
                          <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 dark:border-emerald-500/15 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                            <span className="status-dot status-dot-active" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-500/20 dark:border-red-500/15 text-red-600 dark:text-red-400 bg-red-500/10 font-mono">
                            <span className="status-dot status-dot-overdue" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: Selected Program Detail — shown on mobile only when selected */}
          <div className={`lg:col-span-8 animate-fade-in ${selectedWorkout ? 'block' : 'hidden lg:block'}`} style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
            {/* Mobile Back Button */}
            {selectedWorkout && (
              <button
                onClick={() => setSelectedWorkout(null)}
                className="lg:hidden flex items-center space-x-2 text-(--text-secondary) hover:text-(--text-primary) mb-4 min-h-[44px] px-1 transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider">Back to Splits</span>
              </button>
            )}
            {detailsLoading ? (
              <div className="glass-panel p-12 text-center rounded-[16px] border border-(--border-color-hover) min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-6 w-6 text-zinc-500 animate-spin" />
                <p className="text-xs text-(--text-muted) font-mono uppercase tracking-wider">Syncing program routines</p>
              </div>
            ) : selectedWorkoutDetails ? (
              <div className="space-y-6">
                {/* Details Card */}
                <div className="glass-panel p-5 sm:p-6 rounded-[16px] border border-(--border-color-hover) space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-(--border-color)/40">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h2 className="font-bold text-lg sm:text-xl text-(--text-primary) font-mono">{selectedWorkoutDetails.title}</h2>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] font-mono uppercase border ${
                          selectedWorkoutDetails.assignmentType === 'ALL'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/15'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/15'
                        }`}>
                          {selectedWorkoutDetails.assignmentType === 'ALL' ? 'Assigned to All Members' : 'Personal Assignment'}
                        </span>
                      </div>
                      <p className="text-xs text-(--text-secondary) leading-relaxed font-sans">
                        {selectedWorkoutDetails.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => openEditProgramModal(selectedWorkoutDetails)}
                        className="p-2 border border-(--border-color) rounded-[6px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) hover:border-(--border-color-hover) cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                       <button
                        onClick={() => handleToggleActive(selectedWorkoutDetails)}
                        className={`p-2 border rounded-[6px] cursor-pointer transition-colors ${
                          selectedWorkoutDetails.isActive
                            ? 'border-emerald-500/20 dark:border-emerald-500/15 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'border-red-500/20 dark:border-red-500/15 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20'
                        }`}
                        title={selectedWorkoutDetails.isActive ? 'Deactivate program' : 'Activate program'}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteProgramTarget({ id: selectedWorkoutDetails._id, title: selectedWorkoutDetails.title })}
                        className="p-2 border border-(--border-color) rounded-[6px] text-(--text-secondary) hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 cursor-pointer"
                        title="Delete Program"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Members assignments block */}
                  {selectedWorkoutDetails.assignmentType === 'SELECTED' && (
                    <div className="bg-gym-dark/25 border border-(--border-color) rounded-[8px] p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-(--text-secondary)" />
                          <h4 className="font-bold text-xs text-(--text-primary) font-mono">Assigned Members ({selectedWorkoutDetails.assignments.length})</h4>
                        </div>
                        <button
                          onClick={openAssignmentModal}
                          className="flex items-center space-x-1 bg-(--text-primary) text-(--bg-canvas) px-2.5 py-1 rounded-[4px] text-[10px] font-bold transition-all hover:opacity-90 cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>Assign Members</span>
                        </button>
                      </div>

                      {selectedWorkoutDetails.assignments.length === 0 ? (
                        <p className="text-[11px] text-(--text-muted) italic">No members assigned yet. This routine won't be visible to anyone.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1 max-h-[120px] overflow-y-auto pr-1">
                          {selectedWorkoutDetails.assignments.map((assignment) => (
                            <div 
                              key={assignment.member._id}
                              className="flex items-center space-x-1.5 bg-gym-dark/50 border border-(--border-color-hover) pl-2 pr-1 py-0.5 rounded-[4px] text-[10px] text-(--text-secondary) font-mono"
                            >
                              <span>{assignment.member.name}</span>
                              <button 
                                onClick={() => toggleMemberAssignment(assignment.member._id)}
                                className="text-zinc-500 hover:text-red-400 p-0.5 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Program Day Accordions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-(--text-primary) font-mono">Day-wise Schedule</h3>
                      <button
                        onClick={openNewDayModal}
                        className="flex items-center space-x-1 bg-gym-dark/55 border border-(--border-color) hover:border-(--border-color-hover) text-(--text-secondary) hover:text-(--text-primary) px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Day</span>
                      </button>
                    </div>

                    {selectedWorkoutDetails.days.length === 0 ? (
                      <div className="border border-dashed border-(--border-color-hover) p-8 text-center rounded-[8px] text-(--text-muted) text-xs italic">
                        No training days configured. Click "Add Day" to define routines like chest, back, legs split.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedWorkoutDetails.days.map((day) => {
                          const isExpanded = !!expandedDays[day._id];
                          return (
                            <div 
                              key={day._id}
                              className="border border-(--border-color) rounded-[8px] overflow-hidden bg-gym-dark/20"
                            >
                              {/* Accordion Trigger */}
                              <div 
                                className="flex justify-between items-center p-3.5 bg-gym-dark/45 cursor-pointer hover:bg-gym-dark/65 transition-colors"
                                onClick={() => toggleDayExpanded(day._id)}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <span className="bg-gym-orange text-gym-action-text text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center font-mono">
                                    {day.dayNumber}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-xs text-(--text-primary) font-mono">
                                      {day.dayName} — {day.title}
                                    </h4>
                                    <p className="text-[10px] text-(--text-muted) mt-0.5 font-mono">
                                      {day.exercises.length} Exercises
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => openEditDayModal(day)}
                                    className="p-1 text-zinc-500 hover:text-(--text-primary) cursor-pointer"
                                    title="Edit Day Title"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteDayTarget({ id: day._id, title: day.title, dayNumber: day.dayNumber })}
                                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                                    title="Delete Day"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleDayExpanded(day._id)}
                                    className="p-1 text-zinc-500 hover:text-(--text-primary) cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Accordion Exercises Content */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-(--border-color)/50 bg-gym-dark/10 p-4 space-y-4"
                                  >
                                    <div className="flex justify-between items-center">
                                      <h5 className="text-[10px] text-(--text-muted) uppercase font-bold tracking-wider font-mono">Exercises Block</h5>
                                      <button
                                        onClick={() => openNewExerciseModal(day)}
                                        className="flex items-center space-x-1 border border-(--border-color) hover:border-(--border-color-hover) text-(--text-secondary) hover:text-(--text-primary) px-2.5 py-1 rounded-[4px] text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span>Add Exercise</span>
                                      </button>
                                    </div>

                                    {day.exercises.length === 0 ? (
                                      <p className="text-[11px] text-(--text-muted) italic text-center py-4">No exercises configured for this day.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {day.exercises.map((exercise, idx) => (
                                          <div 
                                            key={exercise._id || idx}
                                            className="bg-gym-dark/45 border border-(--border-color) p-3 rounded-[6px] space-y-2 hover:border-(--border-color-hover) transition-all relative group"
                                          >
                                            <div className="flex justify-between items-start gap-1">
                                              <div className="min-w-0">
                                                <h6 className="font-bold text-xs text-(--text-primary) truncate font-mono">{exercise.name}</h6>
                                                <div className="flex flex-wrap gap-x-2 text-[10px] text-(--text-secondary) font-mono mt-1">
                                                  <span>{exercise.sets} Sets</span>
                                                  <span>•</span>
                                                  <span>{exercise.reps} Reps</span>
                                                  {exercise.duration && (
                                                    <>
                                                      <span>•</span>
                                                      <span>{exercise.duration}</span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="flex space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => openEditExerciseModal(day, exercise, idx)}
                                                  className="text-zinc-500 hover:text-(--text-primary) p-0.5 cursor-pointer"
                                                  title="Edit"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                  onClick={() => setDeleteExerciseTarget({ day, exercise, idx })}
                                                  className="text-zinc-500 hover:text-red-400 p-0.5 cursor-pointer"
                                                  title="Delete"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>

                                            {exercise.notes && (
                                              <p className="text-[10px] text-(--text-muted) leading-relaxed pt-1 bg-gym-dark/20 px-2 py-1 rounded">
                                                {exercise.notes}
                                              </p>
                                            )}

                                            {(exercise.image || exercise.videoUrl) && (
                                              <div className="flex space-x-3 pt-1 text-[9px] text-zinc-500 font-mono">
                                                {exercise.image && (
                                                  <span className="flex items-center space-x-0.5">
                                                    <Image className="h-3 w-3" />
                                                    <span>Has Demo Image</span>
                                                  </span>
                                                )}
                                                {exercise.videoUrl && (
                                                  <a 
                                                    href={exercise.videoUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-0.5 text-gym-orange hover:underline cursor-pointer"
                                                  >
                                                    <Play className="h-3 w-3" />
                                                    <span>Watch Demo Video</span>
                                                    <ExternalLink className="h-2 w-2" />
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center rounded-[16px] border border-(--border-color-hover) min-h-[40vh] flex items-center justify-center">
                <p className="text-xs text-(--text-secondary) font-mono uppercase tracking-wider">Select a workout program split to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* WORKOUT PROGRAM CREATION / EDIT MODAL */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isProgramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProgramModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-[16px] border border-(--border-color-hover) bg-gym-card p-6 overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-(--border-color)/40 pb-3">
                <h3 className="font-bold text-base text-(--text-primary) font-mono">
                  {editingProgramId ? 'Edit Workout Split' : 'New Workout Split'}
                </h3>
                <button onClick={() => setIsProgramModalOpen(false)} className="text-zinc-500 hover:text-(--text-primary) cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleProgramSubmit} className="space-y-4 mt-4">
                {programModalError && (
                  <Alert variant="destructive">
                    <AlertDescription>{programModalError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Program Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6 Days Beginner Program"
                    value={programModalData.title}
                    onChange={e => setProgramModalData({ ...programModalData, title: e.target.value })}
                    className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Description</label>
                  <textarea
                    placeholder="Brief description of the routines focus (hypertrophy, endurance, etc.)"
                    rows="3"
                    value={programModalData.description}
                    onChange={e => setProgramModalData({ ...programModalData, description: e.target.value })}
                    className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Assignment Type</label>
                    <Select
                      value={programModalData.assignmentType}
                      onValueChange={val => setProgramModalData({ ...programModalData, assignmentType: val })}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                        <SelectItem value="ALL">All Members</SelectItem>
                        <SelectItem value="SELECTED">Selected Members Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Status</label>
                    <Select
                      value={programModalData.isActive ? 'true' : 'false'}
                      onValueChange={val => setProgramModalData({ ...programModalData, isActive: val === 'true' })}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-3 border-t border-(--border-color)/40">
                  <button
                    type="button"
                    onClick={() => setIsProgramModalOpen(false)}
                    className="flex-1 border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Save Program
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* WORKOUT DAY MODAL */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDayModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-[16px] border border-(--border-color-hover) bg-gym-card p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-(--border-color)/40 pb-3">
                <h3 className="font-bold text-base text-(--text-primary) font-mono">
                  {editingDayId ? 'Edit Training Day' : 'Add Training Day'}
                </h3>
                <button onClick={() => setIsDayModalOpen(false)} className="text-zinc-500 hover:text-(--text-primary) cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDaySubmit} className="space-y-4 mt-4">
                {dayModalError && (
                  <Alert variant="destructive">
                    <AlertDescription>{dayModalError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Day # *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 3"
                      value={dayModalData.dayNumber}
                      onChange={e => {
                        const val = e.target.value;
                        const num = val === '' ? '' : parseInt(val);
                        setDayModalData({ 
                          ...dayModalData, 
                          dayNumber: num,
                          dayName: val === '' ? '' : getDayNameFromNumber(num) 
                        });
                      }}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange text-center font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Day Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monday"
                      value={dayModalData.dayName}
                      onChange={e => setDayModalData({ ...dayModalData, dayName: e.target.value })}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Workout Focus / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest & Triceps"
                    value={dayModalData.title}
                    onChange={e => setDayModalData({ ...dayModalData, title: e.target.value })}
                    className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange"
                  />
                </div>

                <div className="flex space-x-3 pt-3 border-t border-(--border-color)/40">
                  <button
                    type="button"
                    onClick={() => setIsDayModalOpen(false)}
                    className="flex-1 border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Save Day
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* EXERCISE MODAL (Add/Edit inside workout day) */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExerciseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExerciseModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-[16px] border border-(--border-color-hover) bg-gym-card p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-(--border-color)/40 pb-3">
                <h3 className="font-bold text-base text-(--text-primary) font-mono">
                  {editingExerciseIdx !== null ? 'Edit Exercise details' : 'Add Exercise detail'}
                </h3>
                <button onClick={() => setIsExerciseModalOpen(false)} className="text-zinc-500 hover:text-(--text-primary) cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExerciseSubmit} className="space-y-4 mt-4">
                {exerciseModalError && (
                  <Alert variant="destructive">
                    <AlertDescription>{exerciseModalError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Exercise Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bench Press"
                    value={exerciseModalData.name}
                    onChange={e => setExerciseModalData({ ...exerciseModalData, name: e.target.value })}
                    className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Sets *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 4"
                      value={exerciseModalData.sets}
                      onChange={e => {
                        const val = e.target.value;
                        setExerciseModalData({ 
                          ...exerciseModalData, 
                          sets: val === '' ? '' : parseInt(val) 
                        });
                      }}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Reps *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12 or Max"
                      value={exerciseModalData.reps}
                      onChange={e => setExerciseModalData({ ...exerciseModalData, reps: e.target.value })}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Duration (opt)</label>
                    <input
                      type="text"
                      placeholder="e.g. 45s or 1 min"
                      value={exerciseModalData.duration}
                      onChange={e => setExerciseModalData({ ...exerciseModalData, duration: e.target.value })}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange text-center font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Instruction Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Slow negative, push with chest explosive"
                    value={exerciseModalData.notes}
                    onChange={e => setExerciseModalData({ ...exerciseModalData, notes: e.target.value })}
                    className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Demo Video Link (opt)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://youtube.com/..."
                      value={exerciseModalData.videoUrl}
                      onChange={e => setExerciseModalData({ ...exerciseModalData, videoUrl: e.target.value })}
                      className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-3 border-t border-(--border-color)/40">
                  <button
                    type="button"
                    onClick={() => setIsExerciseModalOpen(false)}
                    className="flex-1 border border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 p-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                  >
                    Save Exercise
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MEMBERS ASSIGNMENT SELECTOR MODAL */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-[16px] border border-(--border-color-hover) bg-gym-card p-6 relative z-10 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center border-b border-(--border-color)/40 pb-3 shrink-0">
                <h3 className="font-bold text-base text-(--text-primary) font-mono">Assign Program to Members</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-500 hover:text-(--text-primary) cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search text input */}
              <div className="mt-4 shrink-0">
                <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Search Name / Phone</label>
                <input
                  type="text"
                  placeholder="Type name or phone number..."
                  value={searchMember}
                  onChange={e => setSearchMember(e.target.value)}
                  className="w-full bg-gym-dark/50 border border-(--border-color) rounded-[6px] text-sm text-(--text-primary) p-2.5 outline-none focus:border-gym-orange mt-1"
                />
              </div>

              {/* Filters grid for Gender and Plan */}
              <div className="grid grid-cols-2 gap-3 mt-3 mb-4 shrink-0">
                <div className="space-y-1">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Gender Filter</label>
                  <Select
                    value={filterGender}
                    onValueChange={setFilterGender}
                  >
                    <SelectTrigger className="w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-3.5 py-2 h-auto text-xs text-(--text-primary) cursor-pointer hover:border-(--border-color-hover) transition-all duration-200 font-mono">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Plan Filter</label>
                  <Select
                    value={filterPlan}
                    onValueChange={setFilterPlan}
                  >
                    <SelectTrigger className="w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-3.5 py-2 h-auto text-xs text-(--text-primary) cursor-pointer hover:border-(--border-color-hover) transition-all duration-200 font-mono">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent className="bg-(--bg-card) border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                      <SelectItem value="all">All Plans</SelectItem>
                      {uniquePlansList.map(plan => (
                        <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Members check list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                {assigningLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <RefreshCw className="h-5 w-5 text-zinc-500 animate-spin" />
                    <p className="text-[10px] text-(--text-muted) font-mono uppercase">Retrieving directory</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-xs text-(--text-muted) italic text-center py-8">No active members found matching filter.</p>
                ) : (
                  filteredMembers.map((member) => {
                    const isChecked = assignedMemberIds.has(member._id);
                    return (
                      <label 
                        key={member._id}
                        className={`flex items-center justify-between p-3 border rounded-[6px] cursor-pointer transition-all ${
                          isChecked 
                            ? 'border-gym-orange bg-gym-orange/[0.01]' 
                            : 'border-(--border-color) hover:border-(--border-color-hover) bg-gym-dark/10'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-(--text-primary) truncate font-mono">{member.name}</p>
                          <p className="text-[10px] text-(--text-muted) font-mono mt-0.5 font-sans">
                            {member.mobile || member.phone} ({member.gender} • {member.membershipType || (member.plan && member.plan.name)})
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMemberAssignment(member._id)}
                          className="h-4.5 w-4.5 rounded border-(--border-color) text-gym-orange focus:ring-gym-orange cursor-pointer"
                        />
                      </label>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-(--border-color)/40 mt-4 shrink-0">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-full bg-(--text-primary) text-(--bg-canvas) p-2.5 rounded-[6px] text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* SHADCN ALERTDIALOG CONFIRMATIONS */}
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* Deletion confirmation for Workout Program */}
      <AlertDialog open={!!deleteProgramTarget} onOpenChange={setDeleteProgramTarget}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout Program</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the program <strong>{deleteProgramTarget?.title}</strong>? 
                This action is permanent and will delete all associated days, exercises, and user assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteProgram}>
                Delete Program
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>

      {/* Deletion confirmation for Workout Day */}
      <AlertDialog open={!!deleteDayTarget} onOpenChange={setDeleteDayTarget}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Training Day</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>Day {deleteDayTarget?.dayNumber}: {deleteDayTarget?.title}</strong>? 
                This action cannot be undone and will delete all exercises inside this day.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteDay}>
                Delete Day
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>

      {/* Deletion confirmation for Exercise */}
      <AlertDialog open={!!deleteExerciseTarget} onOpenChange={setDeleteExerciseTarget}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the exercise <strong>{deleteExerciseTarget?.exercise?.name}</strong> from this training day?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteExercise}>
                Delete Exercise
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  );
}
