import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPRsByRepo } from "../../api/pullRequest.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import { timeAgo } from "../../utils/formatDate.js";
import { GitPullRequest, CheckCircle, XCircle, Clock } from "lucide-react";

const prBadge = (status) => {
  const map = {
    pending: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
    accepted: { bg: "rgba(5,150,105,0.12)", color: "#34d399", border: "rgba(5,150,105,0.25)" },
    rejected: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
  };
  return map[status] || map.pending;
};

const PRListPage = () => {
  const { repoId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["prs", repoId],
    queryFn: () => getPRsByRepo(repoId)
  });

  const prs = data?.data?.data || [];

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px", marginBottom: 4 }}>
            Pull Requests
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {prs.length} total pull request{prs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 32, height: 26, padding: "0 10px",
          background: "var(--bg-overlay)", border: "1px solid var(--border-default)",
          borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)"
        }}>
          {prs.length}
        </span>
      </div>

      {isLoading ? (
        <Loader />
      ) : prs.length === 0 ? (
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          borderRadius: 14, padding: "60px 20px", textAlign: "center"
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, margin: "0 auto 14px",
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <GitPullRequest size={22} color="#a78bfa" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            No pull requests
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Create a pull request to propose changes to a file
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {prs.map((pr) => {
            const badge = prBadge(pr.status);
            return (
              <Link
                key={pr._id}
                to={`/repos/${repoId}/prs/${pr._id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                  borderRadius: 14, padding: "16px 20px", textDecoration: "none",
                  transition: "border-color 0.2s, transform 0.15s, box-shadow 0.15s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: badge.bg, border: `1px solid ${badge.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <GitPullRequest size={16} color={badge.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {pr.message}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {pr.file?.name}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>·</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        by {pr.createdBy?.username}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>·</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(pr.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  {/* Rule check indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {pr.ruleResult?.passed ? (
                      <>
                        <CheckCircle size={13} color="#34d399" />
                        <span style={{ fontSize: 11, color: "#34d399", fontWeight: 500 }}>Rules OK</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} color="#f87171" />
                        <span style={{ fontSize: 11, color: "#f87171", fontWeight: 500 }}>
                          {pr.ruleResult?.issues?.length} issue{pr.ruleResult?.issues?.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                  }}>
                    {pr.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default PRListPage;