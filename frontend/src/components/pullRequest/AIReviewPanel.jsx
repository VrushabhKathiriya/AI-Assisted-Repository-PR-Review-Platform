import { Bot, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const AIReviewPanel = ({ aiReview }) => {
  const [expanded, setExpanded] = useState(true);

  if (!aiReview) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">AI Review</h3>
        </div>
        <p className="text-sm text-gray-500">No AI review generated yet.</p>
      </div>
    );
  }

  const statusIcon = {
    approved: <CheckCircle className="w-4 h-4 text-green-400" />,
    rejected: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#21262d] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">AI Review</h3>
          {aiReview.verdict && statusIcon[aiReview.verdict]}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#30363d]">
          {aiReview.summary && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Summary
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">{aiReview.summary}</p>
            </div>
          )}
          {aiReview.suggestions?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Suggestions
              </h4>
              <ul className="space-y-2">
                {aiReview.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-300 bg-[#0d1117] rounded-lg p-3"
                  >
                    <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aiReview.score !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Quality Score</span>
              <div className="flex-1 bg-[#0d1117] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${aiReview.score}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-200">
                {aiReview.score}/100
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIReviewPanel;
