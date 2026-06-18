"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Filter, RefreshCw } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_ORDER: "🛍️", PAYMENT_SUCCESS: "💳", PAYMENT_FAILED: "❌",
  NEW_CUSTOMER: "👤", LOW_STOCK: "⚠️", REFUND_REQUEST: "↩️",
  CONTACT_FORM: "📬", REVIEW_SUBMITTED: "⭐", WITHDRAWAL_REQUEST: "💰",
  ORDER_CANCELLED: "🚫", SYSTEM: "🔔",
};

const TYPE_COLORS: Record<string, string> = {
  NEW_ORDER: "bg-blue-50", PAYMENT_SUCCESS: "bg-green-50", PAYMENT_FAILED: "bg-red-50",
  NEW_CUSTOMER: "bg-purple-50", LOW_STOCK: "bg-orange-50", REFUND_REQUEST: "bg-yellow-50",
  CONTACT_FORM: "bg-indigo-50", REVIEW_SUBMITTED: "bg-amber-50", WITHDRAWAL_REQUEST: "bg-teal-50",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "30" });
      if (filter === "unread") params.set("unread", "true");
      const res = await axios.get(`/api/admin/notifications?${params}`);
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [page, filter]);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`/api/admin/notifications/${id}`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((p) => Math.max(0, p - 1));
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.post("/api/admin/notifications", { action: "markAllRead" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">{unreadCount} unread · {total} total</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 btn-secondary text-sm">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          <button onClick={fetchNotifications} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All" : "Unread"} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer-line rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors group ${
                  !notif.isRead ? `${TYPE_COLORS[notif.type] || "bg-blue-50/30"}` : ""
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {NOTIFICATION_ICONS[notif.type] || "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${notif.isRead ? "text-gray-700" : "text-gray-900"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        {notif.type && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{notif.type.replace(/_/g, " ")}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notif.isRead && (
                        <button onClick={() => markAsRead(notif.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Mark as read">
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
