import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // Scroll the main content area to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", paddingTop: 56 }}>
        <Sidebar />
        <main
          ref={mainRef}
          style={{
            flex: 1,
            overflowY: "auto",
            height: "100%",
          }}
        >
          <div style={{ padding: "28px 32px", maxWidth: 1280 }} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;