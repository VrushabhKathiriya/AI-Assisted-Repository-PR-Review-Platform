import { GitPullRequest, Clock, User, FileText } from "lucide-react";
import { getPRStatusColor } from "../../utils/getStatusColor.js";
import { formatDate } from "../../utils/formatDate.js";
import Loader from "../common/Loader.jsx";

const PRDetail = ({ pr }) => {
  if (!pr) return <Loader />;

  const statusClass = getPRStatusColor(pr.status);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 rounded-lg border border-blue-600/20">
            <GitPullRequest className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">{pr.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}
              >
                {pr.status}
              </span>
              {pr.author?.username && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  {pr.author.username}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatDate(pr.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {pr.description && (
        <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Description
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {pr.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default PRDetail;
