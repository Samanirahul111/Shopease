"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, ExternalLink, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/components/providers/SocketProvider";
import Link from "next/link";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const notificationIcons: Record<string, string> = {
  NEW_ORDER: "🛍️",
  PAYMENT_SUCCESS: "💳",
  PAYMENT_FAILED: "❌",
  NEW_CUSTOMER: "👤",
  LOW_STOCK: "⚠️",
  REFUND_REQUEST: "↩️",
  CONTACT_FORM: "📬",
  REVIEW_SUBMITTED: "⭐",
  WITHDRAWAL_REQUEST: "💰",
  ORDER_CANCELLED: "🚫",
  SYSTEM: "🔔",
};

const notificationColors: Record<string, string> = {
  NEW_ORDER: "bg-blue-50 text-blue-700",
  PAYMENT_SUCCESS: "bg-green-50 text-green-700",
  PAYMENT_FAILED: "bg-red-50 text-red-700",
  NEW_CUSTOMER: "bg-purple-50 text-purple-700",
  LOW_STOCK: "bg-orange-50 text-orange-700",
  REFUND_REQUEST: "bg-yellow-50 text-yellow-700",
  CONTACT_FORM: "bg-indigo-50 text-indigo-700",
  REVIEW_SUBMITTED: "bg-amber-50 text-amber-700",
  WITHDRAWAL_REQUEST: "bg-teal-50 text-teal-700",
};

export default function AdminNotificationBell() {
  const { adminNotifications, unreadCount, markAsRead, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [dbUnread, setDbUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) fetchFromDB();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFromDB = async () => {
    try {
      const res = await axios.get("/api/admin/notifications?limit=20");
      setDbNotifications(res.data.data?.notifications || []);
      setDbUnread(res.data.data?.unreadCount || 0);
    } catch {}
  };

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await axios.put(`/api/admin/notifications/${id}`);
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setDbUnread((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post("/api/admin/notifications", { action: "markAllRead" });
      setDbNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setDbUnread(0);
      clearNotifications();
    } catch {}
  };

  const totalUnread = Math.max(dbUnread, unreadCount);

  // Merge live + db notifications (deduplicate by ID)
  const allNotifications = [
    ...adminNotifications.filter((n) => !dbNotifications.find((d: any) => d.id === n.id)),
    ...dbNotifications,
  ].slice(0, 20);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="notification-badge absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-700" />
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    {totalUnread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                allNotifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${
                      notificationColors[notif.type] || "bg-gray-100 text-gray-700"
                    }`}>
                      {notificationIcons[notif.type] || "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${notif.isRead ? "text-gray-700" : "text-gray-900"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
              >
                View All Notifications <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
