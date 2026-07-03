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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--border-color)] border-t-gym-orange"></div>
          <div
            className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-2 border-transparent border-b-gym-orange/30"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <p className="text-[var(--text-muted)] font-medium text-sm">
          Loading fitness metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 animate-fade-in">
        <div className="glass-card p-8 rounded-[16px] text-center border-red-500/20">
          <div className="w-14 h-14 bg-red-500/10 rounded-[16px] flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            Connection Error
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-2 rounded-[6px] font-semibold text-sm transition-all duration-200 border border-red-500/20 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
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
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-400",
      borderClass: "border-l-blue-500",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      bgClass: "bg-emerald-500/10",
      textClass: "text-emerald-400",
      borderClass: "border-l-emerald-500",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      bgClass: "bg-red-500/10",
      textClass: "text-red-400",
      borderClass: "border-l-red-500",
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
      bgClass: "bg-amber-500/10",
      textClass: "text-amber-400",
      borderClass: "border-l-amber-500",
      clickable: true,
      filterKey: "due",
    },
    {
      label: "Monthly Rev",
      value: `₹${stats.estimatedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      bgClass: "bg-emerald-500/10",
      textClass: "text-emerald-400",
      borderClass: "border-l-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div className="animate-fade-in">
        <h1 className="font-bold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
          Admin <span className="gradient-text">Console</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-xs sm:text-sm">
          Quick snapshot of gym membership statuses today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isSelected = card.clickable && filterType === card.filterKey;

          return (
            <div
              key={card.label}
              onClick={
                card.clickable ? () => setFilterType(card.filterKey) : undefined
              }
              className={`glass-card p-3.5 md:p-4 rounded-[16px] border-l-[3px] ${card.borderClass} animate-fade-in stagger-${index + 1} ${
                card.clickable
                  ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  : ""
              } ${isSelected ? "ring-1 ring-gym-orange/30 !border-l-gym-orange" : ""} ${
                index === 4 ? "col-span-2 lg:col-span-1" : ""
              }`}
              style={{ animationFillMode: "both" }}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-[6px] ${card.bgClass} ${card.textClass} shrink-0`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider truncate">
                    {card.label}
                  </p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums truncate">
                    {card.value}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Alert List Area */}
      <div
        className="glass-panel p-4 sm:p-5 md:p-6 rounded-[16px] space-y-5 animate-fade-in"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        {/* List Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="space-y-1.5">
            <h2 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">
              Membership Dues Tracker
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {filterType === "overdue"
                ? "Showing memberships that have already expired."
                : `Showing memberships expiring ${dueTimeframe === 0 ? "today" : `within ${dueTimeframe} days`} or overdue.`}
            </p>

            {/* Timeframe sub-selector pills */}
            {filterType !== "overdue" && (
              <div className="flex items-center space-x-2 pt-1 animate-fade-in">
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  Timeframe:
                </span>
                <div className="flex bg-[var(--bg-canvas)]/50 border border-[var(--border-color)]/50 p-0.5 rounded-[6px]">
                  {[
                    { val: 0, label: "Today" },
                    { val: 3, label: "3 Days" },
                    { val: 7, label: "7 Days" },
                  ].map((tf) => (
                    <button
                      key={tf.val}
                      type="button"
                      onClick={() => setDueTimeframe(tf.val)}
                      className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-[4px] text-[10px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                        dueTimeframe === tf.val
                          ? "bg-gym-orange text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
          <div className="flex bg-[var(--bg-canvas)]/60 border border-[var(--border-color)] p-1 rounded-[6px] self-start lg:self-center shrink-0 max-w-full overflow-x-auto">
            {[
              {
                key: "all",
                label: `All Dues (${stats.overdue + dueCountInTimeframe})`,
                labelMobile: `All (${stats.overdue + dueCountInTimeframe})`,
                activeClass: "bg-gym-orange text-white shadow-sm",
              },
              {
                key: "overdue",
                label: `Overdue (${stats.overdue})`,
                labelMobile: `Overdue (${stats.overdue})`,
                activeClass:
                  "bg-red-500/15 text-red-400 border border-red-500/20",
              },
              {
                key: "due",
                label: `Due (${dueCountInTimeframe})`,
                labelMobile: `Due (${dueCountInTimeframe})`,
                activeClass:
                  "bg-amber-500/15 text-amber-400 border border-amber-500/20",
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                  filterType === f.key
                    ? f.activeClass
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                }`}
              >
                <span className="hidden sm:inline">{f.label}</span>
                <span className="sm:hidden">{f.labelMobile}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert List */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-14 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-[16px] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
              All Clear
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto mb-6">
              No members are currently overdue or have fees due within the
              selected timeframe.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 bg-gym-orange/10 hover:bg-gym-orange/20 text-gym-orange border border-gym-orange/20 px-5 py-2 rounded-[6px] font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register New Member</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMembers.map((member, idx) => {
              const daysDiff = getDaysDiff(member.endDate);
              const isOverdue = member.status === "overdue";

              return (
                <div
                  key={member._id}
                  className={`p-4 rounded-[12px] border-l-[3px] transition-all duration-300 animate-fade-in ${
                    isOverdue
                      ? "bg-red-500/[0.03] border border-red-500/10 hover:border-red-500/25 border-l-red-500"
                      : "bg-amber-500/[0.03] border border-amber-500/10 hover:border-amber-500/25 border-l-amber-500"
                  }`}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4">
                    {/* Member Core Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                          {member.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center space-x-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                              isOverdue
                                ? "bg-red-500/15 text-red-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            <span
                              className={`status-dot ${isOverdue ? "status-dot-overdue" : "status-dot-due"}`}
                            ></span>
                            <span>{member.status}</span>
                          </span>
                          <span className="text-xs text-[var(--text-muted)] capitalize">
                            {member.membershipType}
                          </span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center text-xs text-[var(--text-secondary)] space-x-1.5">
                        <Phone className="h-3 w-3 text-[var(--text-muted)]" />
                        <span>{member.phone}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center text-xs text-[var(--text-secondary)] space-x-1.5">
                        <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                        <span>
                          Due:{" "}
                          <strong className="text-[var(--text-primary)]">
                            {formatDate(member.endDate)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Dues Summary & Action */}
                    <div className="flex sm:flex-col justify-between items-end sm:items-stretch sm:min-h-[90px] border-t border-[var(--border-color)]/30 sm:border-none pt-3 sm:pt-0 mt-1 sm:mt-0 ml-0 sm:ml-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">
                          Amount
                        </p>
                        <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
                          ₹{member.feeAmount.toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-0 sm:mt-3 text-right">
                        {isOverdue ? (
                          <p className="text-[11px] text-red-400 font-semibold mb-1.5 sm:mb-2">
                            Overdue by {Math.abs(daysDiff)}d
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-400 font-semibold mb-1.5 sm:mb-2">
                            Expires in {daysDiff}d
                          </p>
                        )}

                        <button
                          onClick={() => openRenewModal(member)}
                          className={`text-xs font-bold px-4 py-1.5 rounded-[6px] transition-all duration-200 cursor-pointer ${
                            isOverdue
                              ? "bg-red-500 hover:bg-red-400 text-white shadow-sm shadow-red-500/20"
                              : "bg-amber-500 hover:bg-amber-400 text-white shadow-sm shadow-amber-500/20"
                          }`}
                        >
                          Renew
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
