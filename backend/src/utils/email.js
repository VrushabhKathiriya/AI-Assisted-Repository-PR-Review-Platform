import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";

/* ================= CREATE TRANSPORTER ================= */

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify only once
    await transporter.verify();
    console.log("Email service connected successfully");

    return transporter;
  } catch (error) {
    console.error("Email transporter creation failed:", error.message);
    throw new ApiError(500, "Email service unavailable");
  }
};

/* ================= GENERIC SEND MAIL ================= */

const sendMail = async ({ to, subject, html, text }) => {
  const mailTransporter = await createTransporter();

  await mailTransporter.sendMail({
    from: `"AI PR Review Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
};

/* ================= SEND OTP EMAIL ================= */

export const sendOtpEmail = async (to, otp) => {
  await sendMail({
    to,
    subject: "Your OTP for AI PR Review Platform",
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#2563eb;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  });
};

/* ================= SEND RESET PASSWORD EMAIL ================= */

export const sendResetPasswordEmail = async (to, resetLink) => {
  await sendMail({
    to,
    subject: "Reset Your Password - AI PR Review Platform",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Password Reset Request</h3>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}"
           style="padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:5px;">
          Reset Password
        </a>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
  });
};

/* ================= SEND INVITATION EMAIL ================= */
export const sendInvitationEmail = async (
  to,
  inviterName,
  repoName,
  acceptLink,
  declineLink
) => {
  await sendMail({
    to,
    subject: `${inviterName} invited you to collaborate on ${repoName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 You have been invited!</h2>
        <p>
          <strong>${inviterName}</strong> has invited you to collaborate 
          on the repository <strong>${repoName}</strong>.
        </p>
        <p>Click below to respond to this invitation:</p>
        <div style="margin: 20px 0;">
          <a href="${acceptLink}"
             style="padding:12px 24px; background:#16a34a; color:white; 
                    text-decoration:none; border-radius:6px; margin-right:10px;">
            ✅ Accept Invitation
          </a>
          <a href="${declineLink}"
             style="padding:12px 24px; background:#dc2626; color:white; 
                    text-decoration:none; border-radius:6px;">
            ❌ Decline Invitation
          </a>
        </div>
        <p style="color:#6b7280; font-size:14px;">
          This invitation expires in 7 days.
        </p>
        <p style="color:#6b7280; font-size:14px;">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `
  });
};