import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

const ROUTINES = {
  personal: [
    { day: "Monday - Saturday", focus: "1-on-1 Customized Routine", routine: "Your training schedule is fully customized by your personal trainer. Please consult with your trainer for your daily specialized routines, progress tracking, and diet plan." },
    { day: "Sunday", focus: "Active Recovery", routine: "Relax and recover. Keep up with hydration, follow your customized nutrition plan, and ensure you get 8 hours of quality rest." },
  ],
  cardio: [
    { day: "Monday", focus: "Chest & Triceps + HIIT Cardio", routine: "Bench press (4x8), Incline dumbbell press (3x10), Overhead tricep extension (3x12), Cable chest fly (3x15). Finisher: 15 mins HIIT Treadmill Sprints (30s on, 30s off)." },
    { day: "Tuesday", focus: "Back & Biceps + LISS Cardio", routine: "Deadlift (4x6), Lat pulldowns (3x10), Seated cable row (3x12), Hammer curls (3x15), Incline bicep curl (3x12). Finisher: 20 mins LISS Stairmaster." },
    { day: "Wednesday", focus: "Legs & Core Intensity", routine: "Barbell back squats (4x8), Leg press (3x10), Romanian deadlifts (3x12), Standing calf raises (4x15), Hanging leg raises (3x15), Plank hold (3x60s)." },
    { day: "Thursday", focus: "Shoulders & Arms + Rowing", routine: "Military press (4x8), Lateral raises (4x12), Face pulls (3x15), Tricep pushdowns (3x12), Barbell curls (3x10). Finisher: 15 mins Rowing Machine interval." },
    { day: "Friday", focus: "Full Body Conditioning", routine: "Kettlebell swings (4x15), Dumbbell thrusters (3x10), Pull-ups (3x max), Push-ups (3x20), Mountain climbers (3x45s). Finisher: 10 mins HIIT Elliptical." },
    { day: "Saturday", focus: "Active Recovery & Cardio", routine: "30 mins low-intensity steady-state (LISS) jogging or cycling, followed by deep static stretching & foam rolling (20 mins)." },
    { day: "Sunday", focus: "Rest Day (Rejuvenate)", routine: "Complete rest. Focus on hydration, high protein intake, and getting 8 hours of quality sleep." },
  ],
  strength: [
    { day: "Monday", focus: "Chest & Triceps Power", routine: "Bench press (4x8), Incline dumbbell press (3x10), Cable flyes (3x12), Skull crushers (3x10), Tricep overhead extensions (3x12)." },
    { day: "Tuesday", focus: "Back & Biceps Width", routine: "Pull-ups (4x max), Barbell rows (4x8), Lat pulldowns (3x10), Barbell bicep curls (3x10), Hammer curls (3x12)." },
    { day: "Wednesday", focus: "Legs / Lower Body", routine: "Squats (4x8), Romanian deadlifts (3x10), Leg extensions (3x12), Lying leg curls (3x12), Standing calf raises (4x15)." },
    { day: "Thursday", focus: "Shoulders & Trap Mass", routine: "Overhead barbell press (4x8), Dumbbell lateral raises (4x12), Bent-over rear delt flyes (3x15), Dumbbell shrugs (3x12)." },
    { day: "Friday", focus: "Arm Day Pumps & Core", routine: "Close-grip bench press (3x10), Preacher curls (3x10), Tricep pushdowns (3x12), Incline dumbbell curls (3x12), Hanging leg raises (3x15), Crunches (3x20)." },
    { day: "Saturday", focus: "Active Mobility & Stretch", routine: "Light cardio (15 min jog), followed by dynamic stretching, yoga poses, and functional core movements (Plank holds, Bird-dog)." },
    { day: "Sunday", focus: "Rest Day", routine: "Allow muscle tissues to recover. Hydrate well and perform light walking." },
  ],
};

const pickRoutine = (planName) => {
  const name = (planName || "strength training").toLowerCase();
  if (name.includes("personal") || name.includes("trainer")) return ROUTINES.personal;
  if (name.includes("cardio")) return ROUTINES.cardio;
  return ROUTINES.strength;
};

const isStructured = (text) => {
  return /\(\d+x/i.test(text) || /\d+\s*mins/i.test(text) || /press|squats|deadlift|curls|extensions|raises|pulldowns|rows|fly/i.test(text);
};

const parseRoutineText = (text) => {
  if (!text) return { exercises: [], finisher: null };

  const finisherIdx = text.toLowerCase().indexOf("finisher:");
  let exercisesStr = text;
  let finisher = null;

  if (finisherIdx !== -1) {
    exercisesStr = text.slice(0, finisherIdx).trim();
    finisher = text.slice(finisherIdx + 9).trim();
    if (exercisesStr.endsWith(".")) {
      exercisesStr = exercisesStr.slice(0, -1);
    }
  }

  const exercises = exercisesStr
    .split(/[,.;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return { exercises, finisher };
};

export default function Workouts() {
  const { user } = useAuth();
  const today = new Date();
  const routine = pickRoutine(user.plan?.name);

  const [activeDayIdx, setActiveDayIdx] = useState(() => {
    const day = today.getDay();
    return day === 0 ? routine.length - 1 : Math.min(day - 1, routine.length - 1);
  });

  const selectedRoutine = routine[activeDayIdx] || routine[0];
  const parsed = parseRoutineText(selectedRoutine.routine);
  const selectedDayOfWeek = today.getDay();
  const isSelectedDayToday = selectedDayOfWeek === (activeDayIdx === 6 ? 0 : activeDayIdx + 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 22 
      } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6"
    >
      {/* Plan Header */}
      <motion.div 
        variants={itemVariants}
        className="glass-panel p-4 sm:p-6 rounded-[16px] border border-(--border-color-hover) space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] text-gym-orange bg-gym-orange/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">Current Training Plan</span>
            <h2 className="font-bold text-xl sm:text-2xl text-(--text-primary) capitalize mt-2 font-mono">{user.plan?.name || "Workout"} Split</h2>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-[10px] text-(--text-muted) uppercase font-semibold font-mono">Plan Rate</p>
            <p className="text-xl font-bold text-(--text-primary) mt-0.5 tabular-nums font-mono">
              ₹{(user.plan?.price || 700).toLocaleString()}{" "}
              <span className="text-xs text-(--text-muted) font-normal font-sans">/ {user.plan?.durationDays || 30} days</span>
            </p>
          </div>
        </div>
        <div className="bg-gym-dark/45 border border-(--border-color) p-4 rounded-[6px]">
          <h4 className="text-xs text-(--text-muted) font-bold uppercase tracking-wider mb-1.5 font-mono">Plan Description</h4>
          <p className="text-sm text-(--text-secondary) leading-relaxed">
            {user.plan?.description || "Your gym training routine configured for general muscle hypertrophy, strength, and structural fitness."}
          </p>
        </div>
      </motion.div>

      {/* Weekly Split */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="font-bold text-base text-(--text-primary) font-mono pl-1">Weekly Training Schedule</h3>

        {/* Mobile Pills Day Selector */}
        <div className="flex md:hidden space-x-1.5 overflow-x-auto pb-2 hide-scrollbar">
          {routine.map((item, idx) => {
            const isSelected = activeDayIdx === idx;
            const dayOfWeek = today.getDay();
            const isToday = dayOfWeek === (idx === 6 ? 0 : idx + 1);
            return (
              <button
                key={item.day}
                onClick={() => setActiveDayIdx(idx)}
                className={`px-3.5 py-2 rounded-[6px] text-[11px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-gym-orange text-white border-gym-orange shadow-md shadow-gym-orange/10"
                    : "bg-gym-dark/45 border-(--border-color) text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                {item.day.split(" ")[0]} {isToday && "•"}
              </button>
            );
          })}
        </div>

        {/* Mobile Single Day Focused View */}
        <div className="md:hidden glass-panel p-4 rounded-[12px] border border-(--border-color-hover) space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-(--border-color)/40">
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-(--text-muted) font-mono">
                {selectedRoutine.day}
              </span>
              <h3 className="font-bold text-sm text-(--text-primary) mt-0.5 font-mono">{selectedRoutine.focus}</h3>
            </div>
            {isSelectedDayToday && (
              <span className="bg-gym-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider shadow-sm font-mono">
                Today
              </span>
            )}
          </div>

          {isStructured(selectedRoutine.routine) ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">Exercises</h4>
                <div className="space-y-2">
                  {parsed.exercises.map((ex, i) => (
                    <motion.label 
                      key={i} 
                      whileHover={{ scale: 1.005 }} 
                      whileTap={{ scale: 0.995 }}
                      className="flex items-start space-x-3 bg-gym-dark/20 border border-(--border-color)/30 p-3.5 rounded-[6px] cursor-pointer transition-all duration-200 hover:bg-gym-dark/30 select-none min-h-[44px]"
                    >
                      <input type="checkbox" className="mt-0.5 h-4.5 w-4.5 rounded border-(--border-color) text-gym-orange focus:ring-gym-orange cursor-pointer" />
                      <span className="text-xs text-(--text-primary) font-medium leading-tight font-mono">{ex}</span>
                    </motion.label>
                  ))}
                </div>
              </div>

              {parsed.finisher && (
                <div className="bg-gym-orange/[0.02] border border-gym-orange/15 rounded-[6px] p-3 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-gym-orange">
                    <Flame className="h-4 w-4" />
                    <h4 className="font-bold text-[10px] uppercase tracking-wider font-mono">Finisher Block</h4>
                  </div>
                  <p className="text-xs text-(--text-secondary) leading-relaxed">{parsed.finisher}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gym-dark/20 border border-(--border-color)/30 p-3.5 rounded-[6px]">
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                {selectedRoutine.routine}
              </p>
            </div>
          )}
        </div>

        {/* Desktop 7-Column Grid view */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-7 gap-3">
          {routine.map((item, idx) => {
            const dayOfWeek = today.getDay();
            const isToday = dayOfWeek === (idx === 6 ? 0 : idx + 1);
            return (
              <div key={item.day} className={`p-3 sm:p-4 rounded-[6px] border transition-all duration-300 ${isToday ? "bg-gym-orange/[0.04] border-gym-orange ring-1 ring-gym-orange/20 shadow-md shadow-gym-orange/5" : "bg-gym-dark/25 hover:bg-gym-dark/40 border-(--border-color) hover:border-(--border-color-hover)"}`}>
                <div className="flex justify-between items-center pb-2.5 border-b border-(--border-color)/40">
                  <span className="font-bold text-xs uppercase tracking-wider text-(--text-muted) font-mono">{item.day}</span>
                  {isToday && <span className="bg-(--text-primary) text-(--bg-canvas) text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider font-mono">Today</span>}
                </div>
                <div className="mt-3">
                  <h4 className={`font-bold text-xs tracking-wide font-mono ${isToday ? "text-gym-orange" : "text-(--text-primary)"}`}>{item.focus}</h4>
                  <p className="text-[11px] text-(--text-secondary) leading-relaxed mt-2 line-clamp-5 hover:line-clamp-none transition-all duration-300">{item.routine}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
