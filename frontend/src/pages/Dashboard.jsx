import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  CheckCircle,
  RefreshCw,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { openRenewModal, openAddModal, refreshTrigger } = useApp();

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    due: 0,
    overdue: 0,
    inactive: 0,
    estimatedRevenue: 0,
  });
  const [dueMembers, setDueMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'overdue', 'due'
  const [dueTimeframe, setDueTimeframe] = useState(7); // 0 (today), 3 (3 days), 7 (7 days)

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, dueData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getDueMembers(),
      ]);
      setStats(statsData);
      setDueMembers(dueData);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to fetch dashboard data. Please make sure the server and database are running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysDiff = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const dueCountInTimeframe = dueMembers.filter((m) => {
    const days = getDaysDiff(m.endDate);
    return days >= 0 && days <= dueTimeframe && m.status !== "inactive";
  }).length;

  const filteredMembers = dueMembers.filter((member) => {
    const daysDiff = getDaysDiff(member.endDate);

    if (filterType === "overdue") {
      return daysDiff < 0 && member.status !== "inactive";
    }

    if (filterType === "due") {
      return (
        daysDiff >= 0 &&
        daysDiff <= dueTimeframe &&
        member.status !== "inactive"
      );
    }

    // 'all' includes overdue AND upcoming dues within timeframe
    return (
      (daysDiff < 0 || (daysDiff >= 0 && daysDiff <= dueTimeframe)) &&
      member.status !== "inactive"
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-(--border-color) border-t-(--text-primary)"></div>
        </div>
        <p className="text-(--text-muted) font-mono text-xs uppercase tracking-wider">
          Loading metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 animate-fade-in">
        <div className="glass-card p-8 rounded-[16px] text-center border-red-500/20 bg-black/40">
          <div className="w-12 h-12 bg-red-500/10 rounded-[6px] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-(--text-primary) mb-2 font-mono">
            Connection Lost
          </h3>
          <p className="text-(--text-secondary) text-sm mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center space-x-2 bg-(--text-primary) text-(--bg-canvas) px-4 py-2 rounded-[6px] font-semibold text-xs transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Members",
      value: stats.total,
      icon: Users,
      borderClass: "border-l-zinc-500 dark:border-l-zinc-400",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      borderClass: "border-l-zinc-300 dark:border-l-zinc-200",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      borderClass: "border-l-red-500 dark:border-l-red-500",
      clickable: true,
      filterKey: "overdue",
    },
    {
      label:
        dueTimeframe === 0
          ? "Due Today"
          : dueTimeframe === 3
            ? "Due in 3d"
            : "Due in 7d",
      value: dueCountInTimeframe,
      icon: Clock,
      borderClass: "border-l-amber-500 dark:border-l-amber-500",
      clickable: true,
      filterKey: "due",
    },
    {
      label: "Monthly Rev",
      value: `₹${stats.estimatedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      borderClass: "border-l-zinc-800 dark:border-l-zinc-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div className="animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-2xl text-(--text-primary) tracking-tight">
            Console <span className="text-(--text-secondary) font-normal ml-0.5">Overview</span>
          </h1>
          <p className="text-(--text-secondary) mt-1 text-xs font-mono">
            Gym membership statuses & financial diagnostics dashboard.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-(--text-primary) text-(--bg-canvas) hover:opacity-90 px-4 py-2 rounded-[6px] font-semibold text-xs transition-opacity duration-150 cursor-pointer border border-(--border-color-hover) flex items-center space-x-2"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Register Member</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isSelected = card.clickable && filterType === card.filterKey;

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={
                card.clickable ? () => setFilterType(card.filterKey) : undefined
              }
              className={`glass-card p-4 rounded-[12px] border-l-[3px] ${card.borderClass} ${
                card.clickable
                  ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  : ""
              } ${isSelected ? "ring-1 ring-(--text-primary)/40" : ""} ${
                index === 4 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="p-1.5 rounded-[4px] bg-(--bg-elevated) border border-(--border-color) text-(--text-secondary) shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono truncate">
                    {card.label}
                  </p>
                  <h3 className="text-xl font-bold text-(--text-primary) mt-1 font-mono tracking-tight truncate">
                    {card.value}
                  </h3>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Alert List Area */}
      <div className="glass-panel p-4 sm:p-5 md:p-6 rounded-[16px] space-y-5">
        {/* List Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-(--border-color) pb-4">
          <div className="space-y-1.5">
            <h2 className="font-bold text-base text-(--text-primary) font-mono">
              Membership Dues Tracker
            </h2>
            <p className="text-xs text-(--text-secondary)">
              {filterType === "overdue"
                ? "Memberships that have lapsed and require balance collection."
                : `Active memberships expiring ${dueTimeframe === 0 ? "today" : `within ${dueTimeframe} days`} or overdue.`}
            </p>

            {/* Timeframe selector pills */}
            {filterType !== "overdue" && (
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[10px] text-(--text-muted) font-bold uppercase tracking-wider font-mono">
                  Timeframe:
                </span>
                <div className="flex bg-(--bg-canvas) border border-(--border-color) p-0.5 rounded-[6px]">
                  {[
                    { val: 0, label: "Today" },
                    { val: 3, label: "3 Days" },
                    { val: 7, label: "7 Days" },
                  ].map((tf) => (
                    <button
                      key={tf.val}
                      type="button"
                      onClick={() => setDueTimeframe(tf.val)}
                      className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                        dueTimeframe === tf.val
                          ? "bg-(--text-primary) text-(--bg-canvas) shadow-sm"
                          : "text-(--text-secondary) hover:text-(--text-primary)"
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Filters */}
          <div className="flex bg-(--bg-canvas) border border-(--border-color) p-0.5 rounded-[6px] self-start lg:self-center shrink-0 max-w-full overflow-x-auto">
            {[
              {
                key: "all",
                label: `All Dues (${stats.overdue + dueCountInTimeframe})`,
                labelMobile: `All (${stats.overdue + dueCountInTimeframe})`,
                activeClass: "bg-(--text-primary) text-(--bg-canvas) font-bold",
              },
              {
                key: "overdue",
                label: `Overdue (${stats.overdue})`,
                labelMobile: `Overdue (${stats.overdue})`,
                activeClass:
                  "bg-red-500/10 text-red-500 border border-red-500/20 font-bold",
              },
              {
                key: "due",
                label: `Due (${dueCountInTimeframe})`,
                labelMobile: `Due (${dueCountInTimeframe})`,
                activeClass:
                  "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold",
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1 rounded-[4px] text-xs transition-all duration-150 cursor-pointer shrink-0 ${
                  filterType === f.key
                    ? f.activeClass
                    : "text-(--text-secondary) hover:text-(--text-primary) border border-transparent"
                }`}
              >
                <span className="hidden sm:inline">{f.label}</span>
                <span className="sm:hidden">{f.labelMobile}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert List */}
        <AnimatePresence mode="wait">
          {filteredMembers.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-14"
            >
              <div className="w-12 h-12 border border-(--border-color) rounded-[8px] flex items-center justify-center mx-auto mb-4 text-(--text-secondary)">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-(--text-primary) mb-1 font-mono">
                Diagnostics Clear
              </h3>
              <p className="text-(--text-secondary) text-xs max-w-sm mx-auto mb-6">
                No active billing records are pending or overdue under the current configuration parameters.
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center space-x-2 border border-(--border-color) hover:bg-(--bg-elevated) text-(--text-primary) px-4 py-2 rounded-[6px] font-semibold text-xs transition-colors duration-150 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register Member</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {filteredMembers.map((member, idx) => {
                const daysDiff = getDaysDiff(member.endDate);
                const isOverdue = member.status === "overdue";

                return (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className={`p-4 rounded-[8px] border transition-all duration-200 ${
                      isOverdue
                        ? "bg-red-500/[0.01] border-red-500/20 hover:border-red-500/35 border-l-[3px] border-l-red-500"
                        : "bg-amber-500/[0.01] border-amber-500/20 hover:border-amber-500/35 border-l-[3px] border-l-amber-500"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4">
                      {/* Member Core Info */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div>
                          <h4 className="font-bold text-sm text-(--text-primary) truncate">
                            {member.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`inline-flex items-center space-x-1 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                                isOverdue
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              <span
                                className={`status-dot ${isOverdue ? "status-dot-overdue" : "status-dot-due"}`}
                              ></span>
                              <span>{member.status}</span>
                            </span>
                            <span className="text-[11px] text-(--text-muted) capitalize font-mono">
                              {member.membershipType}
                            </span>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center text-xs text-(--text-secondary) space-x-1.5 font-mono">
                          <Phone className="h-3 w-3 text-(--text-muted)" />
                          <span>{member.phone}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center text-xs text-(--text-secondary) space-x-1.5 font-mono">
                          <Calendar className="h-3 w-3 text-(--text-muted)" />
                          <span>
                            Due:{" "}
                            <strong className="text-(--text-primary)">
                              {formatDate(member.endDate)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Dues Summary & Action */}
                      <div className="flex sm:flex-col justify-between items-end sm:items-stretch sm:min-h-[85px] border-t border-(--border-color)/30 sm:border-none pt-3 sm:pt-0 mt-1 sm:mt-0 ml-0 sm:ml-4 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-(--text-muted) uppercase font-semibold font-mono">
                            Dues Amount
                          </p>
                          <p className="text-base font-bold text-(--text-primary) mt-0.5 font-mono">
                            ₹{member.feeAmount.toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-0 sm:mt-2 text-right">
                          {isOverdue ? (
                            <p className="text-[10px] text-red-400 font-semibold mb-1.5 font-mono">
                              Overdue by {Math.abs(daysDiff)}d
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-400 font-semibold mb-1.5 font-mono">
                              Expires in {daysDiff}d
                            </p>
                          )}

                          <button
                            onClick={() => openRenewModal(member)}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-[4px] transition-colors duration-150 cursor-pointer ${
                              isOverdue
                                ? "bg-red-500 hover:bg-red-400 text-white"
                                : "bg-amber-500 hover:bg-amber-400 text-white"
                            }`}
                          >
                            Renew Dues
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
