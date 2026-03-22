import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import {
  createFile,
  getFilesByRepository,
  getFileById,
  updateFile,
  deleteFile
} from "../controllers/file.controller.js";

const router = express.Router();

/* ---------- SPECIFIC ROUTES FIRST ---------- */
router.get("/file/:fileId", verifyJWT, getFileById);
router.patch("/file/:fileId", verifyJWT, updateFile);
router.delete("/file/:fileId", verifyJWT, deleteFile);

/* ---------- GENERIC ROUTES LAST ---------- */
router.post("/:repoId", verifyJWT, createFile);
router.get("/:repoId", verifyJWT, getFilesByRepository);

export default router;