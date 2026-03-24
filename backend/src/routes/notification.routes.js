import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} from "../controllers/notification.controller.js";

const router = express.Router();

/* ---------- GET ALL NOTIFICATIONS ---------- */
router.get("/", verifyJWT, getNotifications);

/* ---------- GET UNREAD COUNT ---------- */
router.get("/unread-count", verifyJWT, getUnreadCount);

/* ---------- MARK ONE AS READ ---------- */
router.patch("/:notificationId/read", verifyJWT, markAsRead);

/* ---------- MARK ALL AS READ ---------- */
router.patch("/read-all", verifyJWT, markAllAsRead);

/* ---------- DELETE ONE ---------- */
router.delete("/:notificationId", verifyJWT, deleteNotification);

/* ---------- DELETE ALL ---------- */
router.delete("/", verifyJWT, deleteAllNotifications);

export default router;