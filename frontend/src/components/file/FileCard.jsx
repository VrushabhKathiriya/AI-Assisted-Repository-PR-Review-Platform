import { Link } from "react-router-dom";
import { FileCode, Clock, GitPullRequest } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import truncate from "../../utils/truncate.js";

const FileCard = ({ file, repoId }) => {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/repos/${repoId}/files/${file._id}`}
          className="flex items-center gap-2 min-w-0 group"
        >
          <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
            {file.name}
          </h3>
        </Link>
        <Link
          to={`/repos/${repoId}/files/${file._id}/create-pr`}
          className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
        >
          <GitPullRequest className="w-3 h-3" />
          PR
        </Link>
      </div>

      {file.description && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {truncate(file.description, 80)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        {file.language && (
          <span className="px-1.5 py-0.5 bg-[#21262d] rounded text-gray-400">
            {file.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(file.updatedAt)}
        </span>
      </div>
    </div>
  );
};

export default FileCard;
