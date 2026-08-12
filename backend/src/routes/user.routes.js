import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { loginRateLimiter, registerRateLimiter, forgotPasswordRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { loginSlidingRateLimiter, registerSlidingRateLimiter, forgotPasswordSlidingRateLimiter } from "../middlewares/rateLimit.middleware.js";

import {
  registerUser,
  verifyOtp,
  loginUser,
  googleLogin,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  addEmailToProfile,
  verifyEmailForProfile,
  forgotPassword,
  resetPassword
} from "../controllers/user.controller.js";

const router = Router();

/* ================= PUBLIC ROUTES ================= */

//router.post("/register",registerRateLimiter,registerUser);
router.post("/register",registerSlidingRateLimiter,registerUser);
router.post("/verify-otp", verifyOtp);
//router.post("/login",loginRateLimiter,loginUser);
router.post("/login",loginSlidingRateLimiter,loginUser);
router.post("/google-login", googleLogin);

//router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/forgot-password", forgotPasswordSlidingRateLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/refresh-token", refreshAccessToken);


/* ================= PROTECTED ROUTES ================= */

router.post("/logout", verifyJWT, logoutUser);

router.get("/current-user", verifyJWT, getCurrentUser);

router.post("/change-password", verifyJWT, changeCurrentPassword);

router.patch("/update-profile", verifyJWT, updateAccountDetails);

/*Email management for phone-only users */
router.post("/add-email", verifyJWT, addEmailToProfile);
router.post("/verify-profile-email", verifyJWT, verifyEmailForProfile);


export default router;