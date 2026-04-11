import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, LogOut, GitBranch, ChevronDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logout } from "../../api/auth.api.js";
import { getUnreadCount } from "../../api/notification.api.js";
import useAuthStore from "../../store/auth.store.js";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.data?.data?.unreadCount || 0;

  const { mutate: handleLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      logoutStore();
      navigate("/login");
      toast.success("Signed out");
    },
  });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: 56,
      background: "rgba(8, 12, 18, 0.9)",
      borderBottom: "1px solid rgba(48,54,61,0.6)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      display: "flex", alignItems: "center"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "0 20px"
      }}>

        {/* Logo */}
        <Link to="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none"
        }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(37,99,235,0.4)"
          }}>
            <GitBranch size={15} color="white" />
          </div>
          <span style={{
            fontSize: 15, fontWeight: 700, color: "#e6edf3",
            letterSpacing: "-0.4px"
          }}>
            AI PR Review
          </span>
        </Link>

        {/* Search bar */}
        <Link to="/search" style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(13,17,23,0.8)",
          border: "1px solid rgba(48,54,61,0.7)",
          borderRadius: 10, padding: "7px 14px",
          textDecoration: "none",
          minWidth: 220,
          transition: "all 0.2s"
        }}
          className="hover-search"
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(37,99,235,0.5)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(48,54,61,0.7)"}
        >
          <Search size={13} color="#484f58" />
          <span style={{ fontSize: 13, color: "#484f58" }}>Search anything…</span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "#3d4450",
            padding: "2px 6px", background: "rgba(48,54,61,0.5)",
            borderRadius: 4, border: "1px solid #30363d"
          }}>⌘K</span>
        </Link>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

          {/* Notifications */}
          <Link to="/notifications" style={{
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8,
            background: "transparent",
            border: "1px solid transparent",
            textDecoration: "none",
            transition: "all 0.15s",
            color: "#8b949e"
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(48,54,61,0.5)";
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.color = "#e6edf3";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "#8b949e";
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 8, height: 8, borderRadius: "50%",
                background: "#2563eb",
                border: "2px solid #080c12",
                animation: "pulse-dot 2s infinite"
              }} />
            )}
          </Link>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "#21262d", margin: "0 4px" }} />

          {/* Profile */}
          <Link to="/profile" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: 8,
            border: "1px solid transparent",
            textDecoration: "none",
            transition: "all 0.15s"
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(48,54,61,0.5)";
              e.currentTarget.style.borderColor = "#30363d";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff"
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#c9d1d9" }}>
              {user?.username}
            </span>
            <ChevronDown size={12} color="#8b949e" />
          </Link>

          {/* Logout */}
          <button
            onClick={() => handleLogout()}
            title="Sign out"
            style={{
              width: 32, height: 32, borderRadius: 7,
              background: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#8b949e", transition: "all 0.15s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "#8b949e";
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;