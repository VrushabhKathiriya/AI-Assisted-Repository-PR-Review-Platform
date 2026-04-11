import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../api/auth.api.js";
import toast from "react-hot-toast";
import { GitBranch, KeyRound, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number or symbol", ok: /[\d\W]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < score ? colors[score - 1] : "var(--border-default)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : "#484f58" }}>
          {score > 0 ? labels[score - 1] : ""}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {checks.map((c) => (
            <span
              key={c.label}
              style={{ fontSize: 10, color: c.ok ? "#4ade80" : "#484f58", display: "flex", alignItems: "center", gap: 3 }}
            >
              <CheckCircle size={9} color={c.ok ? "#4ade80" : "#484f58"} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => resetPassword(token, { newPassword }),
    onSuccess: () => {
      toast.success("Password reset successfully!");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Reset failed. The link may have expired.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    mutate();
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
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          top: 60, right: -60, borderRadius: "50%",
          animation: "orb-move 14s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
          bottom: 40, left: -40, borderRadius: "50%",
          animation: "orb-move 10s ease-in-out infinite alternate-reverse"
        }} />
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="relative z-10 text-center animate-fade-in" style={{ maxWidth: 380 }}>
          <div className="flex items-center justify-center gap-3 mb-12">
            <div style={{
              width: 44, height: 44,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(124,58,237,0.45)"
            }}>
              <GitBranch size={22} color="white" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.5px" }}>
              AI PR Review
            </span>
          </div>

          <div style={{
            width: 80, height: 80, margin: "0 auto 24px",
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(139,92,246,0.15)"
          }}>
            <KeyRound size={36} color="#a78bfa" />
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, lineHeight: 1.2,
            color: "#e6edf3", letterSpacing: "-1px", marginBottom: 14
          }}>
            Create a new
            <br />
            <span style={{
              background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              password.
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "#8b949e", lineHeight: 1.7 }}>
            Choose a strong, unique password to keep your account secure. It must be at least 8 characters long.
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
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GitBranch size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e6edf3" }}>AI PR Review</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.8px" }}>
              Reset your password
            </h2>
            <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
              Enter a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8b949e", marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Minimum 8 characters"
                  style={{ paddingRight: 44 }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#8b949e", display: "flex", padding: 2
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isPending || newPassword.length < 8}
              style={{
                width: "100%", marginTop: 4, fontSize: 15,
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
              }}
            >
              {isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Resetting…
                </span>
              ) : (
                <>Set new password <ArrowRight size={16} /></>
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
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;