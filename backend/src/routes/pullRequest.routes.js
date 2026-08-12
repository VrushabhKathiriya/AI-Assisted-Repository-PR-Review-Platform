import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import {
  createPullRequest,
  reviewPullRequest,
  getPullRequests
} from "../controllers/pullRequest.controller.js";

import { aiReviewSlidingRateLimiter } from "../middlewares/rateLimit.middleware.js"

const router = express.Router();

/* ---------- CREATE PR ---------- */
router.post("/file/:fileId", verifyJWT, aiReviewSlidingRateLimiter,createPullRequest);

/* ---------- REVIEW PR ---------- */
router.patch("/:prId/review", verifyJWT, reviewPullRequest);

/* ---------- GET PRs BY REPO ---------- */
router.get("/repo/:repoId", verifyJWT, getPullRequests);

export default router;