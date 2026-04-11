import { Link } from "react-router-dom";
import { GitPullRequest, Clock } from "lucide-react";
import { getPRStatusColor } from "../../utils/getStatusColor.js";
import truncate from "../../utils/truncate.js";
import { formatDate } from "../../utils/formatDate.js";

const PRCard = ({ pr, repoId }) => {
  const statusClass = getPRStatusColor(pr.status);

  return (
    <Link
      to={`/repos/${repoId}/prs/${pr._id}`}
      className="block bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitPullRequest className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
            {pr.title}
          </h3>
        </div>
        <span
          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${statusClass}`}
        >
          {pr.status}
        </span>
      </div>

      {pr.description && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {truncate(pr.description, 120)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(pr.createdAt)}
        </span>
        {pr.author?.username && (
          <span>by {pr.author.username}</span>
        )}
      </div>
    </Link>
  );
};

export default PRCard;
