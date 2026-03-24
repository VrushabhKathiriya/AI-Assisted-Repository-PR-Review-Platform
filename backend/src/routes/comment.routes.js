import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  addComment,
  getComments,
  editComment,
  deleteComment
} from "../controllers/comment.controller.js";

const router = express.Router();

/* ---------- ADD COMMENT ---------- */
router.post("/:prId/comments", verifyJWT, addComment);

/* ---------- GET COMMENTS ---------- */
router.get("/:prId/comments", verifyJWT, getComments);

/* ---------- EDIT COMMENT ---------- */
router.patch("/comments/:commentId", verifyJWT, editComment);

/* ---------- DELETE COMMENT ---------- */
router.delete("/comments/:commentId", verifyJWT, deleteComment);

export default router;