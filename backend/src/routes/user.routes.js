import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  forgotPassword,
  resetPassword
} from "../controllers/user.controller.js";

const router = Router();

/* ================= PUBLIC ROUTES ================= */

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/refresh-token", refreshAccessToken);


/* ================= PROTECTED ROUTES ================= */

router.post("/logout", verifyJWT, logoutUser);

router.get("/current-user", verifyJWT, getCurrentUser);

router.post("/change-password", verifyJWT, changeCurrentPassword);

router.patch("/update-profile", verifyJWT, updateAccountDetails);


export default router;