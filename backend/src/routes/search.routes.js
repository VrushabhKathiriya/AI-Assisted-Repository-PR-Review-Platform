import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  searchRepositories,
  searchUsers,
  searchFiles,
  searchPullRequests,
  globalSearch
} from "../controllers/search.controller.js";

const router = express.Router();

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