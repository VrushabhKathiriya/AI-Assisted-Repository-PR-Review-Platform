import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";

import {
  createRepository,
  getRepositories,
  getRepositoryById,
  updateRepository,
  deleteRepository,
  getRepositoryRules
} from "../controllers/repository.controller.js";

const router = express.Router();

/* ---------- CREATE REPOSITORY ---------- */

router.post("/", verifyJWT, createRepository);

/* ---------- GET ALL REPOSITORIES ---------- */

router.get("/", verifyJWT, getRepositories);

/* ---------- GET SINGLE REPOSITORY ---------- */

router.get("/:repoId", verifyJWT, getRepositoryById);

/* ---------- UPDATE REPOSITORY ---------- */

router.patch("/:repoId", verifyJWT, updateRepository);

/* ---------- DELETE REPOSITORY ---------- */

router.delete("/:repoId", verifyJWT, deleteRepository);

/* ---------- GET REPO RULES ---------- */

router.get("/:repoId/rules", verifyJWT, getRepositoryRules);

export default router;