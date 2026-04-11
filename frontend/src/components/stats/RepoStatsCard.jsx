import { GitPullRequest, FileCode, Users, CheckCircle, XCircle, Clock } from "lucide-react";

const StatItem = ({ label, value, icon: Icon, color = "text-blue-400" }) => (
  <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-gray-500">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <p className="text-2xl font-bold text-gray-100">{value ?? "—"}</p>
  </div>
);

const RepoStatsCard = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Repository Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatItem
          label="Total PRs"
          value={stats.totalPRs}
          icon={GitPullRequest}
          color="text-blue-400"
        />
        <StatItem
          label="Open PRs"
          value={stats.openPRs}
          icon={Clock}
          color="text-yellow-400"
        />
        <StatItem
          label="Merged PRs"
          value={stats.mergedPRs}
          icon={CheckCircle}
          color="text-green-400"
        />
        <StatItem
          label="Rejected PRs"
          value={stats.rejectedPRs}
          icon={XCircle}
          color="text-red-400"
        />
        <StatItem
          label="Total Files"
          value={stats.totalFiles}
          icon={FileCode}
          color="text-purple-400"
        />
        <StatItem
          label="Contributors"
          value={stats.totalContributors}
          icon={Users}
          color="text-pink-400"
        />
      </div>
    </div>
  );
};

export default RepoStatsCard;
