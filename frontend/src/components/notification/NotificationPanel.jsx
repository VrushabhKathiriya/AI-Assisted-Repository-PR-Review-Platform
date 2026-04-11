import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useDeleteAllNotifications } from "../../hooks/useNotifications.js";
import Loader from "../common/Loader.jsx";
import Button from "../common/Button.jsx";

const NotificationPanel = () => {
  const { data, isLoading } = useNotifications();
  const { mutate: markOne } = useMarkAsRead();
  const { mutate: markAll } = useMarkAllAsRead();
  const { mutate: deleteOne } = useDeleteNotification();
  const { mutate: deleteAll } = useDeleteAllNotifications();

  const notifications = data?.data?.data || [];

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-gray-100">
            Notifications
          </h2>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => markAll()}>
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteAll()}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            Clear all
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                n.isRead
                  ? "bg-[#161b22] border-[#30363d]"
                  : "bg-blue-500/5 border-blue-500/30"
              }`}
            >
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              <div className="flex gap-1">
                {!n.isRead && (
                  <button
                    onClick={() => markOne(n._id)}
                    className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteOne(n._id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
