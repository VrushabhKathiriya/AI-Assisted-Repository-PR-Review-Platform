import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../utils/email.js";
import { sendPhoneOtp } from "../utils/sms.js";
import { sendResetPasswordEmail } from "../utils/email.js";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

/* ================= REGISTER ================= */
export const registerUser = asyncHandler(async (req, res) => {
  let { fullName, username, email, phone, password } = req.body;

  if (!fullName || !username || !password) {
    throw new ApiError(400, "Full name, username, and password are required");
  }

  if (!email && !phone) {
    throw new ApiError(400, "Email or phone number is required");
  }

  username = username.toLowerCase().trim();

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or phone");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const newUser = await User.create({
    fullName,
    username,
    email,
    phone,
    password,
    authProvider: email ? "email" : "phone",
    emailOtp: email ? otp : undefined,
    emailOtpExpiry: email ? otpExpiry : undefined,
    phoneOtp: phone ? otp : undefined,
    phoneOtpExpiry: phone ? otpExpiry : undefined
  });

  try {
    if (email) {
      await sendOtpEmail(email, otp);
    }

    if (phone) {
      await sendPhoneOtp(phone, otp);
    }
  } catch (error) {
    console.error("OTP sending failed:", error.message);
  }

  res.status(201).json(
    new ApiResponse(201, null, "OTP sent for verification")
  );
});

/* ================= VERIFY OTP ================= */

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, phone, otp } = req.body;

  if (!otp) throw new ApiError(400, "OTP is required");

  const user = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (!user) throw new ApiError(404, "User not found");

  const isEmailFlow = !!email;

  if (
    (isEmailFlow && (user.emailOtp !== otp || user.emailOtpExpiry < Date.now())) ||
    (!isEmailFlow && (user.phoneOtp !== otp || user.phoneOtpExpiry < Date.now()))
  ) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (isEmailFlow) {
    user.isVerified = true;
  } else {
    user.isPhoneVerified = true;
  }

  user.emailOtp = undefined;
  user.phoneOtp = undefined;

  user.emailOtpExpiry = undefined;
  user.phoneOtpExpiry = undefined;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, "User verified successfully")
  );
});

/* ================= LOGIN ================= */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!(email || phone) || !password) {
    throw new ApiError(400, "Credentials required");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new ApiError(401, "Please verify your account first");
  }

  const isValid = await user.isPasswordCorrect(password);

  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "Login successful"
      )
    );
});

/* ================= LOGOUT ================= */
export const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }


  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }
    },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(200, {}, "User logged out successfully")
    );
});

/* ================= REFRESH ACCESS TOKEN ================= */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  let decoded;

  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully"
      )
    );
});

/* ================= CURRENT USER ================= */

export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
    )
  );
});

/* ================= CHANGE PASSWORD ================= */

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.isPasswordCorrect(oldPassword);

  if (!isMatch) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password changed successfully"
    )
  );
});

/* ================= UPDATE PROFILE ================= */

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, phone } = req.body || {};

  if (!fullName) {
    throw new ApiError(400, "Full name is required");
  }

  const updateData = { fullName };

  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
      throw new ApiError(409, "Email already in use");
    }
    updateData.email = email.toLowerCase().trim();
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone && existingPhone._id.toString() !== req.user._id.toString()) {
      throw new ApiError(409, "Phone already in use");
    }
    updateData.phone = phone;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Account updated successfully"
    )
  );
});

/* ================= FORGOT PASSWORD ================= */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    throw new ApiError(400, "Email or phone is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Email Reset Flow
  if (email) {
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetLink);
    } catch (error) {
      console.error("Reset email failed:", error.message);
    }
  }

  // Phone Reset Flow (OTP)
  if (phone) {
    const otp = generateOtp();
    user.phoneOtp = otp;
    user.phoneOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPhoneOtp(phone, otp);
    } catch (error) {
      console.error("Reset OTP SMS failed:", error.message);
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Password reset instructions sent"
    )
  );
});

/* ================= RESET PASSWORD ================= */

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  user.refreshToken = undefined;

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Password reset successful"
    )
  );
});
