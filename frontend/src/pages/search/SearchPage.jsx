import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { globalSearch, fetchSuggestions } from "../../api/search.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import {
  Search,
  GitBranch,
  Users,
  FileCode,
  GitPullRequest,
  Globe,
  Lock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getPRStatusColor } from "../../utils/getStatusColor.js";

/* ─── Helpers ────────────────────────────────────────────────── */

const prBadge = (status) => {
  const map = {
    pending:  { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    accepted: { bg: "rgba(5,150,105,0.12)",   color: "#34d399", border: "rgba(5,150,105,0.25)" },
    rejected: { bg: "rgba(239,68,68,0.12)",   color: "#f87171", border: "rgba(239,68,68,0.25)" },
  };
  return map[status] || map.pending;
};

const SectionHeader = ({ icon: Icon, title, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
    <Icon size={15} color="#8b949e" />
    <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 99,
      background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-default)"
    }}>
      {count}
    </span>
  </div>
);

/* Icon + colour per suggestion type */
const SUGGESTION_META = {
  repository:  { icon: GitBranch,     color: "#34d399",  label: "Repo" },
  user:        { icon: Users,         color: "#60a5fa",  label: "User" },
  file:        { icon: FileCode,      color: "#a78bfa",  label: "File" },
  pullRequest: { icon: GitPullRequest, color: "#fbbf24", label: "PR"   },
};

/* ─── Single Suggestion Row ──────────────────────────────────── */

const SuggestionItem = ({ item, meta, onSelect }) => {
  const Icon = meta.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        /* mousedown fires before input blur — keep dropdown alive */
        e.preventDefault();
        onSelect(item.label);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", padding: "9px 14px",
        background: hovered ? "rgba(37,99,235,0.08)" : "transparent",
        border: "none", cursor: "pointer",
        textAlign: "left", transition: "background 0.1s",
        outline: "none",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: `${meta.color}18`,
        border: `1px solid ${meta.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={12} color={meta.color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
          marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {item.label}
        </p>
        {item.sublabel && (
          <p style={{
            fontSize: 11, color: "var(--text-muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {item.sublabel}
          </p>
        )}
      </div>
    </button>
  );
};

/* ─── Suggestion Dropdown ────────────────────────────────────── */

const SuggestionDropdown = ({ suggestions, isLoading, error, query, onSelect }) => {
  if (!query || query.trim().length < 2) return null;

  const containerStyle = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
    zIndex: 100,
    overflow: "hidden",
    maxHeight: 340,
    overflowY: "auto",
  };

  if (isLoading) {
    return (
      <div className="suggestions-dropdown" style={containerStyle}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", color: "var(--text-muted)", fontSize: 13
        }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Searching…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggestions-dropdown" style={containerStyle}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", color: "#f87171", fontSize: 13
        }}>
          <AlertCircle size={14} />
          Could not load suggestions
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-dropdown" style={containerStyle}>
        <div style={{
          padding: "14px 16px", color: "var(--text-muted)", fontSize: 13, textAlign: "center"
        }}>
          No suggestions for "{query}"
        </div>
      </div>
    );
  }

  const grouped = suggestions.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  const typeOrder = ["repository", "user", "file", "pullRequest"];

  return (
    <div className="suggestions-dropdown" style={containerStyle}>
      {typeOrder
        .filter((t) => grouped[t]?.length > 0)
        .map((type, groupIdx) => {
          const meta = SUGGESTION_META[type];
          const Icon = meta.icon;
          const items = grouped[type];
          return (
            <div key={type}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px 4px",
                borderTop: groupIdx > 0 ? "1px solid var(--border-subtle)" : "none",
                marginTop: groupIdx > 0 ? 2 : 0,
              }}>
                <Icon size={11} color={meta.color} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  color: "var(--text-muted)", textTransform: "uppercase"
                }}>
                  {meta.label}s
                </span>
              </div>
              {items.map((item) => (
                <SuggestionItem key={item._id} item={item} meta={meta} onSelect={onSelect} />
              ))}
            </div>
          );
        })}

      <div style={{
        padding: "8px 14px",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: 11, color: "var(--text-muted)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span>↵ to search all results</span>
        <span style={{ color: "#484f58" }}>esc to close</span>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────── */

const SearchPage = () => {
  /* ── Existing state (unchanged) ─────────────────────────── */
  const [query, setQuery]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* ── New autocomplete state ──────────────────────────────── */
  const [debouncedQuery, setDebouncedQuery]             = useState("");
  const [suggestions, setSuggestions]                   = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError]         = useState(null);
  const [showDropdown, setShowDropdown]                 = useState(false);

  const searchWrapperRef = useRef(null);

  /* ─────────────────────────────────────────────────────────
     DEBOUNCE — 300ms timer, resets on every keystroke.
     Clears immediately when the input is emptied.
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setSuggestions([]);
      setShowDropdown(false);
      setSuggestionsError(null);
      return;
    }

    const timerId = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timerId);
  }, [query]);

  /* ─────────────────────────────────────────────────────────
     FETCH SUGGESTIONS — fires only when debouncedQuery settles
     and is at least 2 characters long.
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsSuggestionsLoading(true);
      setSuggestionsError(null);
      try {
        const res = await fetchSuggestions(debouncedQuery);
        if (!cancelled) {
          setSuggestions(res.data?.data?.suggestions ?? []);
          setShowDropdown(true);
        }
      } catch (err) {
        if (!cancelled) {
          setSuggestionsError(err);
          setSuggestions([]);
          setShowDropdown(true);
        }
      } finally {
        if (!cancelled) setIsSuggestionsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  /* ─────────────────────────────────────────────────────────
     CLICK OUTSIDE — closes dropdown
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─────────────────────────────────────────────────────────
     EXISTING FULL SEARCH QUERY (unchanged)
  ───────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: () => globalSearch(searchTerm),
    enabled: searchTerm.length > 0
  });

  const results = data?.data?.data;

  /* ─────────────────────────────────────────────────────────
     EXISTING FULL SEARCH HANDLER (unchanged)
  ───────────────────────────────────────────────────────── */
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      setShowDropdown(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     SUGGESTION CLICK — fill input + trigger full search
  ───────────────────────────────────────────────────────── */
  const handleSuggestionSelect = useCallback((label) => {
    setQuery(label);
    setSearchTerm(label);
    setShowDropdown(false);
    setSuggestions([]);
  }, []);

  /* ─────────────────────────────────────────────────────────
     KEY HANDLER — Escape closes dropdown
  ───────────────────────────────────────────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === "Escape") setShowDropdown(false);
  };

  /* ───────────────────────────────────────────────────────── */

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px", marginBottom: 4 }}>
            Search
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Search across repositories, users, files, and pull requests
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <div ref={searchWrapperRef} style={{ flex: 1, position: "relative" }}>
            <Search
              size={15}
              color="#484f58"
              style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1
              }}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) setShowDropdown(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0 || isSuggestionsLoading) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search repositories, users, files, PRs…"
              autoComplete="off"
              style={{
                width: "100%", background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)", borderRadius: 12,
                paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                fontSize: 14, color: "var(--text-primary)", outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "inherit", boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <SuggestionDropdown
                suggestions={suggestions}
                isLoading={isSuggestionsLoading}
                error={suggestionsError}
                query={query}
                onSelect={handleSuggestionSelect}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!query.trim()}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              opacity: !query.trim() ? 0.5 : 1
            }}
            onMouseEnter={e => { if (query.trim()) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"; }}
          >
            Search
          </button>
        </form>

        {/* ── Existing full-search results (completely unchanged) ── */}

        {isLoading && <Loader />}

        {!searchTerm && !isLoading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
              background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Search size={22} color="#60a5fa" />
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Type something to search</p>
          </div>
        )}

        {results && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Repositories */}
            {results.repositories?.total > 0 && (
              <div>
                <SectionHeader icon={GitBranch} title="Repositories" count={results.repositories.total} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.repositories.results.map((repo) => (
                    <Link
                      key={repo._id}
                      to={`/repos/${repo._id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 18px",
                        background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                        borderRadius: 12, textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: repo.visibility === "public" ? "rgba(5,150,105,0.12)" : "rgba(37,99,235,0.12)",
                          border: `1px solid ${repo.visibility === "public" ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {repo.visibility === "public" ? <Globe size={14} color="#34d399" /> : <Lock size={14} color="#60a5fa" />}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{repo.name}</p>
                          {repo.description && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{repo.description}</p>
                          )}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 99,
                        background: repo.visibility === "public" ? "rgba(5,150,105,0.1)" : "rgba(37,99,235,0.1)",
                        color: repo.visibility === "public" ? "#34d399" : "#60a5fa",
                        border: `1px solid ${repo.visibility === "public" ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`
                      }}>
                        {repo.visibility}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users?.total > 0 && (
              <div>
                <SectionHeader icon={Users} title="Users" count={results.users.total} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.users.results.map((user) => (
                    <div
                      key={user._id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                        background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 12
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "#fff"
                      }}>
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{user.username}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.fullName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {results.files?.total > 0 && (
              <div>
                <SectionHeader icon={FileCode} title="Files" count={results.files.total} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.files.results.map((file) => (
                    <div
                      key={file._id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                        background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 12
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <FileCode size={14} color="#60a5fa" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{file.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>in {file.repository?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pull Requests */}
            {results.pullRequests?.total > 0 && (
              <div>
                <SectionHeader icon={GitPullRequest} title="Pull Requests" count={results.pullRequests.total} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.pullRequests.results.map((pr) => {
                    const badge = prBadge(pr.status);
                    return (
                      <div
                        key={pr._id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 18px",
                          background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 12
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: badge.bg, border: `1px solid ${badge.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <GitPullRequest size={14} color={badge.color} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{pr.message}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>in {pr.repository?.name}</p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                        }}>
                          {pr.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results */}
            {results.repositories?.total === 0 &&
              results.users?.total === 0 &&
              results.files?.total === 0 &&
              results.pullRequests?.total === 0 && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 13, margin: "0 auto 14px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Search size={20} color="#3d4450" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                    No results
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Nothing found for "{searchTerm}"
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Spin keyframe for loading spinner inside dropdown */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default SearchPage;
