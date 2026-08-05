import { useState, useEffect } from "react";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (e, href) => {
    e.preventDefault();
    setOpen(false);
    navigate(href);
  };

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 100,
        transition: "all .4s ease",
        background: scrolled
          ? "rgba(255,255,255,0.92)"
          : "rgba(10,10,30,0.3)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: scrolled
          ? "1px solid rgba(209,213,219,0.5)"
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 68,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => handleNav(e, "/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: scrolled ? "var(--primary)" : "#fff",
            transition: "color .4s",
          }}
        >
          <span style={{ fontSize: "1.7rem" }}>🧩</span>
          AutismAssist
        </a>

        {/* Desktop Nav Links */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }} className="nav-desktop">
          {[
            { label: "Features", action: () => scrollTo("features") },
            { label: "About Autism", action: () => scrollTo("autism-info") },
            { label: "How it Works", action: () => scrollTo("how-it-works") },
            { label: "Reviews", action: () => scrollTo("reviews") },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: ".92rem",
                color: scrolled ? "var(--text-muted)" : "rgba(255,255,255,0.85)",
                transition: "color .3s",
                padding: "4px 0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = scrolled ? "var(--primary)" : "#fff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = scrolled
                  ? "var(--text-muted)"
                  : "rgba(255,255,255,0.85)")
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="nav-desktop">
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{
              textDecoration: "none",
              padding: "9px 20px",
              borderRadius: 50,
              fontWeight: 600,
              fontSize: ".9rem",
              color: scrolled ? "var(--primary)" : "#fff",
              border: `1px solid ${scrolled ? "var(--primary)" : "rgba(255,255,255,0.4)"}`,
              background: "transparent",
              cursor: "pointer",
              transition: "all .3s",
              fontFamily: "inherit",
            }}
          >
            Login
          </a>
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{
              textDecoration: "none",
              padding: "9px 22px",
              borderRadius: 50,
              fontWeight: 700,
              fontSize: ".9rem",
              background: scrolled
                ? "var(--primary)"
                : "rgba(99,102,241,0.85)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              transition: "all .3s",
              display: "inline-block",
            }}
          >
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="nav-mobile-toggle"
          style={{
            display: "none",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: scrolled ? "var(--text)" : "#fff",
          }}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {["Features", "About Autism", "How it Works", "Reviews"].map((label) => (
            <button
              key={label}
              onClick={() => scrollTo(label.toLowerCase().replace(/ /g, "-"))}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: ".95rem", padding: "4px 0" }}
            >
              {label}
            </button>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
          >
            Login
          </a>
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            className="btn btn-primary"
            style={{ borderRadius: 12, textAlign: "center", textDecoration: "none" }}
          >
            Get Started
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
