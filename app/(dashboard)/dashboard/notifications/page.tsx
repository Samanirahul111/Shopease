"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, Package, CreditCard, Tag, Info } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const typeIcons: Record<string, typeof Bell> = {
  ORDER: Package, PAYMENT: CreditCard, PROMOTION: Tag, WITHDRAWAL: CreditCard, DEFAULT: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/user/notifications");
      setNotifications(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    try {
      await axios.put(`/api/user/notifications/${id}`, { isRead: true });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error("Failed to mark as read"); }
  };

  const markAllRead = async () => {
    try {
      await axios.put("/api/user/notifications", { markAllRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all read"); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/user/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} unread of {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition capitalize ${filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
            {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer-line rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-600">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((notif) => {
              const Icon = typeIcons[notif.type] || typeIcons.DEFAULT;
              return (
                <div key={notif.id} className={`flex gap-4 p-4 transition ${!notif.isRead ? "bg-blue-50/30" : ""}`}>
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${!notif.isRead ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Icon className={`w-5 h-5 ${!notif.isRead ? "text-blue-600" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!notif.isRead ? "text-gray-900" : "text-gray-700"}`}>{notif.title}</p>
                      {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString("en-IN")}</p>
                    {notif.link && (
                      <Link href={notif.link} className="text-xs text-blue-600 hover:underline mt-1 inline-block">View details</Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notif.isRead && (
                      <button onClick={() => markRead(notif.id)} className="p-1.5 hover:bg-blue-100 rounded-lg transition" title="Mark as read">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(notif.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
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
