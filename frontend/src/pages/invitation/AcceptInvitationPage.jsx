import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { acceptInvitation } from "../../api/contributor.api.js";
import toast from "react-hot-toast";
import { GitBranch, CheckCircle, XCircle, ArrowRight } from "lucide-react";

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [repoName, setRepoName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // Guard against React Strict Mode double-invocation
  const hasFired = useRef(false);

  const { mutate } = useMutation({
    mutationFn: () => acceptInvitation(token),
    onSuccess: (res) => {
      const name = res?.data?.data?.name || "the repository";
      setRepoName(name);
      setStatus("success");
      toast.success(`You joined ${name}!`);
      setTimeout(() => navigate("/repos"), 2500);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to accept invitation";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    },
  });

  useEffect(() => {
    // Prevent double-fire in React 18 Strict Mode
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
              Accepting Invitation…
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Please wait while we process your invitation.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 64, height: 64, margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <CheckCircle size={30} color="#4ade80" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Successfully Joined!
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              You are now a contributor of{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{repoName}</span>.
              <br />Redirecting to your repositories…
            </p>
            <Link
              to="/repos"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff", textDecoration: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 600
              }}
            >
              Go to Repositories <ArrowRight size={14} />
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
              Invitation Failed
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <Link
              to="/repos"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px",
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.25)",
                color: "#60a5fa", textDecoration: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 600
              }}
            >
              Go to Repositories <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AcceptInvitationPage;