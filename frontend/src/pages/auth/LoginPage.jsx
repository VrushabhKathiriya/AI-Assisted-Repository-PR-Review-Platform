import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login, googleLogin } from "../../api/auth.api.js";
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

/* ── Google SVG logo ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [form, setForm] = useState({ email: "", phone: "", password: "" });
  const [gisReady, setGisReady] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);
  const gisInitialized = useRef(false);

  /* ── Existing email/password login (unchanged) ─────────── */
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

  /* ── Google login mutation ──────────────────────────────── */
  const { mutate: mutateGoogle, isPending: isGooglePending } = useMutation({
    mutationFn: googleLogin,
    onSuccess: (res) => {
      const data = res?.data?.data;
      if (!data?.user || !data?.accessToken) {
        toast.error("Unexpected response from server. Please try again.");
        return;
      }
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome, ${data.user.fullName || data.user.username}!`);
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Google sign-in failed. Please try again."
      );
    },
  });

  /* ── GIS callback — called by Google after user picks account ── */
  const handleGoogleCredentialResponse = useCallback((response) => {
    if (!response?.credential) {
      toast.error("Google sign-in was cancelled or failed. Please try again.");
      return;
    }
    mutateGoogle({ credential: response.credential });
  }, [mutateGoogle]);

  /* ── Initialize GIS once the script loads ── */
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    const tryInit = () => {
      if (gisInitialized.current) return;
      if (!window?.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      gisInitialized.current = true;
      setGisReady(true);
    };

    /* Try immediately in case the script is already loaded */
    tryInit();

    /* Poll until the GIS library becomes available */
    const interval = setInterval(() => {
      if (window?.google?.accounts?.id) {
        clearInterval(interval);
        tryInit();
      }
    }, 100);

    /* Also listen for the script's load event as a reliable trigger */
    const onScriptLoad = () => tryInit();
    const gsiScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (gsiScript) {
      gsiScript.addEventListener("load", onScriptLoad);
    }

    return () => {
      clearInterval(interval);
      if (gsiScript) gsiScript.removeEventListener("load", onScriptLoad);
    };
  }, [handleGoogleCredentialResponse]);

  /* ── Click handler: use prompt() directly — most reliable approach ── */
  const handleGoogleClick = () => {
    if (isGooglePending) return;

    if (!gisReady || !window?.google?.accounts?.id) {
      toast.error("Google Sign-In is still loading. Please wait a moment and try again.");
      return;
    }

    /* Re-initialize the callback in case it changed (e.g. after HMR) */
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    });

    /* prompt() opens the Google account picker popup directly */
    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment()
      ) {
        /*
         * One Tap was suppressed. Fall back to the popup flow by
         * rendering a temporary off-screen button and clicking it.
         */
        const tempDiv = document.createElement("div");
        tempDiv.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:400px;";
        document.body.appendChild(tempDiv);

        window.google.accounts.id.renderButton(tempDiv, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          width: 400,
        });

        /* Allow time for GIS to mount its button inside tempDiv */
        setTimeout(() => {
          const btn = tempDiv.querySelector("div[role='button']");
          if (btn) {
            btn.click();
          } else {
            toast.error("Could not open Google Sign-In. Please try again or use email login.");
          }
          /* Clean up after a short delay */
          setTimeout(() => document.body.removeChild(tempDiv), 3000);
        }, 300);
      }
    });
  };

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
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

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
          <div style={{ marginBottom: 28 }}>
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

          {/* ── Our custom-styled Google button ─────────────── */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleClick}
            disabled={isGooglePending}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 20px",
              background: googleHover ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 10,
              cursor: isGooglePending ? "not-allowed" : "pointer",
              opacity: isGooglePending ? 0.7 : 1,
              transition: "all 0.18s ease",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              color: "#e6edf3",
              letterSpacing: "0.1px",
              boxShadow: googleHover ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
              marginBottom: 20,
            }}
          >
            {isGooglePending ? (
              <>
                <svg
                  style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="#8b949e" strokeWidth="3" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="#8b949e" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing in with Google…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              or sign in with
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
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
                type="button"
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
                  boxShadow: loginType === t ? "0 2px 8px rgba(37,99,235,0.35)" : "none",
                  fontFamily: "inherit",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
