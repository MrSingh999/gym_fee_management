import { useState, useEffect } from "react";
import { workoutService } from "@/services/workoutService";
import { Dumbbell, Play, ExternalLink, RefreshCw, ChevronLeft, Check } from "lucide-react";
import { motion } from "framer-motion";

// Import shadcn Alert components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Workouts() {
  const [myWorkouts, setMyWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetails, setWorkoutDetails] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Exercise completion states for tactile user feedback
  const [completedExercises, setCompletedExercises] = useState({});

  useEffect(() => {
    fetchMyWorkouts();
  }, []);

  const fetchMyWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workoutService.getMyWorkouts();
      setMyWorkouts(data);
      if (data.length === 1) {
        openWorkout(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load your workout splits.");
    } finally {
      setLoading(false);
    }
  };

  const openWorkout = async (workout) => {
    setSelectedWorkout(workout);
    setDetailsLoading(true);
    try {
      const details = await workoutService.getMyWorkoutById(workout._id);
      setWorkoutDetails(details);
      
      // Auto select active day based on current day of week
      const currentDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = dayNames[currentDayOfWeek];
      
      const matchIdx = details.days.findIndex(d => d.dayName.toLowerCase() === currentDayName.toLowerCase());
      if (matchIdx !== -1) {
        setActiveDayIdx(matchIdx);
      } else {
        setActiveDayIdx(0);
      }

      // Reset completed exercises checklist for new split program
      setCompletedExercises({});
    } catch (err) {
      console.error(err);
      setError("Failed to load workout split details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeWorkoutDetails = () => {
    setSelectedWorkout(null);
    setWorkoutDetails(null);
  };

  const toggleExerciseComplete = (id) => {
    setCompletedExercises(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 280, damping: 24 } 
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-zinc-500 animate-spin" />
        <p className="text-xs text-(--text-muted) font-mono uppercase tracking-wider font-semibold">Syncing workout plans</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 p-4">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Workouts</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (myWorkouts.length === 0) {
    return (
      <div className="max-w-md mx-auto my-10 p-4">
        <Alert className="bg-gym-card border-(--border-color)">
          <Dumbbell className="h-4.5 w-4.5 text-zinc-500" />
          <AlertTitle className="font-mono">No Workouts Assigned</AlertTitle>
          <AlertDescription className="text-xs text-(--text-secondary) mt-1">
            You do not have any workouts assigned to you right now. 
            Please check back later or request your gym trainer/admin to assign you a customized plan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render list of available splits to choose from
  if (!selectedWorkout) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 animate-fade-in p-1 sm:p-2"
      >
        <div className="space-y-1">
          <h2 className="font-bold text-xl text-(--text-primary) font-mono">My Workout Splits</h2>
          <p className="text-xs text-(--text-secondary) font-mono">Select a program to view your training routines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myWorkouts.map((workout) => (
            <motion.div
              key={workout._id}
              onClick={() => openWorkout(workout)}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className="glass-panel p-4 sm:p-5 rounded-[16px] border border-(--border-color) hover:border-(--border-color-hover) hover:bg-gym-dark/30 transition-all duration-300 cursor-pointer flex flex-col justify-between h-40"
            >
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                  workout.assignmentType === 'ALL'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/15'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/15'
                }`}>
                  {workout.assignmentType === 'ALL' ? 'General Plan' : 'Custom split'}
                </span>
                <h3 className="font-bold text-base text-(--text-primary) font-mono mt-2 truncate">{workout.title}</h3>
                <p className="text-[11px] text-(--text-secondary) mt-1 line-clamp-2 leading-relaxed">
                  {workout.description || "General fitness training plan split configured for your membership goals."}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-(--border-color)/40 text-[10px] text-(--text-muted) font-mono mt-auto">
                <span>{workout.dayCount || 0} Workout Days</span>
                <span className="text-gym-orange hover:underline flex items-center space-x-0.5">
                  <span>Start Routine</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (detailsLoading || !workoutDetails) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-zinc-500 animate-spin" />
        <p className="text-xs text-(--text-muted) font-mono uppercase tracking-wider">Syncing routine days</p>
      </div>
    );
  }

  // Active workout details day view
  const selectedDay = workoutDetails.days[activeDayIdx] || workoutDetails.days[0];
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const isTodayActiveDay = selectedDay?.dayName.toLowerCase() === todayName.toLowerCase();

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto p-1 sm:p-2"
    >
      {/* Back to splits if multiple splits available */}
      {myWorkouts.length > 1 && (
        <button
          onClick={closeWorkoutDetails}
          className="flex items-center space-x-1 text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors font-mono cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to programs</span>
        </button>
      )}

      {/* Program Header */}
      <motion.div 
        variants={itemVariants}
        className="glass-panel p-4 sm:p-5 rounded-[16px] border border-(--border-color-hover) space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
              workoutDetails.assignmentType === 'ALL'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/15'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/15'
            }`}>
              {workoutDetails.assignmentType === 'ALL' ? 'General Training Plan' : 'Personal Routine'}
            </span>
            <h2 className="font-bold text-lg sm:text-xl text-(--text-primary) capitalize mt-2 font-mono">{workoutDetails.title}</h2>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-[9px] text-(--text-muted) uppercase font-bold font-mono">Routines split</p>
            <p className="text-sm font-bold text-(--text-primary) mt-0.5 font-mono">
              {workoutDetails.days.length} Days Split
            </p>
          </div>
        </div>
        
        {workoutDetails.description && (
          <p className="text-xs text-(--text-secondary) leading-relaxed border-t border-(--border-color)/40 pt-3">
            {workoutDetails.description}
          </p>
        )}
      </motion.div>

      {workoutDetails.days.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-[12px] border border-(--border-color) text-(--text-muted) text-xs italic">
          There are no days configured for this workout program yet.
        </div>
      ) : (
        /* Weekly Split */
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="font-bold text-xs sm:text-sm text-(--text-primary) font-mono uppercase tracking-wider pl-1">Routines Schedule</h3>

          {/* edge-to-edge scroll bleed day selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none select-none">
            {workoutDetails.days.map((item, idx) => {
              const isSelected = activeDayIdx === idx;
              const isToday = item.dayName.toLowerCase() === todayName.toLowerCase();
              return (
                <button
                  key={item._id}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`px-3.5 py-2.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? "bg-gym-orange text-gym-action-text border-gym-orange shadow-md shadow-gym-orange/10 scale-95"
                      : "bg-gym-dark/45 border-(--border-color) text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  D{item.dayNumber} • {item.dayName.slice(0, 3)} {isToday && "•"}
                </button>
              );
            })}
          </div>

          {/* Focused Day View */}
          <div className="glass-panel p-4 sm:p-5 rounded-[12px] border border-(--border-color-hover) space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-(--border-color)/40">
              <div className="min-w-0 pr-2">
                <span className="font-bold text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">
                  DAY {selectedDay.dayNumber} — {selectedDay.dayName}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-(--text-primary) mt-0.5 font-mono truncate">{selectedDay.title}</h3>
              </div>
              {isTodayActiveDay && (
                <span className="bg-gym-orange text-gym-action-text text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider shadow-sm font-mono shrink-0">
                  Today
                </span>
              )}
            </div>

            {selectedDay.exercises.length === 0 ? (
              <div className="p-8 text-center text-(--text-muted) text-xs italic">
                Active Recovery day or Rest day. No exercises configured.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDay.exercises.map((ex, i) => {
                  const isCompleted = !!completedExercises[ex._id || i];
                  return (
                    <motion.div 
                      key={ex._id || i} 
                      onClick={() => toggleExerciseComplete(ex._id || i)}
                      whileHover={{ scale: 1.002 }} 
                      whileTap={{ scale: 0.998 }}
                      className={`flex flex-col justify-between border p-3.5 rounded-[8px] cursor-pointer transition-all duration-300 select-none ${
                        isCompleted 
                          ? 'border-emerald-500/25 dark:border-emerald-500/20 bg-emerald-500/10' 
                          : 'border-(--border-color)/30 bg-gym-dark/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                          isCompleted 
                            ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white dark:text-black font-bold' 
                            : 'border-(--border-color) bg-gym-dark/50'
                        }`}>
                          {isCompleted && <Check className="h-3 w-3 stroke-[3.5]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-semibold font-mono leading-tight block ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-(--text-primary)'}`}>
                            {ex.name}
                          </span>
                          
                          <div className="flex flex-wrap gap-x-2 text-[10px] text-(--text-muted) font-mono mt-1">
                            <span>{ex.sets} Sets</span>
                            <span>•</span>
                            <span>{ex.reps} Reps</span>
                            {ex.duration && (
                              <>
                                <span>•</span>
                                <span>{ex.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {ex.notes && (
                        <div className="text-[10px] text-(--text-secondary) leading-relaxed mt-2.5 bg-gym-dark/50 border border-(--border-color)/20 p-2 rounded-[4px] font-sans">
                          {ex.notes}
                        </div>
                      )}

                      {ex.videoUrl && (
                        <div className="mt-2.5 pt-2 border-t border-(--border-color)/20 flex items-center justify-end">
                          <a 
                            href={ex.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[9px] font-bold text-gym-orange hover:underline flex items-center space-x-0.5 font-mono cursor-pointer"
                          >
                            <Play className="h-2.5 w-2.5 fill-gym-orange" />
                            <span>Watch Video demonstration</span>
                            <ExternalLink className="h-2 w-2" />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
