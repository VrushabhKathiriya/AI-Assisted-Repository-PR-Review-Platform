import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const statusIcon = {
  passed: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-yellow-400" />,
};

const RuleResultPanel = ({ ruleResults }) => {
  if (!ruleResults || ruleResults.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Rule Results</h3>
        </div>
        <p className="text-sm text-gray-500">No rule checks have been run.</p>
      </div>
    );
  }

  const passed = ruleResults.filter((r) => r.status === "passed").length;
  const total = ruleResults.length;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Rule Results</h3>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            passed === total
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {passed}/{total} passed
        </span>
      </div>
      <div className="space-y-2">
        {ruleResults.map((rule, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 px-3 bg-[#0d1117] rounded-lg"
          >
            <div className="flex items-center gap-2">
              {statusIcon[rule.status] || <AlertCircle className="w-4 h-4 text-gray-500" />}
              <span className="text-sm text-gray-300">{rule.ruleName}</span>
            </div>
            {rule.message && (
              <span className="text-xs text-gray-500 max-w-[200px] text-right truncate">
                {rule.message}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RuleResultPanel;
