import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { verifyOtp } from "../../api/auth.api.js";
import toast from "react-hot-toast";
import { GitBranch, ShieldCheck, ArrowRight } from "lucide-react";

const VerifyOtpPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  useEffect(() => {
    if (!state?.email && !state?.phone) {
      navigate("/register");
    } else {
      // Auto-focus first input on mount
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
  }, [state, navigate]);

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      toast.success("Account verified! Please sign in.");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Invalid OTP. Please try again.");
      // Clear inputs on error
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    },
  });

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    inputs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    const payload = { otp: otpString };
    if (state?.email) payload.email = state.email;
    else payload.phone = state.phone;
    mutate(payload);
  };

  const identifier = state?.email || state?.phone || "";
  const maskedIdentifier = identifier.includes("@")
    ? identifier.replace(/(.{2}).*(@.*)/, "$1***$2")
    : identifier.replace(/(\d{2})\d+(\d{3})/, "$1*****$2");

  const allFilled = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>

      {/* ── Left Panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0f1a 0%, #0d1117 50%, #0a1628 100%)" }}
      >
        {/* Background orbs */}
        <div style={{
          position: "absolute", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          top: -80, left: -80, borderRadius: "50%",
          animation: "orb-move 12s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", width: 320, height: 320,
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          bottom: 60, right: -60, borderRadius: "50%",
          animation: "orb-move 16s ease-in-out infinite alternate-reverse"
        }} />
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="relative z-10 text-center animate-fade-in" style={{ maxWidth: 380 }}>
          {/* Logo */}
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

          {/* Icon */}
          <div style={{
            width: 80, height: 80, margin: "0 auto 24px",
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(37,99,235,0.25)",
            borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(37,99,235,0.15)"
          }}>
            <ShieldCheck size={36} color="#60a5fa" />
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, lineHeight: 1.2,
            color: "#e6edf3", letterSpacing: "-1px", marginBottom: 12
          }}>
            Almost there!
            <br />
            <span style={{
              background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Verify your account.
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "#8b949e", lineHeight: 1.7, marginBottom: 24 }}>
            We sent a 6-digit verification code to
            <br />
            <span style={{ color: "#e6edf3", fontWeight: 500 }}>{identifier}</span>
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 99,
            padding: "6px 16px",
            fontSize: 12, fontWeight: 500, color: "#93c5fd"
          }}>
            Code expires in 10 minutes
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] animate-fade-in">

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
              Verify your account
            </h2>
            <p style={{ color: "#8b949e", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
              We sent a 6-digit code to{" "}
              <span style={{ color: "#60a5fa", fontWeight: 500 }}>{maskedIdentifier}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Inputs */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8b949e", marginBottom: 14 }}>
                Enter verification code
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    autoComplete="one-time-code"
                    style={{
                      width: 52, height: 58,
                      textAlign: "center",
                      fontSize: 22, fontWeight: 700,
                      background: digit ? "rgba(37,99,235,0.08)" : "rgba(13,17,23,0.8)",
                      border: `1.5px solid ${digit ? "#2563eb" : "var(--border-default)"}`,
                      borderRadius: 12,
                      color: digit ? "#60a5fa" : "#e6edf3",
                      outline: "none",
                      transition: "all 0.15s",
                      cursor: "text",
                      boxShadow: digit ? "0 0 0 2px rgba(37,99,235,0.2)" : "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.25)";
                    }}
                    onBlur={(e) => {
                      if (!digit) {
                        e.target.style.borderColor = "var(--border-default)";
                        e.target.style.boxShadow = "none";
                      } else {
                        e.target.style.borderColor = "#2563eb";
                        e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.2)";
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending || !allFilled}
              style={{ width: "100%", fontSize: 15 }}
            >
              {isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                <>Verify account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Resend / Back */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#484f58" }}>
              Didn't receive it?{" "}
              <span
                style={{ color: "#60a5fa", cursor: "pointer", fontWeight: 500 }}
                onClick={() => toast("Please re-register to get a new OTP.", { icon: "ℹ️" })}
              >
                Resend
              </span>
            </p>
            <Link
              to="/register"
              style={{ fontSize: 13, color: "#8b949e", textDecoration: "none", fontWeight: 400 }}
            >
              ← Back to register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;