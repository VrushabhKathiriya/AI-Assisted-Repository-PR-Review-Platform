import { Notification } from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= GET MY NOTIFICATIONS ================= */
export const getNotifications = asyncHandler(async (req, res) => {

  const notifications = await Notification.find({
    recipient: req.user._id
  })
    .populate("sender", "username email")
    .populate("repository", "name")
    .populate("pullRequest", "message status")
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
        total: notifications.length
      },
      "Notifications fetched successfully"
    )
  );
});

/* ================= MARK ONE AS READ ================= */
export const markAsRead = asyncHandler(async (req, res) => {

  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  /* ---------- OWNERSHIP CHECK ---------- */
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot mark someone else's notification");
  }

  notification.isRead = true;
  await notification.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification marked as read"
    )
  );
});

/* ================= MARK ALL AS READ ================= */
export const markAllAsRead = asyncHandler(async (req, res) => {

  await Notification.updateMany(
    {
      recipient: req.user._id,
      isRead: false
    },
    { isRead: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "All notifications marked as read"
    )
  );
});

/* ================= DELETE ONE NOTIFICATION ================= */
export const deleteNotification = asyncHandler(async (req, res) => {

  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  /* ---------- OWNERSHIP CHECK ---------- */
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot delete someone else's notification");
  }

  await notification.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Notification deleted successfully"
    )
  );
});

/* ================= DELETE ALL NOTIFICATIONS ================= */
export const deleteAllNotifications = asyncHandler(async (req, res) => {

  await Notification.deleteMany({
    recipient: req.user._id
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "All notifications deleted successfully"
    )
  );
});

/* ================= GET UNREAD COUNT ================= */
export const getUnreadCount = asyncHandler(async (req, res) => {

  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { unreadCount: count },
      "Unread count fetched successfully"
    )
  );
});