import { Link } from "react-router-dom";
import { GitBranch, Star, Lock, Globe } from "lucide-react";
import truncate from "../../utils/truncate.js";

const RepoCard = ({ repo }) => {
  return (
    <Link
      to={`/repos/${repo._id}`}
      className="block bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
            {repo.name}
          </h3>
        </div>
        <span
          className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
            repo.visibility === "private"
              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              : "bg-green-500/10 text-green-400 border-green-500/20"
          }`}
        >
          {repo.visibility === "private" ? (
            <Lock className="w-3 h-3" />
          ) : (
            <Globe className="w-3 h-3" />
          )}
          {repo.visibility}
        </span>
      </div>

      {repo.description && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {truncate(repo.description, 100)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {repo.contributors?.length || 0} contributors
        </span>
        <span>
          Updated{" "}
          {new Date(repo.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
};

export default RepoCard;
