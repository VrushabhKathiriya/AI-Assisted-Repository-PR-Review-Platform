import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRepos } from "../../api/repository.api.js";
import { getUserStats } from "../../api/stats.api.js";
import { getMyActivity } from "../../api/activity.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import useAuthStore from "../../store/auth.store.js";
import { timeAgo } from "../../utils/formatDate.js";
import {
  GitBranch, GitPullRequest, Users,
  FileCode, Plus, Activity, ArrowRight,
  TrendingUp, Globe, Lock, Clock
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, gradient, glow }) => (
  <div style={{
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: 14,
    padding: "20px 22px",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default"
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = glow;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* glow blob */}
    <div style={{
      position: "absolute", top: -30, right: -30,
      width: 100, height: 100, borderRadius: "50%",
      background: gradient, opacity: 0.15, filter: "blur(20px)"
    }} />
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{
        width: 38, height: 38,
        background: gradient, borderRadius: 10, opacity: 0.9,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14
      }}>
        <Icon size={18} color="white" strokeWidth={2} />
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: "#e6edf3", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: "#8b949e", marginTop: 6, fontWeight: 500 }}>{label}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();

  const { data: reposData, isLoading } = useQuery({ queryKey: ["repos"], queryFn: getRepos });
  const { data: statsData } = useQuery({ queryKey: ["userStats"], queryFn: getUserStats });
  const { data: activityData } = useQuery({ queryKey: ["myActivity"], queryFn: () => getMyActivity(1) });

  const repos = reposData?.data?.data || [];
  const stats = statsData?.data?.data;
  const activities = activityData?.data?.data?.activities || [];

  const statCards = [
    {
      icon: GitBranch, label: "Repos Owned",
      value: stats?.overview?.reposOwned || 0,
      gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      glow: "0 8px 24px rgba(37,99,235,0.25)"
    },
    {
      icon: Users, label: "Contributing To",
      value: stats?.overview?.reposContributed || 0,
      gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)",
      glow: "0 8px 24px rgba(124,58,237,0.25)"
    },
    {
      icon: GitPullRequest, label: "Total PRs",
      value: stats?.pullRequests?.total || 0,
      gradient: "linear-gradient(135deg, #059669, #047857)",
      glow: "0 8px 24px rgba(5,150,105,0.25)"
    },
    {
      icon: TrendingUp, label: "Acceptance Rate",
      value: stats?.pullRequests?.acceptanceRate || "0%",
      gradient: "linear-gradient(135deg, #d97706, #b45309)",
      glow: "0 8px 24px rgba(217,119,6,0.25)"
    },
  ];

  return (
    <Layout>
      {/* ── Page header ──────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: "#e6edf3",
            letterSpacing: "-0.8px", marginBottom: 4
          }}>
            Welcome back, {user?.username} 👋
          </h1>
          <p style={{ color: "#8b949e", fontSize: 14 }}>
            Here's what's happening across your projects today.
          </p>
        </div>
        <Link to="/repos" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 18px",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#fff", textDecoration: "none",
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
          transition: "all 0.2s"
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.35)";
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Repository
        </Link>
      </div>

      {/* ── Stat cards ───────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16, marginBottom: 28
      }}>
        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Main content ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>

        {/* Recent repos */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 14, overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GitBranch size={15} color="#8b949e" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>Your Repositories</h2>
            </div>
            <Link to="/repos" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 500
            }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ padding: "8px 0" }}>
            {isLoading ? (
              <div style={{ padding: 24 }}><Loader /></div>
            ) : repos.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px",
                  background: "rgba(37,99,235,0.1)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <GitBranch size={20} color="#60a5fa" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#8b949e", marginBottom: 4 }}>
                  No repositories yet
                </p>
                <p style={{ fontSize: 12, color: "#484f58" }}>
                  Create your first repository to get started
                </p>
              </div>
            ) : (
              repos.slice(0, 5).map((repo) => (
                <Link key={repo._id} to={`/repos/${repo._id}`} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 20px",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(33,38,45,0.4)",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(33,38,45,0.5)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 36, height: 36, flexShrink: 0, borderRadius: 9,
                    background: repo.visibility === "public"
                      ? "rgba(5,150,105,0.12)"
                      : "rgba(37,99,235,0.12)",
                    border: `1px solid ${repo.visibility === "public" ? "rgba(5,150,105,0.2)" : "rgba(37,99,235,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {repo.visibility === "public"
                      ? <Globe size={15} color="#34d399" />
                      : <Lock size={15} color="#60a5fa" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: "#e6edf3",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {repo.name}
                    </p>
                    {repo.description && (
                      <p style={{
                        fontSize: 11, color: "#8b949e", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <Clock size={11} color="#484f58" />
                    <span style={{ fontSize: 11, color: "#484f58" }}>
                      {timeAgo(repo.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 14, overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <Activity size={15} color="#8b949e" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>Recent Activity</h2>
          </div>

          <div style={{ padding: "12px 20px" }}>
            {activities.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Activity size={28} color="#3d4450" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, color: "#484f58" }}>No activity yet</p>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* Timeline line */}
                <div style={{
                  position: "absolute", left: 7, top: 8, bottom: 8,
                  width: 1, background: "linear-gradient(to bottom, #30363d, transparent)"
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {activities.slice(0, 8).map((a, i) => (
                    <div key={a._id || i} style={{
                      display: "flex", gap: 14, paddingLeft: 4
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#2563eb",
                        border: "2px solid rgba(37,99,235,0.3)",
                        flexShrink: 0, marginTop: 5,
                        boxShadow: "0 0 6px rgba(37,99,235,0.4)"
                      }} />
                      <div>
                        <p style={{ fontSize: 12, color: "#c9d1d9", lineHeight: 1.5 }}>
                          {a.message}
                        </p>
                        <p style={{ fontSize: 11, color: "#484f58", marginTop: 3 }}>
                          {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;