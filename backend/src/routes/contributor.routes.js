import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  addContributor,
  removeContributor,
  getContributors,
  inviteContributor,
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  cancelInvitation
} from "../controllers/contributor.controller.js";

const router = express.Router();

/* ---------- ADD CONTRIBUTOR ---------- */
router.post("/:repoId/contributors", verifyJWT, addContributor);

/* ---------- INVITE BY USERNAME (sends email) ---------- */
router.post("/:repoId/contributors/invite", verifyJWT, inviteContributor);

/* ---------- ACCEPT INVITATION ---------- */
router.post("/contributors/accept/:token", verifyJWT, acceptInvitation);

/* ---------- DECLINE INVITATION ---------- */
router.post("/contributors/decline/:token", verifyJWT, declineInvitation);

/* ---------- GET PENDING INVITATIONS ---------- */
router.get("/:repoId/contributors/invitations", verifyJWT, getPendingInvitations);

/* ---------- CANCEL INVITATION ---------- */
router.delete("/contributors/invitations/:invitationId", verifyJWT, cancelInvitation);

/* ---------- REMOVE CONTRIBUTOR ---------- */
router.delete("/:repoId/contributors/:userId", verifyJWT, removeContributor);

/* ---------- GET CONTRIBUTORS ---------- */
router.get("/:repoId/contributors", verifyJWT, getContributors);

export default router;