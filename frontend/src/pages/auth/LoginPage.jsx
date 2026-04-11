import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../api/auth.api.js";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";
import {
  GitBranch, Eye, EyeOff, Bot, Shield, Zap,
  ArrowRight, Sparkles
} from "lucide-react";

const FEATURES = [
  { icon: Bot, title: "AI-Powered Reviews", desc: "Get instant, intelligent feedback on every PR" },
  { icon: Shield, title: "Rule Enforcement", desc: "Define custom rules that auto-check compliance" },
  { icon: Zap, title: "Instant Analysis", desc: "Code quality scored in seconds, not hours" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [form, setForm] = useState({ email: "", phone: "", password: "" });

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      const data = res?.data?.data;
      if (!data?.user || !data?.accessToken) {
        toast.error("Unexpected response from server. Please try again.");
        return;
      }
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { password: form.password };
    if (loginType === "email") payload.email = form.email;
    else payload.phone = form.phone;
    mutate(payload);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>

      {/* ── Left Panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0a0f1a 0%, #0d1117 50%, #0a1628 100%)"
        }}
      >
        {/* Background orbs */}
        <div style={{
          position: "absolute", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
          top: -80, left: -80, borderRadius: "50%",
          animation: "orb-move 12s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", width: 350, height: 350,
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          bottom: 0, right: -60, borderRadius: "50%",
          animation: "orb-move 16s ease-in-out infinite alternate-reverse"
        }} />

        {/* Grid decoration */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(37,99,235,0.4)"
            }}>
              <GitBranch size={20} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.5px" }}>
              AI PR Review
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="feature-pill mb-6">
            <Sparkles size={13} />
            Powered by advanced AI
          </div>
          <h1 style={{
            fontSize: 42, fontWeight: 800, lineHeight: 1.15,
            color: "#e6edf3", letterSpacing: "-1.5px", marginBottom: 16
          }}>
            Smarter Code
            <br />
            <span style={{
              background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Reviews.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: "#8b949e", lineHeight: 1.7, maxWidth: 380 }}>
            Automate your PR workflow with AI that understands your codebase,
            enforces your rules, and never gets tired.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              padding: "14px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12
            }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Icon size={16} color="#60a5fa" />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#e6edf3" }}>{title}</p>
                <p style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px] animate-fade-in" style={{ animationDelay: "0.05s" }}>

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

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.8px" }}>
              Sign in
            </h2>
            <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
              New here?{" "}
              <Link to="/register" style={{ color: "#60a5fa", fontWeight: 500, textDecoration: "none" }}>
                Create a free account
              </Link>
            </p>
          </div>

          {/* Login type toggle */}
          <div style={{
            display: "flex", gap: 4, padding: 4,
            background: "rgba(13,17,23,0.8)",
            border: "1px solid var(--border-default)",
            borderRadius: 12, marginBottom: 24
          }}>
            {["email", "phone"].map((t) => (
              <button
                key={t}
                onClick={() => setLoginType(t)}
                style={{
                  flex: 1, padding: "8px 0",
                  borderRadius: 8, border: "none",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s",
                  background: loginType === t
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                    : "transparent",
                  color: loginType === t ? "#fff" : "#8b949e",
                  boxShadow: loginType === t ? "0 2px 8px rgba(37,99,235,0.35)" : "none"
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email / Phone */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8b949e", marginBottom: 6 }}>
                {loginType === "email" ? "Email address" : "Phone number"}
              </label>
              {loginType === "email" ? (
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              ) : (
                <input
                  id="login-phone"
                  type="tel"
                  className="input-field"
                  placeholder="+919876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#8b949e" }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="••••••••••"
                  style={{ paddingRight: 44 }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
              style={{ width: "100%", marginTop: 8, fontSize: 15 }}
            >
              {isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#484f58" }}>
            By signing in you agree to our{" "}
            <span style={{ color: "#8b949e", cursor: "pointer" }}>Terms of Service</span> and{" "}
            <span style={{ color: "#8b949e", cursor: "pointer" }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;