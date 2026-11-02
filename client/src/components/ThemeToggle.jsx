import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({
  className = "",
  style = {},
  showLabel = false,
  scrolled = false,
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: showLabel ? "7px 14px" : "8px 12px",
        borderRadius: "999px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "0.85rem",
        fontWeight: "700",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: isDark
          ? "1.5px solid rgba(251, 191, 36, 0.4)"
          : scrolled
          ? "1.5px solid rgba(99, 102, 241, 0.35)"
          : "1.5px solid rgba(255, 255, 255, 0.35)",
        background: isDark
          ? "rgba(30, 41, 59, 0.85)"
          : scrolled
          ? "rgba(99, 102, 241, 0.08)"
          : "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: isDark ? "#fbbf24" : scrolled ? "#4f46e5" : "#ffffff",
        boxShadow: isDark
          ? "0 0 15px rgba(251, 191, 36, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.05)",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: "1.05rem",
          transform: isDark ? "rotate(0deg) scale(1.05)" : "rotate(0deg) scale(1)",
          transition: "transform 0.3s ease",
          lineHeight: 1,
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
      {showLabel && (
        <span style={{ letterSpacing: "0.02em" }}>
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
