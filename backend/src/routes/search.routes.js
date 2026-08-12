import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  searchRepositories,
  searchUsers,
  searchFiles,
  searchPullRequests,
  globalSearch,
  searchSuggestions
} from "../controllers/search.controller.js";

//import { searchRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { searchSlidingRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

/* ---------- AUTOCOMPLETE SUGGESTIONS ---------- */
//router.get("/suggestions", verifyJWT, searchRateLimiter, searchSuggestions);
router.get("/suggestions", verifyJWT, searchSlidingRateLimiter, searchSuggestions);

/* ---------- GLOBAL SEARCH ---------- */
router.get("/", verifyJWT, globalSearch);

/* ---------- SEARCH REPOS ---------- */
router.get("/repos", verifyJWT, searchRepositories);

/* ---------- SEARCH USERS ---------- */
router.get("/users", verifyJWT, searchUsers);

/* ---------- SEARCH FILES ---------- */
router.get("/files", verifyJWT, searchFiles);

/* ---------- SEARCH PRs ---------- */
router.get("/prs", verifyJWT, searchPullRequests);

export default router;