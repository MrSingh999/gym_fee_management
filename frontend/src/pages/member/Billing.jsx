import { useState, useEffect } from "react";
import { CreditCard, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { memberService } from "@/services/memberService";
import { formatDate } from "@/lib/memberHelpers";

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

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-[16px] border border-(--border-color-hover) space-y-4 sm:space-y-6 animate-fade-in">
      <div className="border-b border-(--border-color) pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-(--text-primary)">Billing History</h3>
          <p className="text-xs text-(--text-secondary)">Overview of all subscription invoices and renewals.</p>
        </div>
        <div className="p-2.5 bg-gym-dark/50 border border-(--border-color) rounded-[6px]">
          <CreditCard className="h-5 w-5 text-gym-orange" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 border-2 border-(--border-color) border-t-gym-orange animate-spin mx-auto" />
          <p className="text-xs text-(--text-muted) mt-3">Loading billing data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400 text-xs">{error}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-10 text-(--text-muted) text-xs">No payment invoices found.</div>
      ) : (
        <>
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
                {payments.map((p) => (
                  <tr key={p._id} className="table-row-hover hover:bg-(--bg-elevated)/20 text-(--text-secondary)">
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
          <div className="sm:hidden space-y-3">
            {payments.map((p) => (
              <div key={p._id} className="p-3 border border-(--border-color)/40 bg-white/[0.01] rounded-[8px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-(--text-muted) font-medium font-mono">{formatDate(p.paymentDate || p.createdAt)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gym-dark/50 border border-(--border-color) text-[9px] font-semibold uppercase tracking-wide font-mono">{p.paymentMethod || "Cash"}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-(--text-primary) capitalize truncate">{p.plan?.name || "Workout"}</span>
                  <span className="font-bold text-gym-orange text-sm tabular-nums shrink-0 font-mono">₹{p.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-(--text-secondary) mt-1 border-t border-(--border-color)/10 pt-2 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />
                  <span>{formatDate(p.startDate)} — {formatDate(p.endDate)}</span>
                </div>
                {p.remarks && <p className="text-[10px] text-(--text-muted) italic border-l-2 border-(--border-color-hover) pl-2 mt-1.5 font-mono">{p.remarks}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
