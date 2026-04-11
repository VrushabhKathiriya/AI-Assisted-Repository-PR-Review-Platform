import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { declineInvitation } from "../../api/contributor.api.js";
import toast from "react-hot-toast";
import { GitBranch, XCircle, ArrowRight } from "lucide-react";

const DeclineInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const hasFired = useRef(false);

  const { mutate } = useMutation({
    mutationFn: () => declineInvitation(token),
    onSuccess: () => {
      setStatus("success");
      toast.success("Invitation declined");
      setTimeout(() => navigate("/"), 2500);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to decline invitation";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    mutate();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: 24
    }}>
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
        borderRadius: 20, padding: "48px 40px", textAlign: "center",
        maxWidth: 420, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(37,99,235,0.4)"
          }}>
            <GitBranch size={18} color="white" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>AI PR Review</span>
        </div>

        {status === "loading" && (
          <>
            <div style={{
              width: 64, height: 64, margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg
                style={{ animation: "spin 0.8s linear infinite", width: 28, height: 28, color: "#60a5fa" }}
                viewBox="0 0 24 24" fill="none"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Processing…
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Declining the invitation…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 64, height: 64, margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <XCircle size={30} color="#f87171" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Invitation Declined
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              You've declined the invitation. Redirecting…
            </p>
            <Link
              to="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px",
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.25)",
                color: "#60a5fa", textDecoration: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 600
              }}
            >
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 64, height: 64, margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <XCircle size={30} color="#f87171" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Something Went Wrong
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <Link
              to="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px",
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.25)",
                color: "#60a5fa", textDecoration: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 600
              }}
            >
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DeclineInvitationPage;