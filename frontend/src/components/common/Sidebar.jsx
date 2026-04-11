import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GitBranch, Bell, Search,
  Activity, User, Sparkles
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/dashboard" },
  { icon: GitBranch,       label: "Repositories",  path: "/repos" },
  { icon: Bell,            label: "Notifications",  path: "/notifications" },
  { icon: Search,          label: "Search",         path: "/search" },
  { icon: Activity,        label: "Activity",       path: "/activity" },
  { icon: User,            label: "Profile",        path: "/profile" },
];

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: "100%",
      background: "rgba(8,12,18,0.98)",
      borderRight: "1px solid rgba(33,38,45,0.8)",
      overflowY: "auto",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: "#3d4450",
            letterSpacing: "0.8px", textTransform: "uppercase",
            padding: "6px 10px 4px"
          }}>
            Navigation
          </p>
        </div>

        {NAV.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path || pathname.startsWith(path + "/");
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                textDecoration: "none",
                marginBottom: 2,
                fontSize: 13, fontWeight: 500,
                transition: "all 0.15s",
                position: "relative",
                ...(isActive ? {
                  background: "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))",
                  color: "#60a5fa",
                  borderRight: "2px solid #2563eb",
                  marginRight: -10
                } : {
                  color: "#8b949e",
                  background: "transparent"
                })
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(33,38,45,0.6)";
                  e.currentTarget.style.color = "#c9d1d9";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8b949e";
                }
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
              {isActive && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#2563eb",
                  marginLeft: "auto", opacity: 0.8
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid rgba(33,38,45,0.6)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px",
          background: "rgba(37,99,235,0.06)",
          border: "1px solid rgba(37,99,235,0.12)",
          borderRadius: 8
        }}>
          <Sparkles size={13} color="#60a5fa" />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa" }}>AI Engine</p>
            <p style={{ fontSize: 10, color: "#3d4450" }}>Online & reviewing</p>
          </div>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#34d399", marginLeft: "auto",
            flexShrink: 0,
            boxShadow: "0 0 6px rgba(52,211,153,0.6)",
            animation: "pulse-dot 2s infinite"
          }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;