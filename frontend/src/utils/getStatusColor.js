export const getPRStatusColor = (status) => {
  switch (status) {
    case "pending": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "accepted": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "rejected": return "bg-red-500/20 text-red-400 border border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400";
  }
};

export const getAIStatusColor = (status) => {
  switch (status) {
    case "good": return "text-green-400";
    case "bad": return "text-red-400";
    default: return "text-gray-400";
  }
};

export const getIssueTypeColor = (type) => {
  switch (type) {
    case "critical": return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "warning": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "suggestion": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    default: return "bg-gray-500/20 text-gray-400";
  }
};