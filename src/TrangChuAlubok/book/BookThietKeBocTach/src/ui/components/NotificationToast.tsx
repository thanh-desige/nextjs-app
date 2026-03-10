/**
 * NotificationToast - Component hiển thị thông báo cho người dùng
 * Sử dụng với uiStore để quản lý notifications
 */

import React, { useEffect } from "react";
import { useUIStore } from "../../store/uiStore";

interface NotificationItemProps {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  onClose,
}) => {
  // Colors based on type
  const colors = {
    info: {
      bg: "bg-blue-600",
      border: "border-blue-400",
      icon: "ℹ️",
    },
    success: {
      bg: "bg-green-600",
      border: "border-green-400",
      icon: "✓",
    },
    warning: {
      bg: "bg-yellow-600",
      border: "border-yellow-400",
      icon: "⚠️",
    },
    error: {
      bg: "bg-red-600",
      border: "border-red-400",
      icon: "✕",
    },
  };

  const style = colors[type];

  return (
    <div
      className={`${style.bg} ${style.border} border-l-4 rounded-md shadow-lg p-3 mb-2 min-w-[280px] max-w-[400px] animate-slide-in`}
      style={{
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="text-white text-sm">{style.icon}</span>
          <div>
            <p className="text-white font-semibold text-sm">{title}</p>
            {message && <p className="text-white/80 text-xs mt-1">{message}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white ml-2 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC = () => {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  // Auto-remove notifications after duration
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <>
      {/* CSS for animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Notification container - fixed position at top-right */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col items-end"
        style={{ pointerEvents: "auto" }}
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </>
  );
};

export default NotificationToast;
