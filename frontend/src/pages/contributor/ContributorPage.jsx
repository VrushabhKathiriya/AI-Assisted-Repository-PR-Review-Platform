import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContributors, addContributor,
  inviteContributor, removeContributor,
  getPendingInvitations, cancelInvitation
} from "../../api/contributor.api.js";
import { getRepoById } from "../../api/repository.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";
import {
  Users, UserPlus, Mail, X, Trash2,
  Clock, Crown, Send
} from "lucide-react";

const S = {
  card: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 14, overflow: "hidden" },
  input: {
    flex: 1, background: "rgba(13,17,23,0.8)",
    border: "1px solid var(--border-default)", borderRadius: 10,
    padding: "9px 14px", fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit"
  },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "9px 18px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
    border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)", flexShrink: 0
  },
};

const ContributorPage = () => {
  const { repoId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [addUsername, setAddUsername] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [activeTab, setActiveTab] = useState("contributors");

  const { data: repoData } = useQuery({ queryKey: ["repo", repoId], queryFn: () => getRepoById(repoId) });
  const { data: contributorsData, isLoading } = useQuery({ queryKey: ["contributors", repoId], queryFn: () => getContributors(repoId) });
  const { data: invitationsData } = useQuery({
    queryKey: ["invitations", repoId],
    queryFn: () => getPendingInvitations(repoId),
    enabled: repoData?.data?.data?.owner?._id === user?._id
  });

  const repo = repoData?.data?.data;
  const contributors = contributorsData?.data?.data?.contributors || [];
  const owner = contributorsData?.data?.data?.owner;
  const invitations = invitationsData?.data?.data?.invitations || [];
  const isOwner = repo?.owner?._id === user?._id || repo?.owner === user?._id;

  const { mutate: handleAdd, isPending: adding } = useMutation({
    mutationFn: () => addContributor(repoId, { username: addUsername }),
    onSuccess: () => { toast.success("Invitation sent! They'll join once they accept."); setAddUsername(""); queryClient.invalidateQueries({ queryKey: ["contributors", repoId] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: handleInvite, isPending: inviting } = useMutation({
    mutationFn: () => inviteContributor(repoId, { username: inviteUsername }),
    onSuccess: () => { toast.success("Invitation sent!"); setInviteUsername(""); queryClient.invalidateQueries({ queryKey: ["invitations", repoId] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: handleRemove } = useMutation({
    mutationFn: (userId) => removeContributor(repoId, userId),
    onSuccess: () => { toast.success("Contributor removed"); queryClient.invalidateQueries({ queryKey: ["contributors", repoId] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const { mutate: handleCancelInvite } = useMutation({
    mutationFn: (invitationId) => cancelInvitation(invitationId),
    onSuccess: () => { toast.success("Invitation cancelled"); queryClient.invalidateQueries({ queryKey: ["invitations", repoId] }); }
  });

  const inputFocus = (e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.25)"; };
  const inputBlur = (e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; };

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
          }}>
            <Users size={16} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>
            Contributors
          </h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, paddingLeft: 48 }}>
          {contributors.length + 1} member{contributors.length !== 0 ? "s" : ""} total
        </p>
      </div>

      {/* Add / Invite panels (owner only) */}
      {isOwner && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Add by username */}
          <div style={{ ...S.card, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <UserPlus size={13} color="#60a5fa" />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Add by Username</h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="username"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                style={S.input}
                onFocus={inputFocus} onBlur={inputBlur}
              />
              <button
                onClick={() => handleAdd()}
                disabled={adding || !addUsername.trim()}
                style={{ ...S.btnPrimary, opacity: (adding || !addUsername.trim()) ? 0.5 : 1 }}
              >
                {adding ? "..." : "Add"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Sends in-app notification — user must accept to join</p>
          </div>

          {/* Invite by email */}
          <div style={{ ...S.card, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Mail size={13} color="#a78bfa" />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Invite by Username</h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="username"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                style={S.input}
                onFocus={inputFocus} onBlur={inputBlur}
              />
              <button
                onClick={() => handleInvite()}
                disabled={inviting || !inviteUsername.trim()}
                style={{
                  ...S.btnPrimary,
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                  opacity: (inviting || !inviteUsername.trim()) ? 0.5 : 1
                }}
              >
                <Send size={13} />
                {inviting ? "..." : "Invite"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Sends invitation email</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "inline-flex", gap: 4, background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)", borderRadius: 12,
        padding: 4, marginBottom: 20
      }}>
        <button
          onClick={() => setActiveTab("contributors")}
          style={{
            padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500,
            border: "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            ...(activeTab === "contributors"
              ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
              : { background: "transparent", color: "var(--text-secondary)" })
          }}
        >
          Contributors ({contributors.length})
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab("invitations")}
            style={{
              padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              ...(activeTab === "invitations"
                ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
                : { background: "transparent", color: "var(--text-secondary)" })
            }}
          >
            Pending ({invitations.length})
          </button>
        )}
      </div>

      {/* Contributors List */}
      {activeTab === "contributors" && (
        <div style={S.card}>
          {isLoading ? <Loader /> : (
            <div>
              {/* Owner */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#fff"
                }}>
                  {owner?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{owner?.username}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{owner?.email}</p>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 99,
                  background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)"
                }}>
                  <Crown size={11} />
                  Owner
                </div>
              </div>

              {contributors.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <Users size={28} color="#3d4450" style={{ margin: "0 auto 8px", display: "block" }} />
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No contributors yet</p>
                </div>
              ) : (
                contributors.map((contributor) => (
                  <div key={contributor._id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 20px", borderTop: "1px solid var(--border-subtle)"
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: "#fff"
                    }}>
                      {contributor?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{contributor?.username}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{contributor?.email}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)"
                    }}>
                      Contributor
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => { if (confirm(`Remove ${contributor.username}?`)) handleRemove(contributor._id); }}
                        style={{
                          width: 30, height: 30, borderRadius: 7, background: "transparent",
                          border: "1px solid transparent", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--text-muted)", transition: "all 0.15s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "transparent"; }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Invitations */}
      {activeTab === "invitations" && (
        <div style={S.card}>
          {invitations.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <Clock size={28} color="#3d4450" style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No pending invitations</p>
            </div>
          ) : (
            <div>
              {invitations.map((inv, i) => (
                <div key={inv._id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px",
                  borderBottom: i !== invitations.length - 1 ? "1px solid var(--border-subtle)" : "none"
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, #484f58, #30363d)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: "#8b949e"
                  }}>
                    {inv.invitedUser?.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{inv.invitedUser?.username}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{inv.email}</p>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                    background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)"
                  }}>
                    <Clock size={10} />
                    Pending
                  </span>
                  <button
                    onClick={() => handleCancelInvite(inv._id)}
                    style={{
                      width: 30, height: 30, borderRadius: 7, background: "transparent",
                      border: "1px solid transparent", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-muted)", transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "transparent"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ContributorPage;