const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 24px", textAlign: "center"
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: "rgba(37,99,235,0.08)",
      border: "1px solid rgba(37,99,235,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 16
    }}>
      {Icon && <Icon size={24} color="#60a5fa" strokeWidth={1.5} />}
    </div>
    <h3 style={{
      fontSize: 15, fontWeight: 700, color: "#e6edf3",
      marginBottom: 6, letterSpacing: "-0.3px"
    }}>
      {title}
    </h3>
    {description && (
      <p style={{ fontSize: 13, color: "#8b949e", maxWidth: 340, lineHeight: 1.6, marginBottom: 20 }}>
        {description}
      </p>
    )}
    {action}
  </div>
);

export default EmptyState;