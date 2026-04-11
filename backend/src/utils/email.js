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
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Collaboration Invitation</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6;">

        <!-- Outer wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:#f3f4f6; padding: 32px 16px;">
          <tr>
            <td align="center">

              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="max-width:560px; background:#ffffff; border-radius:12px;
                            box-shadow:0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">

                <!-- Header banner -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);
                              padding:32px 32px 24px; text-align:center;">
                    <p style="margin:0; font-size:36px; line-height:1;">🚀</p>
                    <h1 style="margin:12px 0 0; color:#ffffff; font-family:Arial,sans-serif;
                                font-size:22px; font-weight:700; letter-spacing:-0.3px;">
                      You're Invited to Collaborate!
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">

                    <p style="margin:0 0 16px; font-family:Arial,sans-serif;
                               font-size:16px; color:#374151; line-height:1.6;">
                      Hi there 👋,
                    </p>
                    <p style="margin:0 0 24px; font-family:Arial,sans-serif;
                               font-size:16px; color:#374151; line-height:1.6;">
                      <strong style="color:#1d4ed8;">${inviterName}</strong>
                      has invited you to collaborate on the repository
                      <strong style="color:#7c3aed;">${repoName}</strong>.
                      Join the project and start contributing today!
                    </p>

                    <!-- Accept button — full width, stacked -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="margin-bottom:12px;">
                      <tr>
                        <td align="center">
                          <a href="${acceptLink}"
                             style="display:block; width:100%; max-width:320px;
                                    box-sizing:border-box; padding:14px 24px;
                                    background:#16a34a; color:#ffffff;
                                    font-family:Arial,sans-serif; font-size:16px;
                                    font-weight:700; text-decoration:none;
                                    border-radius:8px; text-align:center;">
                            ✅ Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Decline button — full width, stacked -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${declineLink}"
                             style="display:block; width:100%; max-width:320px;
                                    box-sizing:border-box; padding:14px 24px;
                                    background:#dc2626; color:#ffffff;
                                    font-family:Arial,sans-serif; font-size:16px;
                                    font-weight:700; text-decoration:none;
                                    border-radius:8px; text-align:center;">
                            ❌ Decline Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info text -->
                    <p style="margin:0 0 8px; font-family:Arial,sans-serif;
                               font-size:13px; color:#6b7280; line-height:1.5;">
                      ⏳ This invitation expires in <strong>7 days</strong>.
                    </p>
                    <p style="margin:0; font-family:Arial,sans-serif;
                               font-size:13px; color:#6b7280; line-height:1.5;">
                      If you did not expect this invitation, you can safely ignore this email.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb; padding:16px 32px;
                              border-top:1px solid #e5e7eb; text-align:center;">
                    <p style="margin:0; font-family:Arial,sans-serif;
                               font-size:12px; color:#9ca3af;">
                      AI PR Review Platform &bull; Sent automatically &bull; Do not reply
                    </p>
                  </td>
                </tr>

              </table>
              <!-- /Card -->

            </td>
          </tr>
        </table>

      </body>
      </html>
    `
  });
};