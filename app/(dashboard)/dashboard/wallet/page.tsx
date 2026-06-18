"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Plus } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", method: "BANK_TRANSFER", accountNumber: "", ifsc: "", bankName: "", upiId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        axios.get("/api/wallet"),
        axios.get(`/api/wallet/transactions?page=${page}&limit=15`),
      ]);
      setWallet(walletRes.data.data);
      setTransactions(txRes.data.data?.transactions || []);
      setTotal(txRes.data.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(withdrawForm.amount) < 100) { toast.error("Minimum withdrawal is ₹100"); return; }
    if (Number(withdrawForm.amount) > Number(wallet?.balance)) { toast.error("Insufficient balance"); return; }

    setSubmitting(true);
    try {
      const accountDetails = withdrawForm.method === "UPI"
        ? { upiId: withdrawForm.upiId }
        : { accountNumber: withdrawForm.accountNumber, ifsc: withdrawForm.ifsc, bankName: withdrawForm.bankName };

      await axios.post("/api/withdrawals", {
        amount: Number(withdrawForm.amount),
        method: withdrawForm.method,
        accountDetails,
      });

      toast.success("Withdrawal request submitted successfully");
      setShowWithdraw(false);
      setWithdrawForm({ amount: "", method: "BANK_TRANSFER", accountNumber: "", ifsc: "", bankName: "", upiId: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-40 shimmer-line rounded-2xl" />
      <div className="h-64 shimmer-line rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your wallet balance and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Balance</p>
            <p className="text-4xl font-bold mt-1">₹{Number(wallet?.balance || 0).toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/20">
          <div>
            <p className="text-gray-400 text-xs">Total Credits</p>
            <p className="font-semibold mt-0.5">₹{Number(wallet?.totalCredits || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Total Debits</p>
            <p className="font-semibold mt-0.5">₹{Number(wallet?.totalDebits || 0).toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          className="mt-4 w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Request Withdrawal
        </button>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Request Withdrawal</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                <input
                  type="number" min="100" step="1"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  placeholder="Minimum ₹100"
                  className="input-field w-full" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
                <select
                  value={withdrawForm.method}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, method: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              {withdrawForm.method === "BANK_TRANSFER" ? (
                <>
                  <input type="text" placeholder="Account Number" value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="input-field w-full" required />
                  <input type="text" placeholder="IFSC Code" value={withdrawForm.ifsc}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, ifsc: e.target.value })}
                    className="input-field w-full" required />
                  <input type="text" placeholder="Bank Name" value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="input-field w-full" required />
                </>
              ) : (
                <input type="text" placeholder="UPI ID (e.g. name@upi)" value={withdrawForm.upiId}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                  className="input-field w-full" required />
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary">{submitting ? "Submitting..." : "Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === "CREDIT" ? "bg-green-50" : "bg-red-50"
                }`}>
                  {tx.type === "CREDIT" ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Bal: ₹{Number(tx.balance).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {total > 15 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">{transactions.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
