import { useState, useEffect } from "react";
import { useLang } from "../context/LanguageContext";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Navbar() {
  const { lang, setLang, t } = useLang();
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
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "kn" : "en");
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
          ? "rgba(255,255,255,0.95)"
          : "rgba(10,10,30,0.4)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled
          ? "1px solid rgba(209,213,219,0.5)"
          : "1px solid rgba(255,255,255,0.12)",
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
        <div style={{ display: "flex", gap: 24, alignItems: "center" }} className="nav-desktop">
          {[
            { label: t("nav_features"), action: () => scrollTo("features") },
            { label: t("nav_about_autism"), action: () => scrollTo("autism-info") },
            { label: t("nav_how_it_works"), action: () => scrollTo("how-it-works") },
            { label: t("nav_reviews"), action: () => scrollTo("reviews") },
            { label: t("nav_contact"), action: () => navigate("/contact") },
          ].map((item, idx) => (
            <button
              key={idx}
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

        {/* Desktop Controls (Language Switcher & Auth) */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="nav-desktop">
          {/* Language Switch Button */}
          <button
            onClick={toggleLang}
            title="Switch Language"
            style={{
              padding: "7px 15px",
              borderRadius: 50,
              border: scrolled ? "1.5px solid #6366f1" : "1.5px solid rgba(255,255,255,0.4)",
              background: scrolled ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              color: scrolled ? "#4f46e5" : "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all .3s ease",
              fontFamily: "inherit"
            }}
          >
            🌐 <span>{lang === "en" ? "English" : "ಕನ್ನಡ"}</span>
          </button>

          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 50,
              fontWeight: 600,
              fontSize: ".88rem",
              color: scrolled ? "var(--primary)" : "#fff",
              border: `1px solid ${scrolled ? "var(--primary)" : "rgba(255,255,255,0.4)"}`,
              background: "transparent",
              cursor: "pointer",
              transition: "all .3s",
              fontFamily: "inherit",
            }}
          >
            {t("nav_login")}
          </a>
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{
              textDecoration: "none",
              padding: "8px 20px",
              borderRadius: 50,
              fontWeight: 700,
              fontSize: ".88rem",
              background: scrolled
                ? "var(--primary)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              transition: "all .3s",
              display: "inline-block",
            }}
          >
            {t("nav_get_started")}
          </a>
        </div>

        {/* Mobile Controls */}
        <div style={{ display: "none", alignItems: "center", gap: 10 }} className="nav-mobile-controls">
          <button
            onClick={toggleLang}
            style={{
              padding: "5px 10px",
              borderRadius: 20,
              border: "1px solid #6366f1",
              background: "rgba(99,102,241,0.1)",
              color: scrolled ? "#4f46e5" : "#fff",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            {lang === "en" ? "EN" : "KN"}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="nav-mobile-toggle"
            style={{
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
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { label: t("nav_features"), action: () => scrollTo("features") },
            { label: t("nav_about_autism"), action: () => scrollTo("autism-info") },
            { label: t("nav_how_it_works"), action: () => scrollTo("how-it-works") },
            { label: t("nav_reviews"), action: () => scrollTo("reviews") },
            { label: t("nav_contact"), action: () => { setOpen(false); navigate("/contact"); } },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: ".95rem", padding: "4px 0" }}
            >
              {item.label}
            </button>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
          >
            {t("nav_login")}
          </a>
          <a
            href="/login"
            onClick={(e) => handleNav(e, "/login")}
            className="btn btn-primary"
            style={{ borderRadius: 12, textAlign: "center", textDecoration: "none" }}
          >
            {t("nav_get_started")}
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-controls { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
