import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPRsByRepo, reviewPR } from "../../api/pullRequest.api.js";
import { getRepoById } from "../../api/repository.api.js";
import { getComments, addComment, deleteComment } from "../../api/comment.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import { getPRStatusColor, getAIStatusColor, getIssueTypeColor } from "../../utils/getStatusColor.js";
import { timeAgo } from "../../utils/formatDate.js";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";
import {
  GitPullRequest, CheckCircle, XCircle,
  Sparkles, Shield, MessageSquare,
  Send, Trash2, AlertTriangle, Info,
  Lightbulb, ChevronDown, ChevronUp, Clock
} from "lucide-react";

const S = {
  card: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 14, overflow: "hidden" },
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" },
};

const prBadge = (status) => {
  const map = {
    pending: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    accepted: { bg: "rgba(5,150,105,0.12)", color: "#34d399", border: "rgba(5,150,105,0.25)" },
    rejected: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
  };
  return map[status] || map.pending;
};

const issueBadge = (type) => {
  const map = {
    critical: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
    warning: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    suggestion: { bg: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "rgba(37,99,235,0.25)" },
  };
  return map[type] || map.suggestion;
};

const PRDetailPage = () => {
  const { repoId, prId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);

  const { data: prsData, isLoading } = useQuery({ queryKey: ["prs", repoId], queryFn: () => getPRsByRepo(repoId) });
  const { data: repoData } = useQuery({ queryKey: ["repo", repoId], queryFn: () => getRepoById(repoId) });
  const { data: commentsData } = useQuery({ queryKey: ["comments", prId], queryFn: () => getComments(prId) });

  const pr = prsData?.data?.data?.find((p) => p._id === prId);
  const repo = repoData?.data?.data;
  const comments = commentsData?.data?.data?.comments || [];
  const isOwner = repo?.owner?._id === user?._id || repo?.owner === user?._id;

  const { mutate: handleReview, isPending: reviewing } = useMutation({
    mutationFn: (action) => reviewPR(prId, { action }),
    onSuccess: (_, action) => {
      toast.success(`PR ${action}ed successfully!`);
      queryClient.invalidateQueries({ queryKey: ["prs", repoId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: submitComment, isPending: commenting } = useMutation({
    mutationFn: () => addComment(prId, { content: comment }),
    onSuccess: () => { setComment(""); queryClient.invalidateQueries({ queryKey: ["comments", prId] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: handleDeleteComment } = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", prId] })
  });

  if (isLoading) return <Layout><Loader /></Layout>;
  if (!pr) return <Layout><p style={{ color: "var(--text-secondary)" }}>PR not found</p></Layout>;

  const badge = prBadge(pr.status);
  const issueIcons = { critical: AlertTriangle, warning: AlertTriangle, suggestion: Lightbulb };

  return (
    <Layout>
      {/* Header */}
      <div style={{ ...S.card, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: badge.bg, border: `1px solid ${badge.border}`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GitPullRequest size={18} color={badge.color} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 8 }}>
                {pr.message}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>by {pr.createdBy?.username}</span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(pr.createdAt)}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                  background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                }}>
                  {pr.status}
                </span>
              </div>
            </div>
          </div>

          {isOwner && pr.status === "pending" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => handleReview("reject")}
                disabled={reviewing}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "inherit", transition: "all 0.15s", opacity: reviewing ? 0.5 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              >
                <XCircle size={15} />
                Reject
              </button>
              <button
                onClick={() => handleReview("accept")}
                disabled={reviewing}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  border: "none", color: "#fff", borderRadius: 10,
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "inherit", transition: "all 0.2s", opacity: reviewing ? 0.5 : 1,
                  boxShadow: "0 4px 12px rgba(5,150,105,0.3)"
                }}
              >
                <CheckCircle size={15} />
                Accept
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left — Code + Comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Submitted Code */}
          <div style={S.card}>
            <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Submitted Code</span>
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, color: "#60a5fa", fontFamily: "inherit"
                }}
              >
                {showFullContent ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showFullContent ? "Collapse" : "Expand"}
              </button>
            </div>
            <div style={{
              padding: 16, overflow: "hidden",
              maxHeight: showFullContent ? "none" : 200
            }}>
              <pre style={{
                fontSize: 12, color: "#c9d1d9",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0
              }}>
                {pr.newContent}
              </pre>
            </div>
          </div>

          {/* Comments */}
          <div style={S.card}>
            <div style={S.sectionTitle}>
              <MessageSquare size={14} color="#8b949e" />
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Comments ({comments.length})
              </h2>
            </div>

            <div>
              {comments.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "24px 0" }}>
                  No comments yet
                </p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id} style={{
                    padding: "14px 20px",
                    borderBottom: i !== comments.length - 1 ? "1px solid var(--border-subtle)" : "none"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff"
                        }}>
                          {c.author?.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {c.author?.username}
                        </span>
                        {c.isEdited && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>(edited)</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(c.createdAt)}</span>
                        {(c.author?._id === user?._id || isOwner) && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--text-muted)", padding: 4, transition: "color 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.6 }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{
                  width: "100%", background: "rgba(13,17,23,0.8)",
                  border: "1px solid var(--border-default)", borderRadius: 10,
                  padding: "10px 14px", fontSize: 13, color: "var(--text-primary)",
                  outline: "none", resize: "none", marginBottom: 10, fontFamily: "inherit",
                  transition: "border-color 0.15s", boxSizing: "border-box"
                }}
                onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                onClick={() => submitComment()}
                disabled={commenting || !comment.trim()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
                  opacity: (commenting || !comment.trim()) ? 0.5 : 1,
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                }}
              >
                <Send size={13} />
                {commenting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — AI Review + Rule Check */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Review */}
          <div style={S.card}>
            <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={14} color="#a78bfa" />
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>AI Review</h2>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                padding: "3px 8px", borderRadius: 99,
                background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)"
              }}>
                {pr.aiResult?.status?.toUpperCase()}
              </span>
            </div>

            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {pr.aiResult?.summary && (
                <div style={{
                  padding: "12px 14px", background: "rgba(13,17,23,0.6)",
                  borderRadius: 10, border: "1px solid var(--border-subtle)"
                }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Summary</p>
                  <p style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.6 }}>{pr.aiResult.summary}</p>
                </div>
              )}

              {pr.aiResult?.issues?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>Issues</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pr.aiResult.issues.map((issue, i) => {
                      const Icon = issueIcons[issue.type] || Info;
                      const b = issueBadge(issue.type);
                      return (
                        <div key={i} style={{
                          padding: "12px 14px", borderRadius: 10,
                          background: b.bg, border: `1px solid ${b.border}`
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: b.color }}>
                            <Icon size={13} />
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{issue.type}</span>
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: b.color, marginBottom: 4 }}>{issue.issue}</p>
                          <p style={{ fontSize: 11, color: b.color, opacity: 0.8, marginBottom: 4 }}>{issue.why}</p>
                          <p style={{ fontSize: 11, color: b.color, opacity: 0.7 }}>Fix: {issue.fix}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pr.aiResult?.improvements?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>Improvements</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                    {pr.aiResult.improvements.map((imp, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#c9d1d9" }}>
                        <span style={{ color: "#60a5fa", flexShrink: 0 }}>→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pr.aiResult?.commitMessageFeedback && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)"
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>Commit Message Feedback</p>
                  <p style={{ fontSize: 12, color: "#c9d1d9" }}>{pr.aiResult.commitMessageFeedback}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rule Check */}
          <div style={S.card}>
            <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={14} color="#60a5fa" />
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Rule Check</h2>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                padding: "3px 8px", borderRadius: 99,
                ...(pr.ruleResult?.passed
                  ? { background: "rgba(5,150,105,0.1)", color: "#34d399", border: "1px solid rgba(5,150,105,0.2)" }
                  : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" })
              }}>
                {pr.ruleResult?.passed ? "PASSED" : "FAILED"}
              </span>
            </div>

            <div style={{ padding: "14px 16px" }}>
              {pr.ruleResult?.issues?.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={15} color="#34d399" />
                  <p style={{ fontSize: 13, color: "#34d399" }}>All rules passed</p>
                </div>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                  {pr.ruleResult.issues.map((issue, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#f87171" }}>
                      <XCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PRDetailPage;