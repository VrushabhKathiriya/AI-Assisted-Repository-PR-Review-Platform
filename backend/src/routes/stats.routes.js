import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getRepoStats,
  getUserStats
} from "../controllers/stats.controller.js";

const router = express.Router();

/* ---------- REPO STATS ---------- */
router.get("/repo/:repoId", verifyJWT, getRepoStats);

/* ---------- USER STATS ---------- */
router.get("/user/me", verifyJWT, getUserStats);

export default router;