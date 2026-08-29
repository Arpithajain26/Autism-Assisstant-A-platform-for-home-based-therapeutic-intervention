import React, { useState, useEffect } from "react";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import Activities from "./pages/Activities";
import Games from "./pages/Games";
import AboutAutism from "./pages/AboutAutism";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProgressView from "./pages/ProgressView";

// ─────────────────────────────────────────────────────────────
// Simple SPA Router
// ─────────────────────────────────────────────────────────────
function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getStoredUser() {
  try {
    const user = localStorage.getItem("auth_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const onNavChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onNavChange);
    return () => window.removeEventListener("popstate", onNavChange);
  }, []);

  // Verify token on mount if user exists
  useEffect(() => {
    if (user) {
      import("./services/api").then(({ getMe }) => {
        getMe().catch((err) => {
          const msg = err.message || "";
          if (msg.includes("Invalid") || msg.includes("token") || msg.includes("not found")) {
            handleLogout();
          }
        });
      });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    if (!user) {
      const publicRoutes = ["/", "/login", "/about", "/contact", "/privacy", "/terms"];
      if (!publicRoutes.includes(path)) {
        navigate("/");
      }
    } else {
      if (path === "/login") {
        navigate("/dashboard");
      }
    }
  }, [path, user]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    navigate(href);
  };

  let Component;

  // ============================================================
  // PUBLIC ROUTES
  // ============================================================
  if (!user) {
    switch (path) {
      case "/":
        Component = <Home />;
        break;

      case "/login":
        Component = <AuthPage onLogin={handleLogin} />;
        break;

      case "/about":
        Component = <AboutAutism />;
        break;

      case "/contact":
        Component = <Contact />;
        break;

      case "/privacy":
        Component = <PrivacyPolicy />;
        break;

      case "/terms":
        Component = <TermsOfService />;
        break;

      default:
        Component = <Home />;
    }
  }
  // ============================================================
  // PRIVATE ROUTES
  // ============================================================
  else {
    if (path.startsWith("/child/")) {
      const childId = path.split("/child/")[1];
      Component = <ChildDashboard user={user} childId={childId} onNavigate={navigate} />;
    } else if (path.startsWith("/progress/")) {
      const childId = path.split("/progress/")[1];
      Component = <ProgressView user={user} childId={childId} onNavigate={navigate} />;
    } else {
      switch (path) {
        case "/dashboard":
        case "/":
          if (user.role === "parent") {
            Component = <ParentDashboard user={user} onNavigate={navigate} />;
          } else if (user.role === "therapist") {
            Component = <TherapistDashboard user={user} onNavigate={navigate} />;
          } else {
            Component = <ChildDashboard user={user} onNavigate={navigate} />;
          }
          break;

        case "/activities":
          Component = <Activities user={user} />;
          break;

        case "/games":
          Component = <Games user={user} />;
          break;

        case "/therapeutic-games":
          Component = <TherapeuticGames user={user} />;
          break;

        default:
          Component = (
            <div
              style={{
                textAlign: "center",
                padding: "100px",
              }}
            >
              <h2>404 - Page Not Found</h2>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-primary"
                style={{ marginTop: "16px" }}
              >
                Go to Dashboard
              </button>
            </div>
          );
      }
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Show navbar only after login */}
      {user && (
        <nav
          className="glass"
          style={{
            margin: "16px auto",
            padding: "12px 28px",
            display: "flex",
            gap: "20px",
            alignItems: "center",
            width: "max-content",
            maxWidth: "calc(100vw - 40px)",
            position: "sticky",
            top: "16px",
            zIndex: 100,
          }}
        >
          <a
            href="/dashboard"
            onClick={(e) => handleNavClick(e, "/dashboard")}
            style={{
              textDecoration: "none",
              fontWeight: "800",
              fontSize: "1.2rem",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🧩 AutismAssist
          </a>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "var(--border)",
            }}
          />

          <a
            href="/dashboard"
            onClick={(e) => handleNavClick(e, "/dashboard")}
            style={{
              textDecoration: "none",
              color: path === "/dashboard" || path === "/" ? "var(--primary)" : "var(--text)",
              fontWeight: "600",
            }}
          >
            Dashboard
          </a>

          <a
            href="/activities"
            onClick={(e) => handleNavClick(e, "/activities")}
            style={{
              textDecoration: "none",
              color: path === "/activities" ? "var(--primary)" : "var(--text)",
              fontWeight: "600",
            }}
          >
            Activities
          </a>

          <a
            href="/games"
            onClick={(e) => handleNavClick(e, "/games")}
            style={{
              textDecoration: "none",
              color: path === "/games" ? "var(--primary)" : "var(--text)",
              fontWeight: "600",
            }}
          >
            Games
          </a>

          <a
            href="/therapeutic-games"
            onClick={(e) => handleNavClick(e, "/therapeutic-games")}
            style={{
              textDecoration: "none",
              color: path === "/therapeutic-games" ? "var(--primary)" : "var(--text)",
              fontWeight: "600",
            }}
          >
            🧩 Therapy Games
          </a>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "var(--border)",
            }}
          />

          <span className={`badge badge-${user.role}`}>{user.role}</span>

          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--red)",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </nav>
      )}

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: (path === "/" || !user) ? "none" : "1200px",
          margin: (path === "/" || !user) ? "0" : "0 auto",
          padding: (path === "/" || !user) ? "0" : "20px",
        }}
      >
        {Component}
      </main>

      {user && (
        <footer
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-muted)",
            fontSize: ".85rem",
          }}
        >
          © 2026 Autism Assistant · Empowering every journey 🌟
        </footer>
      )}
    </div>
  );
}

export default App;
