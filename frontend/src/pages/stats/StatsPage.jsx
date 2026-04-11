import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRepoStats } from "../../api/stats.api.js";
import Layout from "../../components/common/Layout.jsx";
import Loader from "../../components/common/Loader.jsx";
import { BarChart2, GitPullRequest, Sparkles, Users, AlertTriangle } from "lucide-react";

const StatsPage = () => {
  const { repoId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["repoStats", repoId],
    queryFn: () => getRepoStats(repoId)
  });

  if (isLoading) return <Layout><Loader /></Layout>;

  const stats = data?.data?.data;

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-5 h-5 text-blue-400" />
        <h1 className="text-xl font-bold text-white">Repository Stats</h1>
        <span className="text-gray-400 text-sm">/ {stats?.repository?.name}</span>
      </div>

      {/* PR Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total PRs", value: stats?.pullRequests?.total, color: "text-blue-400" },
          { label: "Accepted", value: stats?.pullRequests?.accepted, color: "text-green-400" },
          { label: "Rejected", value: stats?.pullRequests?.rejected, color: "text-red-400" },
          { label: "Acceptance Rate", value: stats?.pullRequests?.acceptanceRate, color: "text-yellow-400" }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI Review Stats */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-white">AI Review Stats</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Good Reviews</span>
              <span className="text-green-400 font-semibold">{stats?.aiReview?.good || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Bad Reviews</span>
              <span className="text-red-400 font-semibold">{stats?.aiReview?.bad || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Reviewed</span>
              <span className="text-white font-semibold">{stats?.aiReview?.totalReviewed || 0}</span>
            </div>
          </div>
        </div>

        {/* Top Rule Violations */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-white">Top Rule Violations</h2>
          </div>
          {stats?.topRuleViolations?.length === 0 ? (
            <p className="text-gray-500 text-sm">No violations yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.topRuleViolations?.map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 truncate mr-3">{v.rule}</span>
                  <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    {v.violations}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Active Contributors */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Most Active Contributors</h2>
          </div>
          {stats?.mostActiveContributors?.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.mostActiveContributors?.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {c.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white flex-1">{c.username}</span>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{c.prCount} PRs</p>
                    <p className="text-xs text-green-400">{c.acceptedCount} accepted</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitPullRequest className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-white">Most Updated Files</h2>
          </div>
          {stats?.files?.mostUpdated?.length === 0 ? (
            <p className="text-gray-500 text-sm">No files yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.files?.mostUpdated?.map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{f.name}</span>
                  <span className="text-xs text-gray-500">{f.versionsCount} versions</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StatsPage;