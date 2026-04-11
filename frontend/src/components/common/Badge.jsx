const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    green: "bg-green-500/20 text-green-400 border border-green-500/30",
    red: "bg-red-500/20 text-red-400 border border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border border-purple-500/30"
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

export default Badge;