import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRepos, createRepo } from "../../api/repository.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import toast from "react-hot-toast";
import { GitBranch, Plus, Lock, Globe, X, Clock } from "lucide-react";
import { timeAgo } from "../../utils/formatDate.js";

const S = {
  card: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 14, overflow: "hidden" },
  label: { display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 },
  input: {
    width: "100%", background: "rgba(13,17,23,0.8)",
    border: "1px solid var(--border-default)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit"
  },
  textarea: {
    width: "100%", background: "rgba(13,17,23,0.8)",
    border: "1px solid var(--border-default)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s", fontFamily: "inherit",
    resize: "none"
  },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
    border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
  },
  btnGhost: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "10px 16px", background: "transparent",
    border: "1px solid var(--border-default)", color: "var(--text-secondary)",
    fontSize: 14, borderRadius: 10, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit"
  },
};

const CreateRepoModal = ({ onClose, queryClient }) => {
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });

  const { mutate, isPending } = useMutation({
    mutationFn: createRepo,
    onSuccess: () => {
      toast.success("Repository created!");
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 16,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div style={{
        position: "relative", zIndex: 1,
        background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
        borderRadius: 16, width: "100%", maxWidth: 460, padding: 24,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        animation: "modal-in 0.18s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <GitBranch size={15} color="white" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Create Repository</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Repository Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my-awesome-project"
              style={S.input}
              onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.25)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div>
            <label style={S.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description..."
              rows={3}
              style={S.textarea}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "var(--border-default)"}
            />
          </div>

          <div>
            <label style={S.label}>Visibility</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { value: "private", icon: Lock, label: "Private", desc: "Only you and contributors" },
                { value: "public", icon: Globe, label: "Public", desc: "Anyone can view" }
              ].map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, visibility: value })}
                  style={{
                    padding: "12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                    border: form.visibility === value
                      ? "1px solid rgba(37,99,235,0.6)"
                      : "1px solid var(--border-default)",
                    background: form.visibility === value
                      ? "rgba(37,99,235,0.1)"
                      : "rgba(13,17,23,0.5)",
                    transition: "all 0.15s"
                  }}
                >
                  <Icon size={15} color={form.visibility === value ? "#60a5fa" : "#8b949e"} style={{ marginBottom: 6 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: form.visibility === value ? "#60a5fa" : "var(--text-primary)" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ ...S.btnGhost, flex: 1 }}>Cancel</button>
            <button
              onClick={() => mutate(form)}
              disabled={isPending || !form.name.trim()}
              style={{ ...S.btnPrimary, flex: 1, opacity: (isPending || !form.name.trim()) ? 0.5 : 1 }}
            >
              {isPending ? "Creating..." : "Create Repository"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const RepositoryListPage = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["repos"], queryFn: getRepos });
  const repos = data?.data?.data || [];

  return (
    <Layout>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px", marginBottom: 4 }}>
            Repositories
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {repos.length} {repos.length === 1 ? "repository" : "repositories"} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={S.btnPrimary}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"; }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Repository
        </button>
      </div>

      {isLoading ? (
        <Loader />
      ) : repos.length === 0 ? (
        <div style={{
          ...S.card, padding: "60px 20px", textAlign: "center"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <GitBranch size={24} color="#60a5fa" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            No repositories yet
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Create your first repository to get started
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ ...S.btnPrimary, margin: "0 auto" }}
          >
            <Plus size={15} />
            Create Repository
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {repos.map((repo) => (
            <Link
              key={repo._id}
              to={`/repos/${repo._id}`}
              style={{
                ...S.card,
                padding: "18px 20px",
                textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "border-color 0.2s, transform 0.15s, box-shadow 0.15s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 10,
                  background: repo.visibility === "public" ? "rgba(5,150,105,0.12)" : "rgba(37,99,235,0.12)",
                  border: `1px solid ${repo.visibility === "public" ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {repo.visibility === "public"
                    ? <Globe size={17} color="#34d399" />
                    : <Lock size={17} color="#60a5fa" />}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                    {repo.name}
                  </p>
                  {repo.description && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{repo.description}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {repo.contributors?.length || 0} contributors
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>·</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(repo.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
                fontSize: 11, fontWeight: 500,
                padding: "4px 10px", borderRadius: 99,
                ...(repo.visibility === "public"
                  ? { background: "rgba(5,150,105,0.1)", color: "#34d399", border: "1px solid rgba(5,150,105,0.2)" }
                  : { background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.2)" })
              }}>
                {repo.visibility === "public" ? <Globe size={10} /> : <Lock size={10} />}
                {repo.visibility}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateRepoModal
          onClose={() => setShowModal(false)}
          queryClient={queryClient}
        />
      )}
    </Layout>
  );
};

export default RepositoryListPage;