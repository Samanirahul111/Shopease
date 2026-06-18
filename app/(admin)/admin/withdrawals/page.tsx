"use client";

import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Withdrawal {
  id: string; userId: string; amount: number; status: string;
  method: string; accountDetails: any; notes?: string; adminNotes?: string;
  processedAt?: string; transactionRef?: string; createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" },
  PROCESSING: { color: "bg-blue-100 text-blue-700", icon: Clock, label: "Processing" },
  COMPLETED: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Completed" },
  REJECTED: { color: "bg-red-100 text-red-700", icon: XCircle, label: "Rejected" },
  ON_HOLD: { color: "bg-orange-100 text-orange-700", icon: AlertTriangle, label: "On Hold" },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/withdrawals");
      setWithdrawals(res.data.data?.withdrawals || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const updateWithdrawal = async (id: string, status: string) => {
    setProcessing(id);
    try {
      await axios.put(`/api/admin/withdrawals/${id}`, {
        status,
        adminNotes: adminNotes || undefined,
        transactionRef: transactionRef || undefined,
      });
      toast.success(`Withdrawal ${status.toLowerCase()}`);
      setSelectedId(null);
      setAdminNotes("");
      setTransactionRef("");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 text-sm">{pendingCount} pending · {withdrawals.length} total</p>
        </div>
        <button onClick={fetchWithdrawals} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {pendingCount} withdrawal request(s) need your attention
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer-line rounded-xl" />)}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-16 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No withdrawal requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {withdrawals.map((w) => {
              const config = STATUS_CONFIG[w.status] || STATUS_CONFIG.PENDING;
              const Icon = config.icon;
              const isSelected = selectedId === w.id;

              return (
                <div key={w.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-900">₹{Number(w.amount).toFixed(2)}</p>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                            {w.method.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                          {w.method === "UPI" && w.accountDetails?.upiId && (
                            <p>UPI: <span className="font-mono font-medium">{w.accountDetails.upiId}</span></p>
                          )}
                          {w.method === "BANK_TRANSFER" && (
                            <p>
                              {w.accountDetails?.bankName} — ****{String(w.accountDetails?.accountNumber || "").slice(-4)}
                              {w.accountDetails?.ifsc && ` (${w.accountDetails.ifsc})`}
                            </p>
                          )}
                          <p className="text-gray-400">{formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</p>
                        </div>
                        {w.transactionRef && (
                          <p className="text-xs text-green-700 mt-1 font-medium">Ref: {w.transactionRef}</p>
                        )}
                        {w.adminNotes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{w.adminNotes}</p>
                        )}
                      </div>
                    </div>

                    {w.status === "PENDING" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setSelectedId(isSelected ? null : w.id)}
                          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {isSelected ? "Cancel" : "Process"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Processing Form */}
                  {isSelected && w.status === "PENDING" && (
                    <div className="mt-4 pl-14 border-t border-gray-100 pt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Reference</label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="UTR number / transaction ID"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes</label>
                        <input
                          type="text"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal notes..."
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateWithdrawal(w.id, "COMPLETED")}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve & Complete
                        </button>
                        <button
                          onClick={() => updateWithdrawal(w.id, "REJECTED")}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => updateWithdrawal(w.id, "ON_HOLD")}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-200 disabled:opacity-50"
                        >
                          <AlertTriangle className="w-4 h-4" /> Hold
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
