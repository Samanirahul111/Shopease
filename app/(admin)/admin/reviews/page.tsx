"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle, XCircle, Eye } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchReviews = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), status: filter });
    axios.get(`/api/admin/reviews?${params}`)
      .then((res) => { setReviews(res.data.data?.reviews || []); setTotal(res.data.data?.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [page, filter]);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await axios.put(`/api/admin/reviews/${id}`, { status });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Review ${status.toLowerCase()}`);
    } catch { toast.error("Failed to update review"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Moderate customer product reviews</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition capitalize ${filter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer-line rounded-xl" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center">
            <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No {filter.toLowerCase()} reviews</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    {review.title && <p className="font-semibold text-gray-900 text-sm">{review.title}</p>}
                    {review.content && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{review.content}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>By: <span className="font-medium text-gray-700">{review.user?.name || "Unknown"}</span></span>
                      {review.product && (
                        <span>Product: <span className="font-medium text-gray-700">{review.product.name}</span></span>
                      )}
                      {review.isVerified && (
                        <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Verified Purchase</span>
                      )}
                    </div>
                  </div>
                  {filter === "PENDING" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => updateStatus(review.id, "APPROVED")}
                        className="flex items-center gap-1.5 text-sm text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 transition">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => updateStatus(review.id, "REJECTED")}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {total > limit && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">{reviews.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
