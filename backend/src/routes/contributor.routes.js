import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  addContributor,
  removeContributor,
  getContributors
} from "../controllers/contributor.controller.js";

const router = express.Router();

/* ---------- ADD CONTRIBUTOR ---------- */
router.post("/:repoId/contributors", verifyJWT, addContributor);

/* ---------- REMOVE CONTRIBUTOR ---------- */
router.delete("/:repoId/contributors/:userId", verifyJWT, removeContributor);

/* ---------- GET CONTRIBUTORS ---------- */
router.get("/:repoId/contributors", verifyJWT, getContributors);

export default router;