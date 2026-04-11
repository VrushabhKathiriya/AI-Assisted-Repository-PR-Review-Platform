import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFileById, deleteFile } from "../../api/file.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import { timeAgo } from "../../utils/formatDate.js";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";
import {
  FileCode, GitPullRequest, Clock,
  Trash2, ChevronDown, ChevronUp,
  ArrowLeft, Eye, History, CheckCircle
} from "lucide-react";

const FileDetailPage = () => {
  const { repoId, fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(null); // null = show current/latest

  const { data, isLoading } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => getFileById(fileId)
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteFile(fileId),
    onSuccess: () => { toast.success("File deleted"); navigate(`/repos/${repoId}`); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  if (isLoading) return <Layout><Loader /></Layout>;

  const file = data?.data?.data;
  const versions = file?.versions || [];

  // Newest-first list, optionally limited to 3
  const displayVersions = showAllVersions
    ? [...versions].reverse()
    : [...versions].slice(-3).reverse();

  // What to show in the code pane
  const isViewingOld = selectedVersionIdx !== null;
  const viewedVersion = isViewingOld ? versions[selectedVersionIdx] : null;
  const displayContent = isViewingOld ? viewedVersion?.content : file?.content;
  const viewedVersionNum = isViewingOld ? selectedVersionIdx + 1 : versions.length;

  return (
    <Layout>
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: 13, fontFamily: "inherit",
          marginBottom: 20, padding: 0, transition: "color 0.15s"
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={14} />
        Back to repository
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FileCode size={20} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px", marginBottom: 4 }}>
              {file?.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {file?.versionsCount} version{file?.versionsCount !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{file?.size} bytes</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            to={`/repos/${repoId}/files/${fileId}/create-pr`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600,
              borderRadius: 10, boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"; }}
          >
            <GitPullRequest size={14} />
            Create PR
          </Link>
          <button
            onClick={() => { if (confirm("Delete this file?")) handleDelete(); }}
            style={{
              width: 36, height: 36, borderRadius: 9, background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#f87171", transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Old-version banner */}
      {isViewingOld && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", marginBottom: 16,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <History size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
              Viewing v{viewedVersionNum} — "{viewedVersion?.message}"
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              by {viewedVersion?.updatedBy?.username || "unknown"} · {timeAgo(viewedVersion?.createdAt)}
            </span>
          </div>
          <button
            onClick={() => setSelectedVersionIdx(null)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", background: "rgba(5,150,105,0.1)",
              border: "1px solid rgba(5,150,105,0.25)", borderRadius: 8,
              color: "#34d399", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit"
            }}
          >
            <CheckCircle size={12} />
            Back to Current
          </button>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* Code pane */}
        <div style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${isViewingOld ? "rgba(245,158,11,0.35)" : "var(--border-default)"}`,
          borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileCode size={14} color="#8b949e" />
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {isViewingOld ? `Version ${viewedVersionNum} Content` : "Current Content"}
              </h2>
            </div>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99,
              ...(isViewingOld
                ? { background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }
                : { background: "rgba(5,150,105,0.1)", color: "#34d399", border: "1px solid rgba(5,150,105,0.2)" })
            }}>
              {isViewingOld ? `v${viewedVersionNum} of ${versions.length}` : "Latest version"}
            </span>
          </div>
          <div style={{ padding: 20 }}>
            <pre style={{
              fontSize: 13, color: "#c9d1d9",
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              overflow: "auto", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0
            }}>
              {displayContent || "No content yet"}
            </pre>
          </div>
        </div>

        {/* Version History sidebar */}
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          borderRadius: 14, overflow: "hidden", alignSelf: "start"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)"
          }}>
            <Clock size={14} color="#8b949e" />
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Version History</h2>
            <span style={{
              marginLeft: "auto", fontSize: 11, padding: "2px 7px", borderRadius: 99,
              background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)"
            }}>
              {versions.length}
            </span>
          </div>

          <div>
            {displayVersions.map((version, i) => {
              const originalIdx = versions.indexOf(version);
              const versionNum = originalIdx + 1;
              const isSelected = selectedVersionIdx === originalIdx;
              const isLatest = originalIdx === versions.length - 1;

              return (
                <div
                  key={version._id}
                  style={{
                    padding: "12px 18px",
                    borderBottom: i !== displayVersions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    background: isSelected ? "rgba(245,158,11,0.06)" : "transparent",
                    transition: "background 0.15s"
                  }}
                >
                  {/* Version badge + timestamp */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                        background: isLatest ? "rgba(5,150,105,0.1)" : "rgba(37,99,235,0.1)",
                        color: isLatest ? "#34d399" : "#60a5fa",
                        border: `1px solid ${isLatest ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`
                      }}>
                        v{versionNum}
                      </span>
                      {isLatest && (
                        <span style={{ fontSize: 10, color: "#34d399" }}>latest</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {timeAgo(version.createdAt)}
                    </span>
                  </div>

                  {/* Commit message */}
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3, lineHeight: 1.4 }}>
                    {version.message}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                    by {version.updatedBy?.username || "unknown"}
                  </p>

                  {/* View / Viewing button */}
                  {isSelected ? (
                    <button
                      onClick={() => setSelectedVersionIdx(null)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", background: "rgba(5,150,105,0.1)",
                        border: "1px solid rgba(5,150,105,0.25)", borderRadius: 6,
                        color: "#34d399", fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      <CheckCircle size={11} />
                      Viewing
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedVersionIdx(isLatest ? null : originalIdx)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px",
                        background: isLatest ? "rgba(5,150,105,0.08)" : "rgba(37,99,235,0.08)",
                        border: `1px solid ${isLatest ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`,
                        borderRadius: 6,
                        color: isLatest ? "#34d399" : "#60a5fa",
                        fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <Eye size={11} />
                      {isLatest ? "View Current" : "View"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {versions.length > 3 && (
            <button
              onClick={() => setShowAllVersions(!showAllVersions)}
              style={{
                width: "100%", padding: "10px 18px", background: "transparent",
                border: "none", borderTop: "1px solid var(--border-subtle)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, color: "#60a5fa", fontFamily: "inherit", transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {showAllVersions ? (
                <><ChevronUp size={12} />Show less</>
              ) : (
                <><ChevronDown size={12} />Show all {versions.length} versions</>
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FileDetailPage;