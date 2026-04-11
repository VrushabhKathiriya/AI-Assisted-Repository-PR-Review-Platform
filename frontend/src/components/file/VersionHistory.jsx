import { History, Clock, User } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";

const VersionHistory = ({ versions = [] }) => {
  if (versions.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Version History</h3>
        </div>
        <p className="text-sm text-gray-500">No version history yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#30363d]">
        <History className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">
          Version History ({versions.length})
        </h3>
      </div>
      <div className="divide-y divide-[#21262d]">
        {versions.map((v, i) => (
          <div key={v._id || i} className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
              v{versions.length - i}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(v.savedAt || v.createdAt)}</span>
                {v.savedBy?.username && (
                  <>
                    <User className="w-3 h-3" />
                    <span>{v.savedBy.username}</span>
                  </>
                )}
              </div>
            </div>
            {i === 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                current
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;
