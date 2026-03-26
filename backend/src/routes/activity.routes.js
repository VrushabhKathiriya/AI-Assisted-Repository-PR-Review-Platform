import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getRepoActivity,
  getMyActivity
} from "../controllers/activity.controller.js";

const router = express.Router();

/* ---------- GET REPO ACTIVITY ---------- */
router.get("/repo/:repoId", verifyJWT, getRepoActivity);

/* ---------- GET MY ACTIVITY ---------- */
router.get("/me", verifyJWT, getMyActivity);

export default router;