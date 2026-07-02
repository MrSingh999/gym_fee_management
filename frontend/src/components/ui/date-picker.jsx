import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, required }) {
  const [open, setOpen] = useState(false);

  // Convert YYYY-MM-DD string to Date object
  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (date) => {
    if (date) {
      // Convert Date object back to YYYY-MM-DD string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full bg-white/[0.04] border border-gym-border rounded-xl px-4 py-3 text-base text-left cursor-pointer transition-all duration-200 flex items-center justify-between",
          "hover:border-gym-border-hover",
          "focus:outline-none focus:border-gym-orange focus:ring-0",
          value ? "text-slate-800 dark:text-white" : "text-gym-text-muted",
          className
        )}
      >
        <span>{formatDisplayDate(value) || placeholder}</span>
        <CalendarIcon className="h-4 w-4 text-gym-text-muted shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 bg-gym-card backdrop-blur-xl border border-gym-border-hover rounded-xl shadow-2xl"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          startMonth={new Date(1920, 0)}
          endMonth={new Date(2050, 11)}
          className="rounded-xl"
        />
      </PopoverContent>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value || ""}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </Popover>
  );
}
