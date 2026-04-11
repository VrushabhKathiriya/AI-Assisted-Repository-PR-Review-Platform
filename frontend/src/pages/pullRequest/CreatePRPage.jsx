import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFileById } from "../../api/file.api.js";
import { createPR } from "../../api/pullRequest.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import toast from "react-hot-toast";
import { GitPullRequest, FileCode, Sparkles, ArrowLeft } from "lucide-react";

const CreatePRPage = () => {
  const { repoId, fileId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ content: "", message: "" });

  const { data: fileData, isLoading } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => getFileById(fileId)
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPR(fileId, form),
    onSuccess: (res) => {
      toast.success("PR created and AI reviewed!");
      const prId = res.data.data._id;
      navigate(`/repos/${repoId}/prs/${prId}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  if (isLoading) return <Layout><Loader /></Layout>;

  const file = fileData?.data?.data;

  return (
    <Layout>
      <div style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-secondary)", fontSize: 13, fontFamily: "inherit",
              marginBottom: 16, padding: 0, transition: "color 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
            }}>
              <GitPullRequest size={18} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
                Create Pull Request
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                for <span style={{ color: "#60a5fa", fontWeight: 500 }}>{file?.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Content Preview */}
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          borderRadius: 14, overflow: "hidden", marginBottom: 16
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)"
          }}>
            <FileCode size={14} color="#8b949e" />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Current file content</span>
          </div>
          <div style={{ padding: "14px 18px", maxHeight: 140, overflow: "hidden" }}>
            <pre style={{
              fontSize: 12, color: "#8b949e",
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0
            }}>
              {file?.content || "Empty file"}
            </pre>
          </div>
        </div>

        {/* PR Form */}
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          borderRadius: 14, padding: 24
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{
                display: "block", fontSize: 12, color: "var(--text-secondary)",
                marginBottom: 6, fontWeight: 500
              }}>
                Commit Message *
              </label>
              <input
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your changes..."
                maxLength={100}
                style={{
                  width: "100%", background: "rgba(13,17,23,0.8)",
                  border: "1px solid var(--border-default)", borderRadius: 10,
                  padding: "10px 14px", fontSize: 14, color: "var(--text-primary)",
                  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
                  fontFamily: "inherit", boxSizing: "border-box"
                }}
                onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.25)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
              />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {form.message.length}/100
              </p>
            </div>

            <div>
              <label style={{
                display: "block", fontSize: 12, color: "var(--text-secondary)",
                marginBottom: 6, fontWeight: 500
              }}>
                New Content *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your updated code here..."
                rows={16}
                style={{
                  width: "100%", background: "rgba(13,17,23,0.8)",
                  border: "1px solid var(--border-default)", borderRadius: 10,
                  padding: "10px 14px", fontSize: 13, color: "var(--text-primary)",
                  outline: "none", transition: "border-color 0.15s",
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  resize: "none", lineHeight: 1.7, boxSizing: "border-box"
                }}
                onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* AI Notice */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)"
            }}>
              <Sparkles size={15} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#c4b5fd", lineHeight: 1.6 }}>
                Your code will be automatically reviewed by AI and checked against repository rules before submission.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 10,
                  border: "1px solid var(--border-default)", background: "transparent",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 14,
                  fontFamily: "inherit", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-muted)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                Cancel
              </button>
              <button
                onClick={() => mutate()}
                disabled={isPending || !form.content || !form.message}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "none", color: "#fff", cursor: "pointer", fontSize: 14,
                  fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: (isPending || !form.content || !form.message) ? 0.5 : 1
                }}
              >
                {isPending ? (
                  <>
                    <div style={{
                      width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin 0.7s linear infinite"
                    }} />
                    AI Reviewing...
                  </>
                ) : (
                  <>
                    <GitPullRequest size={15} />
                    Submit PR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePRPage;