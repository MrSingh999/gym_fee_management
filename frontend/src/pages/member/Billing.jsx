import { useState, useEffect } from "react";
import { CreditCard, Calendar, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { memberService } from "@/services/memberService";
import { formatDate } from "@/lib/memberHelpers";
import { motion } from "framer-motion";

export default function Billing() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      const memberId = user?.id || user?._id;
      if (!memberId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await memberService.getMemberPayments(memberId);
        setPayments(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load payment history.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

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
      className="glass-panel p-4 sm:p-6 rounded-[16px] border border-(--border-color-hover) space-y-4 sm:space-y-6"
    >
      <motion.div variants={itemVariants} className="border-b border-(--border-color) pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-(--text-primary) font-mono">Billing History</h3>
          <p className="text-xs text-(--text-secondary)">Overview of all subscription invoices and renewals.</p>
        </div>
        <div className="p-2.5 bg-gym-dark/50 border border-(--border-color) rounded-[6px]">
          <CreditCard className="h-5 w-5 text-gym-orange" />
        </div>
      </motion.div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-(--border-color) border-t-(--text-primary)"></div>
          </div>
          <p className="text-(--text-muted) font-mono text-xs uppercase tracking-wider">
            Loading billing data...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-14">
          <div className="w-12 h-12 bg-red-500/10 rounded-[16px] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-red-400 text-sm mb-4 font-mono">{error}</p>
        </div>
      ) : payments.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-14">
          <div className="w-12 h-12 border border-(--border-color) rounded-[8px] flex items-center justify-center mx-auto mb-4 text-(--text-secondary)">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-(--text-primary) mb-1 font-mono">
            Billing Clear
          </h3>
          <p className="text-(--text-secondary) text-xs max-w-sm mx-auto font-mono">
            No subscription invoices or pending billing details were found for your account.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-[6px] border border-(--border-color) bg-gym-dark/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-(--bg-elevated) border-b border-(--border-color) text-(--text-muted) text-[10px] uppercase tracking-wider font-bold font-mono">
                  <th className="p-4">Paid On</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-color)/30">
                {payments.map((p, idx) => (
                  <tr key={p._id || idx} className="table-row-hover hover:bg-(--bg-elevated)/20 text-(--text-secondary)">
                    <td className="p-4 font-semibold text-(--text-primary) font-mono">{formatDate(p.paymentDate || p.createdAt)}</td>
                    <td className="p-4 capitalize font-mono">{p.plan?.name || "Workout"}</td>
                    <td className="p-4 font-mono">{formatDate(p.startDate)} — {formatDate(p.endDate)}</td>
                    <td className="p-4 font-bold text-(--text-primary) font-mono tabular-nums">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gym-dark/50 border border-(--border-color) text-[10px] font-semibold uppercase tracking-wide font-mono">{p.paymentMethod || "Cash"}</span>
                    </td>
                    <td className="p-4 max-w-[200px] truncate font-mono" title={p.remarks}>{p.remarks || "Standard Renewal"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3.5">
            {payments.map((p, idx) => (
              <div key={p._id || idx} className="p-4 border border-(--border-color)/60 bg-gym-dark/25 rounded-[12px] space-y-3 text-xs shadow-sm hover:border-(--border-color-hover) transition-all duration-200">
                <div className="flex items-center justify-between border-b border-(--border-color)/30 pb-2.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">Payment Date</span>
                    <span className="text-(--text-primary) font-semibold font-mono mt-0.5">{formatDate(p.paymentDate || p.createdAt)}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.75 rounded-[4px] bg-gym-dark/60 border border-(--border-color) text-[9px] font-bold uppercase tracking-wider text-(--text-secondary) font-mono">{p.paymentMethod || "Cash"}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">Training Plan</span>
                    <span className="font-bold text-(--text-primary) capitalize truncate mt-0.5 font-mono">{p.plan?.name || "Workout"}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">Amount Paid</span>
                    <span className="font-black text-gym-orange text-sm tabular-nums mt-0.5 font-mono">₹{p.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-1 bg-gym-dark/40 border border-(--border-color)/20 p-2.5 rounded-[6px] font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">Billing Cycle</span>
                  <div className="flex items-center space-x-1.5 text-[10px] text-(--text-secondary) mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />
                    <span>{formatDate(p.startDate)} — {formatDate(p.endDate)}</span>
                  </div>
                </div>

                {p.remarks && (
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-(--text-muted) font-mono">Remarks</span>
                    <p className="text-[10px] text-(--text-muted) italic border-l-2 border-gym-orange/30 pl-2 mt-0.5 font-mono">{p.remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
