"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  adminNotifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  adminNotifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearNotifications: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? document.cookie.split("; ").find((c) => c.startsWith("auth-token="))?.split("=")[1]
      : null;

    const socketUrl =
      (typeof window !== "undefined" ? window.location.origin : undefined) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:8080";

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Auto-join admin room for admin sessions
      const isAdmin = typeof window !== "undefined"
        ? localStorage.getItem("isAdmin") === "true"
        : false;
      if (isAdmin) {
        socketInstance.emit("admin:join", { isAdmin: true });
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("admin:notification", (notification: Notification) => {
      setAdminNotifications((prev) => [notification, ...prev].slice(0, 50));

      // Show toast
      const icons: Record<string, string> = {
        NEW_ORDER: "🛍️",
        PAYMENT_SUCCESS: "💳",
        PAYMENT_FAILED: "❌",
        NEW_CUSTOMER: "👤",
        LOW_STOCK: "⚠️",
        REFUND_REQUEST: "↩️",
        CONTACT_FORM: "📬",
        REVIEW_SUBMITTED: "⭐",
        WITHDRAWAL_REQUEST: "💰",
      };

      toast(
        <div>
          <p className="font-semibold text-sm">
            {icons[notification.type] || "🔔"} {notification.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
        </div>,
        {
          duration: 6000,
          style: { background: "#1f2937", color: "#fff", maxWidth: "380px" },
        }
      );
    });

    socketInstance.on("user:notification", (notification: Notification) => {
      toast(
        <div>
          <p className="font-semibold text-sm">🔔 {notification.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
        </div>,
        { duration: 5000 }
      );
    });

    setSocket(socketInstance);
    socketRef.current = socketInstance;

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const markAsRead = (id: string) => {
    setAdminNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearNotifications = () => setAdminNotifications([]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, adminNotifications, unreadCount, markAsRead, clearNotifications }}
    >
      {children}
    </SocketContext.Provider>
  );
}
