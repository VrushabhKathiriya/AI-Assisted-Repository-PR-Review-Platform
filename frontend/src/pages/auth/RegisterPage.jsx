import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../api/auth.api.js";
import toast from "react-hot-toast";
import { GitBranch, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

const BENEFITS = [
  "AI review in under 30 seconds",
  "Custom rule enforcement",
  "Team collaboration built-in",
  "Complete audit trail",
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authType, setAuthType] = useState("email");
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", phone: "", password: ""
  });

  const { mutate, isPending } = useMutation({
    mutationFn: register,
    onSuccess: (_, variables) => {
      toast.success("Account created! Please verify.");
      navigate("/verify-otp", {
        state: { email: variables.email, phone: variables.phone, authType }
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Registration failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { fullName: form.fullName, username: form.username, password: form.password };
    if (authType === "email") payload.email = form.email;
    else payload.phone = form.phone;
    mutate(payload);
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(13, 17, 23, 0.8)",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: "inherit",
    fontSize: 14,
    color: "#e6edf3",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0f1a 0%, #0d1117 50%, #0a1628 100%)" }}>

        <div style={{
          position: "absolute", width: 350, height: 350,
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

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)"
            }}>
              <GitBranch size={20} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.5px" }}>
              AI PR Review
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <h1 style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1.15,
            color: "#e6edf3", letterSpacing: "-1.5px", marginBottom: 16
          }}>
            Join hundreds of
            <br />
            <span style={{
              background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              dev teams.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "#8b949e", lineHeight: 1.7, maxWidth: 340, marginBottom: 28 }}>
            Start shipping better code today with AI-assisted pull request reviews.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BENEFITS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={15} color="#34d399" />
                <span style={{ fontSize: 13, color: "#8b949e" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10"
          style={{ fontSize: 12, color: "#484f58" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>
            Sign in →
          </Link>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-fade-in py-4">

          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GitBranch size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e6edf3" }}>AI PR Review</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.8px" }}>
              Create your account
            </h2>
            <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
              Already have one?{" "}
              <Link to="/login" style={{ color: "#60a5fa", fontWeight: 500, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Auth type toggle */}
          <div style={{
            display: "flex", gap: 4, padding: 4,
            background: "rgba(13,17,23,0.8)",
            border: "1px solid #30363d",
            borderRadius: 12, marginBottom: 20
          }}>
            {["email", "phone"].map((t) => (
              <button
                key={t}
                onClick={() => setAuthType(t)}
                style={{
                  flex: 1, padding: "8px 0",
                  borderRadius: 8, border: "none",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s",
                  background: authType === t
                    ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                    : "transparent",
                  color: authType === t ? "#fff" : "#8b949e",
                  boxShadow: authType === t ? "0 2px 8px rgba(124,58,237,0.35)" : "none"
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b949e", marginBottom: 5 }}>
                  Full name
                </label>
                <input
                  id="reg-fullname"
                  className="input-field"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b949e", marginBottom: 5 }}>
                  Username
                </label>
                <input
                  id="reg-username"
                  className="input-field"
                  placeholder="johndoe"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b949e", marginBottom: 5 }}>
                {authType === "email" ? "Email address" : "Phone number"}
              </label>
              {authType === "email" ? (
                <input
                  id="reg-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              ) : (
                <input
                  id="reg-phone"
                  type="tel"
                  className="input-field"
                  placeholder="+919876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b949e", marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Minimum 8 characters"
                  style={{ paddingRight: 44 }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "#8b949e", display: "flex", padding: 2
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
              style={{
                width: "100%", marginTop: 6, fontSize: 15,
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
                  Creating account…
                </span>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#484f58" }}>
            By creating an account you agree to our{" "}
            <span style={{ color: "#8b949e", cursor: "pointer" }}>Terms</span> &{" "}
            <span style={{ color: "#8b949e", cursor: "pointer" }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;