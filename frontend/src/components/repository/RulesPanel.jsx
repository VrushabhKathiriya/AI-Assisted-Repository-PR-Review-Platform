import { useQuery } from "@tanstack/react-query";
import { getRepoRules } from "../../api/repository.api.js";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import Loader from "../common/Loader.jsx";

const RULE_LABELS = {
  requireDescription: "PR must have description",
  requireLinkedIssue: "PR must reference an issue",
  requireApprovals: "Minimum approvals required",
  minApprovals: "Minimum approval count",
  blockMergeOnFailure: "Block merge on rule failure",
};

const RulesPanel = ({ repoId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["repoRules", repoId],
    queryFn: () => getRepoRules(repoId),
    enabled: !!repoId,
  });

  const rules = data?.data?.data;

  if (isLoading) return <Loader />;

  if (!rules) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <p className="text-sm text-gray-500">No rules configured yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">Repository Rules</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(rules).map(([key, value]) => {
          const label = RULE_LABELS[key] || key;
          if (typeof value === "boolean") {
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-[#21262d] last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                {value ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-600" />
                )}
              </div>
            );
          }
          if (typeof value === "number") {
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-[#21262d] last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-200 bg-[#21262d] px-2 py-0.5 rounded">
                  {value}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default RulesPanel;
