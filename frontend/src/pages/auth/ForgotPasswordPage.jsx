import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../../api/auth.api.js";
import toast from "react-hot-toast";
import { GitBranch, Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send reset link");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ email });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>

      {/* ── Left Panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0f1a 0%, #0d1117 50%, #0a1628 100%)" }}
      >
        <div style={{
          position: "absolute", width: 380, height: 380,
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          top: -60, right: -60, borderRadius: "50%",
          animation: "orb-move 14s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          bottom: 40, left: -40, borderRadius: "50%",
          animation: "orb-move 10s ease-in-out infinite alternate-reverse"
        }} />
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="relative z-10 text-center animate-fade-in" style={{ maxWidth: 380 }}>
          <div className="flex items-center justify-center gap-3 mb-12">
            <div style={{
              width: 44, height: 44,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(37,99,235,0.45)"
            }}>
              <GitBranch size={22} color="white" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.5px" }}>
              AI PR Review
            </span>
          </div>

          <div style={{
            width: 80, height: 80, margin: "0 auto 24px",
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(37,99,235,0.25)",
            borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(37,99,235,0.15)"
          }}>
            <Mail size={36} color="#60a5fa" />
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, lineHeight: 1.2,
            color: "#e6edf3", letterSpacing: "-1px", marginBottom: 14
          }}>
            Forgot your
            <br />
            <span style={{
              background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              password?
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "#8b949e", lineHeight: 1.7 }}>
            No worries. Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px] animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GitBranch size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e6edf3" }}>AI PR Review</span>
          </div>

          {!sent ? (
            <>
              {/* Heading */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.8px" }}>
                  Reset your password
                </h2>
                <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
                  Remember it?{" "}
                  <Link to="/login" style={{ color: "#60a5fa", fontWeight: 500, textDecoration: "none" }}>
                    Sign in instead
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8b949e", marginBottom: 6 }}>
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isPending}
                  style={{ width: "100%", marginTop: 4, fontSize: 15 }}
                >
                  {isPending ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Sending link…
                    </span>
                  ) : (
                    <>Send reset link <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <Link
                to="/login"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginTop: 24, fontSize: 13, color: "#8b949e",
                  textDecoration: "none", width: "fit-content"
                }}
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </>
          ) : (
            /* ── Success State ── */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, margin: "0 auto 20px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(34,197,94,0.1)"
              }}>
                <CheckCircle size={34} color="#4ade80" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.5px", marginBottom: 10 }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 14, color: "#8b949e", lineHeight: 1.7, marginBottom: 8 }}>
                We've sent a password reset link to
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3", marginBottom: 28 }}>
                {email}
              </p>
              <p style={{ fontSize: 12, color: "#484f58", marginBottom: 24 }}>
                Didn't receive it? Check spam or{" "}
                <span
                  style={{ color: "#60a5fa", cursor: "pointer" }}
                  onClick={() => setSent(false)}
                >
                  try again
                </span>
              </p>
              <Link
                to="/login"
                className="btn-primary"
                style={{ display: "inline-flex", textDecoration: "none", fontSize: 14 }}
              >
                Back to login <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;