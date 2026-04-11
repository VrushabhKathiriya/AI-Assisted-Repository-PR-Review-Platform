import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepoById, updateRepo, getRepoRules } from "../../api/repository.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import toast from "react-hot-toast";
import { Settings, Plus, Trash2, Globe, Lock, Shield, Check } from "lucide-react";

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
    outline: "none", transition: "border-color 0.15s", fontFamily: "inherit", resize: "none"
  },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
    border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)", width: "100%"
  },
  numInput: {
    width: 80, background: "var(--bg-overlay)", border: "1px solid var(--border-default)",
    borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "var(--text-primary)",
    outline: "none", fontFamily: "inherit", textAlign: "center"
  }
};

/* ── Controlled number input row ─────────────────────────────────────────────
   Keeps its own local value so the input does NOT jump when the parent
   re-renders after a mutation + query invalidation.
────────────────────────────────────────────────────────────────────────────── */
const NumberRuleRow = ({ rule, value, onUpdate, onDelete, updatingRules }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [dirty, setDirty] = useState(false);

  const handleCommit = () => {
    const num = Number(localValue);
    if (!isNaN(num) && num !== value) {
      onUpdate(rule, num);
    }
    setDirty(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", background: "rgba(13,17,23,0.6)",
      borderRadius: 10, border: "1px solid var(--border-subtle)"
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{rule}</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>type: number · current: {value}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          value={localValue}
          onChange={(e) => { setLocalValue(e.target.value); setDirty(true); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); } }}
          onBlur={handleCommit}
          style={S.numInput}
        />
        {dirty && (
          <button
            onClick={handleCommit}
            style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#4ade80",
              display: "flex", alignItems: "center"
            }}
            title="Save"
          >
            <Check size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(rule)}
          disabled={updatingRules}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 6, borderRadius: 6, color: "#f87171", transition: "background 0.15s",
            opacity: updatingRules ? 0.5 : 1
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */

const RepositorySettingsPage = () => {
  const { repoId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [formSynced, setFormSynced] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });

  const { data: repoData, isLoading } = useQuery({
    queryKey: ["repo", repoId],
    queryFn: () => getRepoById(repoId)
  });
  const { data: rulesData } = useQuery({
    queryKey: ["repoRules", repoId],
    queryFn: () => getRepoRules(repoId)
  });

  const repo = repoData?.data?.data;
  const allowedRules = rulesData?.data?.data?.allowedRules || {};
  const activeRules = rulesData?.data?.data?.activeRules || {};

  // Sync form once when repo data arrives (avoids overwriting user edits)
  if (repo && !formSynced) {
    setForm({ name: repo.name || "", description: repo.description || "", visibility: repo.visibility || "private" });
    setFormSynced(true);
  }

  const { mutate: updateGeneral, isPending: updating } = useMutation({
    mutationFn: (data) => updateRepo(repoId, data),
    onSuccess: () => {
      toast.success("Repository updated!");
      queryClient.invalidateQueries({ queryKey: ["repo", repoId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Update failed")
  });

  const { mutate: updateRules, isPending: updatingRules } = useMutation({
    mutationFn: (data) => updateRepo(repoId, data),
    onSuccess: () => {
      toast.success("Rules updated!");
      queryClient.invalidateQueries({ queryKey: ["repoRules", repoId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Rules update failed")
  });

  const handleAddRule = useCallback((ruleName) => {
    const ruleInfo = allowedRules[ruleName];
    if (!ruleInfo) return;
    const value = ruleInfo.type === "boolean" ? true : ruleInfo.default;
    updateRules({ rulesToAdd: [{ rule: ruleName, value }] });
  }, [allowedRules, updateRules]);

  const handleDeleteRule = useCallback((ruleName) => {
    updateRules({ rulesToDelete: [ruleName] });
  }, [updateRules]);

  const handleUpdateRule = useCallback((ruleName, value) => {
    updateRules({ rulesToUpdate: [{ rule: ruleName, value }] });
  }, [updateRules]);

  const inactiveRules = Object.keys(allowedRules).filter((r) => activeRules[r] === undefined);

  if (isLoading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "linear-gradient(135deg, #484f58, #30363d)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Settings size={16} color="#8b949e" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
            Repository Settings
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{repo?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "inline-flex", gap: 4, background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)", borderRadius: 12,
        padding: 4, marginBottom: 24
      }}>
        {["general", "rules"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              textTransform: "capitalize",
              ...(activeTab === tab
                ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
                : { background: "transparent", color: "var(--text-secondary)" })
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── General Tab ── */}
      {activeTab === "general" && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ ...S.card, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              General Settings
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>Repository Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  rows={3}
                  style={S.textarea}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border-default)"}
                />
              </div>
              <div>
                <label style={S.label}>Visibility</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["private", "public"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setForm({ ...form, visibility: v })}
                      style={{
                        flex: 1, padding: "10px 16px", borderRadius: 10,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        border: form.visibility === v ? "1px solid rgba(37,99,235,0.6)" : "1px solid var(--border-default)",
                        background: form.visibility === v ? "rgba(37,99,235,0.1)" : "rgba(13,17,23,0.5)",
                        color: form.visibility === v ? "#60a5fa" : "var(--text-secondary)",
                        transition: "all 0.15s", textTransform: "capitalize",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        fontFamily: "inherit"
                      }}
                    >
                      {v === "private" ? <Lock size={13} /> : <Globe size={13} />}
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => updateGeneral(form)}
                disabled={updating}
                style={{ ...S.btnPrimary, marginTop: 4, opacity: updating ? 0.5 : 1 }}
              >
                {updating ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>

          {/* Active Rules */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Shield size={15} color="#60a5fa" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Active Rules</h2>
              <span style={{
                marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 99,
                background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.2)"
              }}>
                {Object.keys(activeRules).length} active
              </span>
            </div>

            {Object.keys(activeRules).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                No rules configured yet. Add rules from the section below.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(activeRules).map(([rule, value]) =>
                  allowedRules[rule]?.type === "boolean" ? (
                    /* Boolean toggle */
                    <div key={rule} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "rgba(13,17,23,0.6)",
                      borderRadius: 10, border: "1px solid var(--border-subtle)"
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{rule}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          type: boolean · {value ? "enabled" : "disabled"}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          onClick={() => handleUpdateRule(rule, !value)}
                          disabled={updatingRules}
                          title={value ? "Click to disable" : "Click to enable"}
                          style={{
                            position: "relative", width: 40, height: 22, borderRadius: 99,
                            border: "none", cursor: updatingRules ? "not-allowed" : "pointer",
                            transition: "background 0.2s",
                            background: value ? "#2563eb" : "var(--border-muted)",
                            opacity: updatingRules ? 0.6 : 1, flexShrink: 0
                          }}
                        >
                          <div style={{
                            position: "absolute", top: 3, width: 16, height: 16,
                            background: "#fff", borderRadius: "50%", transition: "transform 0.2s",
                            transform: value ? "translateX(21px)" : "translateX(3px)"
                          }} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          disabled={updatingRules}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: 6, borderRadius: 6, color: "#f87171",
                            opacity: updatingRules ? 0.5 : 1
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Number — controlled, no jump */
                    <NumberRuleRow
                      key={rule}
                      rule={rule}
                      value={value}
                      onUpdate={handleUpdateRule}
                      onDelete={handleDeleteRule}
                      updatingRules={updatingRules}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {/* Available Rules */}
          {inactiveRules.length > 0 && (
            <div style={{ ...S.card, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>
                Available Rules
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inactiveRules.map((rule) => (
                  <div key={rule} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", background: "rgba(13,17,23,0.6)",
                    borderRadius: 10, border: "1px solid var(--border-subtle)"
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{rule}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        type: {allowedRules[rule]?.type} · default: {String(allowedRules[rule]?.default)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddRule(rule)}
                      disabled={updatingRules}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, padding: "6px 14px", borderRadius: 8,
                        background: "rgba(37,99,235,0.1)", color: "#60a5fa",
                        border: "1px solid rgba(37,99,235,0.25)", cursor: "pointer",
                        fontFamily: "inherit", fontWeight: 500, transition: "background 0.15s",
                        opacity: updatingRules ? 0.5 : 1
                      }}
                      onMouseEnter={e => !updatingRules && (e.currentTarget.style.background = "rgba(37,99,235,0.2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(37,99,235,0.1)")}
                    >
                      <Plus size={12} />
                      {updatingRules ? "Adding…" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default RepositorySettingsPage;