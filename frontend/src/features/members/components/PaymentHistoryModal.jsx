import React, { useState, useEffect } from "react";
import { X, Receipt, Calendar, AlertCircle, RefreshCw, CreditCard, Wallet, Landmark, Banknote } from "lucide-react";
import { memberService } from "../services/memberService";

export default function PaymentHistoryModal({ isOpen, onClose, member }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && member) {
      fetchPaymentHistory();
    }
  }, [isOpen, member]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getMemberPayments(member._id);
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load payment transaction history.");
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

  const getMethodIcon = (method) => {
    const norm = (method || "").toLowerCase();
    if (norm === "upi") return Wallet;
    if (norm === "card") return CreditCard;
    if (norm === "bank") return Landmark;
    return Banknote;
  };

  const getMethodBadge = (method) => {
    const Icon = getMethodIcon(method);
    const configs = {
      upi: "text-purple-400 bg-purple-500/10 border-purple-500/15",
      card: "text-blue-400 bg-blue-500/10 border-blue-500/15",
      bank: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
      cash: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    };
    const norm = (method || "").toLowerCase();
    const style = configs[norm] || configs.cash;

    return (
      <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>
        <Icon className="h-3 w-3 shrink-0" />
        <span>{method || "Cash"}</span>
      </span>
    );
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gym-border-hover animate-slide-up my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex justify-between items-center px-6 py-4 border-b border-gym-border shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gym-orange/30 to-transparent"></div>
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center space-x-2">
            <Receipt className="h-4.5 w-4.5 text-gym-orange" />
            <span>Payment History</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gym-text-secondary hover:text-white rounded-lg hover:bg-gym-elevated transition-all duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Member Meta */}
          <div className="p-5 bg-gym-elevated/20 border-b border-gym-border/50 shrink-0">
            <h3 className="font-bold text-base text-slate-800 dark:text-white">{member.name}</h3>
            <p className="text-xs text-gym-text-secondary mt-1">
              Registered Phone: <span className="text-slate-700 dark:text-gray-300 font-medium">{member.phone}</span>
            </p>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 my-auto">
                <RefreshCw className="h-8 w-8 text-gym-orange animate-spin" />
                <p className="text-gym-text-muted text-sm">Loading transaction logs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 my-auto">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchPaymentHistory}
                  className="inline-flex items-center space-x-2 bg-white/[0.04] border border-gym-border hover:bg-gym-elevated text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 my-auto">
                <Receipt className="h-12 w-12 text-gym-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-gym-text-secondary text-sm font-semibold">No payment records found.</p>
                <p className="text-xs text-gym-text-muted mt-1">Renewal logs appear here once recorded.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden sm:block overflow-x-auto border border-gym-border/55 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gym-elevated/50 border-b border-gym-border text-gym-text-muted uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Plan & Term</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gym-border/30 text-gym-text-secondary">
                      {payments.map((p) => (
                        <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-medium tabular-nums">{formatDate(p.paymentDate)}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white tabular-nums">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize font-semibold text-slate-700 dark:text-gray-300">
                              {p.plan?.name || "Member Plan"}
                            </span>
                            <div className="text-[10px] text-gym-text-muted mt-0.5 tabular-nums">
                              {formatDate(p.startDate)} → {formatDate(p.endDate)}
                            </div>
                          </td>
                          <td className="py-3 px-4">{getMethodBadge(p.paymentMethod)}</td>
                          <td className="py-3 px-4 max-w-[150px] truncate" title={p.remarks}>
                            {p.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="sm:hidden space-y-3">
                  {payments.map((p) => (
                    <div key={p._id} className="p-3 border border-gym-border/40 bg-white/[0.01] rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gym-text-muted font-medium tabular-nums">{formatDate(p.paymentDate)}</span>
                        {getMethodBadge(p.paymentMethod)}
                      </div>
                      
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-slate-800 dark:text-white capitalize">
                          {p.plan?.name || "Membership Plan"}
                        </span>
                        <span className="font-bold text-gym-orange text-sm tabular-nums">
                          ₹{p.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[10px] text-gym-text-secondary mt-1 border-t border-gym-border/10 pt-2">
                        <Calendar className="h-3 w-3 text-gym-text-muted" />
                        <span className="tabular-nums">
                          {formatDate(p.startDate)} → {formatDate(p.endDate)}
                        </span>
                      </div>

                      {p.remarks && (
                        <p className="text-[10px] text-gym-text-muted italic border-l-2 border-gym-orange/30 pl-2 mt-1.5">
                          {p.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-gym-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gym-border hover:bg-gym-elevated text-sm font-semibold text-gym-text-secondary hover:text-white transition-all duration-200 cursor-pointer h-10 flex items-center justify-center"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
