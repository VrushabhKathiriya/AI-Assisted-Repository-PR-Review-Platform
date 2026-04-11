const Loader = ({ size = "md", text }) => {
  const sizes = { sm: 20, md: 32, lg: 48 };
  const s = sizes[size];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: size === "lg" ? "60px 20px" : "30px 20px",
      gap: 12
    }}>
      <div style={{ width: s, height: s, position: "relative" }}>
        <svg width={s} height={s} viewBox="0 0 50 50" style={{ animation: "spin 0.9s linear infinite" }}>
          <defs>
            <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="25" cy="25" r="20"
            fill="none"
            stroke="url(#spinner-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="100 28"
          />
        </svg>
      </div>
      {text && (
        <p style={{ fontSize: 13, color: "#8b949e" }}>{text}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Loader;