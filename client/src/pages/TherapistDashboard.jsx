import React, { useState, useEffect } from "react";
import {
  getTherapistChildren,
  getAlerts,
  createChild,
  generateLinkCode,
  getAllTherapists,
} from "../services/api";
import ChildDetailModal from "../components/ChildDetailModal";

const LEVEL_BADGES = {
  1: { label: "Level 1 — Emerging", color: "#166534", bg: "#dcfce7", emoji: "🌱" },
  2: { label: "Level 2 — Developing", color: "#854d0e", bg: "#fef9c3", emoji: "🌿" },
  3: { label: "Level 3 — Advancing", color: "#991b1b", bg: "#fee2e2", emoji: "🌳" },
};

const STATUS_BADGES = {
  Improving: { label: "↑ Improving", labelKn: "↑ ಸುಧಾರಿಸುತ್ತಿದೆ", color: "#166534", bg: "#dcfce7", border: "#86efac" },
  Stable: { label: "→ Stable", labelKn: "→ ಸ್ಥಿರವಾಗಿದೆ", color: "#854d0e", bg: "#fef9c3", border: "#fde047" },
  Regressing: { label: "↓ Regressing", labelKn: "↓ ಹಿಂದುಳಿಯುತ್ತಿದೆ", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
  "Collecting Data": { label: "⏳ Collecting Data", labelKn: "⏳ ಮಾಹಿತಿ ಸಂಗ್ರಹ", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};

export default function TherapistDashboard({ user, onNavigate }) {
  const [lang, setLang] = useState("en"); // "en" or "kn"
  const [activeNav, setActiveNav] = useState("overview"); // overview, children, specialists, reports, messages, alerts, settings
  const [therapistsList, setTherapistsList] = useState([]);
  const [activeTherapistId, setActiveTherapistId] = useState(user?._id || null);
  const [children, setChildren] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedChild, setSelectedChild] = useState(null);
  const [initialModalTab, setInitialModalTab] = useState("overview");

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", age: "", gender: "male", supportLevel: "Level 1 - Requiring Support" });
  const [createdLinkCode, setCreatedLinkCode] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const t = (en, kn) => (lang === "kn" ? kn : en);

  // Determine current active therapist profile
  const currentTherapist =
    therapistsList.find((th) => th._id === activeTherapistId) ||
    user ||
    therapistsList[0] ||
    JSON.parse(localStorage.getItem("auth_user") || "{}");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allTherapists, altList] = await Promise.all([
        getAllTherapists().catch(() => []),
        getAlerts().catch(() => []),
      ]);

      const tList = Array.isArray(allTherapists) ? allTherapists : [];
      setTherapistsList(tList);

      const targetId = activeTherapistId || (tList.length > 0 ? tList[0]._id : null) || user?._id;
      if (!activeTherapistId && targetId) {
        setActiveTherapistId(targetId);
      }

      const kids = await getTherapistChildren().catch(() => []);
      setChildren(Array.isArray(kids) ? kids : []);
      setAlerts(Array.isArray(altList) ? altList : []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?._id]);

  // Filter children for the active therapist
  const displayedChildren = children.filter((c) => {
    if (!activeTherapistId) return true;
    return String(c.therapistId) === String(activeTherapistId) || !c.therapistId;
  });

  const handleOpenDetail = (child, tab = "overview") => {
    setSelectedChild(child);
    setInitialModalTab(tab);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await createChild({
        therapistId: activeTherapistId || currentTherapist._id || currentTherapist.id,
        name: newPatient.name.trim(),
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        supportLevel: newPatient.supportLevel,
      });
      if (res.child?.linkCode) {
        setCreatedLinkCode(res.child.linkCode);
      } else {
        setShowAddModal(false);
      }
      await loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to create patient");
    } finally {
      setAddLoading(false);
    }
  };

  // Compute Statistics
  const totalChildren = displayedChildren.length;
  const improvingCount = displayedChildren.filter((c) => c.progressStatus === "Improving").length;
  const attentionCount = displayedChildren.filter((c) => c.progressStatus === "Regressing" || c.weeksStable >= 3).length;
  const feedbackSentCount = 8;
  const pendingFeedbackCount = attentionCount + (alerts.length ? 1 : 0);
  const unreadAlertsCount = alerts.length;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8faff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Dark Sidebar Navigation ────────────────────────────────────────── */}
      <aside
        style={{
          width: "270px",
          background: "#0f172a",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px 28px 12px" }}>
          <span style={{ fontSize: "1.8rem" }}>🧩</span>
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.15rem", color: "#ffffff", letterSpacing: "-0.5px" }}>
              Autism Assistant
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
              {t("Therapist Clinical Portal", "ವೈದ್ಯರ ಕ್ಲಿನಿಕಲ್ ವೇದಿಕೆ")}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "overview", icon: "🏠", label: t("Overview", "ಅವಲೋಕನ") },
            { id: "children", icon: "👶", label: t("Assigned Children", "ನಿಯೋಜಿತ ಮಕ್ಕಳು"), badge: totalChildren },
            { id: "specialists", icon: "👨‍⚕️", label: t("Specialist Directory", "6 ವೈದ್ಯರ ಪ್ರೊಫೈಲ್‌ಗಳು"), badge: therapistsList.length || 6 },
            { id: "reports", icon: "📊", label: t("Progress Reports", "ಪ್ರಗತಿ ವರದಿಗಳು") },
            { id: "messages", icon: "💬", label: t("Messages", "ಸಂದೇಶಗಳು"), badge: pendingFeedbackCount, badgeColor: "#ef4444" },
            { id: "alerts", icon: "🔔", label: t("Alerts", "ಎಚ್ಚರಿಕೆಗಳು"), badge: unreadAlertsCount, badgeColor: "#f97316" },
          ].map((nav) => {
            const isSel = activeNav === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveNav(nav.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "none",
                  background: isSel ? "#4F6EF7" : "transparent",
                  color: isSel ? "#ffffff" : "#94a3b8",
                  fontWeight: isSel ? "700" : "600",
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{nav.icon}</span>
                  <span>{nav.label}</span>
                </div>
                {nav.badge !== undefined && nav.badge > 0 && (
                  <span
                    style={{
                      background: nav.badgeColor || "rgba(255,255,255,0.2)",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                    }}
                  >
                    {nav.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Therapist Profile Badge in Sidebar */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {currentTherapist.profilePhoto ? (
            <img
              src={currentTherapist.profilePhoto}
              alt={currentTherapist.name}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #4F6EF7",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4F6EF7 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              👨‍⚕️
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTherapist.name || "Dr. Therapist"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTherapist.specialization || "Clinical Autism Specialist"}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", minWidth: 0 }}>
        {/* TOP BAR: SPECIALIST SWITCHER */}
        {therapistsList.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem" }}>🩺</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  {t("Active Specialist View (Click to Switch):", "ವೈದ್ಯರ ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ:")}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1e293b" }}>
                  {currentTherapist.name} ({currentTherapist.qualification || "BCBA"})
                </div>
              </div>
            </div>

            {/* Quick Switcher Avatars */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {therapistsList.map((th) => {
                const isSelected = th._id === activeTherapistId;
                return (
                  <button
                    key={th._id}
                    onClick={() => setActiveTherapistId(th._id)}
                    title={`${th.name} — ${th.specialization} (Target: Ages ${th.targetAgeMin}-${th.targetAgeMax})`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      border: isSelected ? "2px solid #4F6EF7" : "1px solid #e2e8f0",
                      background: isSelected ? "#eef2ff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <img
                      src={th.profilePhoto}
                      alt={th.name}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: isSelected ? "1.5px solid #4F6EF7" : "1px solid #cbd5e1",
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", fontWeight: isSelected ? "800" : "600", color: isSelected ? "#4F6EF7" : "#475569" }}>
                      {th.name.split(" ")[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 1: HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
              {t("Therapist Clinical Hub", "ವೈದ್ಯರ ಕ್ಲಿನಿಕಲ್ ವೇದಿಕೆ")} 👩‍⚕️
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
              {currentTherapist.name} · {currentTherapist.specialization} · <em>{currentTherapist.clinic}</em>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Language Toggle */}
            <button
              onClick={() => setLang((l) => (l === "en" ? "kn" : "en"))}
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1.5px solid #cbd5e1",
                background: "white",
                color: "#1e293b",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              🌐 {lang === "en" ? "ಕನ್ನಡ (KN)" : "English (EN)"}
            </button>

            {/* Register Patient Button */}
            <button
              onClick={() => {
                setCreatedLinkCode("");
                setNewPatient({ name: "", age: "", gender: "male", supportLevel: "Level 1 - Requiring Support" });
                setShowAddModal(true);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#4F6EF7",
                color: "white",
                fontWeight: "800",
                fontSize: "0.9rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(79, 110, 247, 0.35)",
              }}
            >
              ➕ {t("Register Patient", "ಹೊಸ ರೋಗಿ ನೋಂದಣಿ")}
            </button>
          </div>
        </header>

        {/* TAB 1 & 2: OVERVIEW & CHILDREN CARDS */}
        {(activeNav === "overview" || activeNav === "children") && (
          <div>
            {/* ALERT BANNER */}
            {alerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                {alerts.map((alt, idx) => {
                  const isRed = alt.severity === "red" || alt.type === "urgent";
                  return (
                    <div
                      key={alt.id || idx}
                      style={{
                        background: isRed ? "#fef2f2" : "#fefce8",
                        border: `1.5px solid ${isRed ? "#fca5a5" : "#fde047"}`,
                        color: isRed ? "#991b1b" : "#854d0e",
                        borderRadius: "16px",
                        padding: "16px 22px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.6rem" }}>{isRed ? "🔴" : "⚠️"}</span>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "0.98rem" }}>{alt.title}</div>
                          <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                            {alt.description}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const matched = children.find((c) => c._id === alt.childId || c.name === alt.childName) || children[0];
                          if (matched) handleOpenDetail(matched, "overview");
                        }}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "10px",
                          border: "none",
                          background: isRed ? "#dc2626" : "#ca8a04",
                          color: "white",
                          fontWeight: "800",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        {alt.actionText || t("Review Now", "ಪರಿಶೀಲಿಸಿ")} →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* QUICK STATS ROW */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginBottom: "32px",
              }}
            >
              {[
                { label: t("Assigned to Specialist", "ತಜ್ಞರಿಗೆ ನಿಯೋಜಿಸಲಾದ ಮಕ್ಕಳು"), val: totalChildren, icon: "👶", color: "#4F6EF7", bg: "#eef2ff" },
                { label: t("Children Improving", "ಸುಧಾರಿಸುತ್ತಿರುವವರು"), val: improvingCount, icon: "📈", color: "#16a34a", bg: "#dcfce7" },
                { label: t("Children Needing Attention", "ಗಮನ ಅಗತ್ಯವಿರುವವರು"), val: attentionCount, icon: "⚠️", color: "#dc2626", bg: "#fee2e2" },
                { label: t("Clinical Specialization", "ಕ್ಲಿನಿಕಲ್ ಪರಿಣತಿ"), val: currentTherapist.yearsOfExperience ? `${currentTherapist.yearsOfExperience} Yrs Exp` : "10+ Yrs", icon: "🩺", color: "#8b5cf6", bg: "#f3e8ff" },
              ].map((st, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>{st.val}</div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      background: st.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                    }}
                  >
                    {st.icon}
                  </div>
                </div>
              ))}
            </section>

            {/* CHILDREN CARDS */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  👶 {t("Assigned Patient Cohort", "ನಿಯೋಜಿತ ರೋಗಿಗಳು")} ({displayedChildren.length})
                </h2>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {t("Clinically matched based on Age & Support Level", "ವಯಸ್ಸು ಮತ್ತು ಬೆಂಬಲ ಮಟ್ಟದ ಆಧಾರದ ಮೇಲೆ ನಿಯೋಜಿಸಲಾಗಿದೆ")}
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <span className="spinner" style={{ width: 40, height: 40 }} />
                </div>
              ) : displayedChildren.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "60px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>📋</div>
                  <h3 style={{ fontWeight: "700", margin: "0 0 8px 0" }}>{t("No Children Matched Yet for This Specialist", "ಈ ತಜ್ಞರಿಗೆ ಮಕ್ಕಳು ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ")}</h3>
                  <p style={{ color: "#64748b", margin: "0 0 18px 0" }}>
                    {t("Register a child matching this specialist's age group or view other specialists.", "ಈ ತಜ್ಞರ ವಯಸ್ಸಿನ ಗುಂಪಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಮಗುವನ್ನು ನೋಂದಾಯಿಸಿ.")}
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "12px",
                      border: "none",
                      background: "#4F6EF7",
                      color: "white",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    ➕ {t("Register Patient", "ರೋಗಿ ನೋಂದಣಿ")}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {displayedChildren.map((child) => {
                    const lvl = LEVEL_BADGES[child.level] || LEVEL_BADGES[1];
                    const status = STATUS_BADGES[child.progressStatus] || STATUS_BADGES.Stable;
                    const stars = "⭐".repeat(child.starRating || 4);

                    return (
                      <div
                        key={child._id}
                        style={{
                          background: "white",
                          borderRadius: "16px",
                          padding: "24px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <div>
                          {/* Top Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                                {child.name}
                              </h3>
                              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                {t("Age", "ವಯಸ್ಸು")}: <strong>{child.age} yrs</strong> ({child.gender || "male"})
                              </div>
                            </div>

                            {/* Level Badge */}
                            <span
                              style={{
                                background: lvl.bg,
                                color: lvl.color,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontWeight: "800",
                                fontSize: "0.78rem",
                              }}
                            >
                              {lvl.emoji} {lvl.label.split("—")[0]}
                            </span>
                          </div>

                          {/* Progress Trajectory Badge */}
                          <div style={{ marginBottom: "14px" }}>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                              {t("Weekly Progress Status", "ವಾರದ ಪ್ರಗತಿ ಸ್ಥಿತಿ")}:
                            </div>
                            <span
                              style={{
                                display: "inline-block",
                                background: status.bg,
                                color: status.color,
                                border: `1px solid ${status.border}`,
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                              }}
                            >
                              {lang === "kn" ? status.labelKn : status.label}
                            </span>
                          </div>

                          {/* Metrics List */}
                          <div
                            style={{
                              background: "#f8fafc",
                              borderRadius: "12px",
                              padding: "12px 14px",
                              marginBottom: "18px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              fontSize: "0.84rem",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748b" }}>{t("Average Score", "ಸರಾಸರಿ ಅಂಕ")}:</span>
                              <span>
                                {child.hasProgressData ? `${stars} (${child.weeklyAvgScore}%)` : <em style={{ color: "#94a3b8" }}>{t("No sessions yet", "ಇನ್ನೂ ಸೆಷನ್‌ಗಳಿಲ್ಲ")}</em>}
                              </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748b" }}>{t("Daily Streak", "ದೈನಂದಿನ ಸ್ಟ್ರೀಕ್")}:</span>
                              <strong style={{ color: (child.streak || 0) > 0 ? "#ea580c" : "#64748b" }}>
                                🔥 {child.streak || 0} {t("Days", "ದಿನಗಳು")}
                              </strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748b" }}>{t("Dominant Emotion", "ಪ್ರಮುಖ ಭಾವನೆ")}:</span>
                              <strong>{child.dominantEmotion || "Neutral 😐"}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748b" }}>{t("Last Session", "ಕೊನೆಯ ಸೆಷನ್")}:</span>
                              <span>{child.lastSessionDate ? new Date(child.lastSessionDate).toLocaleDateString() : t("No activity", "ಚಟುವಟಿಕೆ ಇಲ್ಲ")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <button
                            onClick={() => handleOpenDetail(child, "overview")}
                            style={{
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                              background: "white",
                              color: "#1e293b",
                              fontWeight: "700",
                              fontSize: "0.84rem",
                              cursor: "pointer",
                            }}
                          >
                            👁️ {t("View Details", "ವಿವರಗಳು")}
                          </button>

                          <button
                            onClick={() => handleOpenDetail(child, "feedback")}
                            style={{
                              padding: "10px",
                              borderRadius: "10px",
                              border: "none",
                              background: "#4F6EF7",
                              color: "white",
                              fontWeight: "800",
                              fontSize: "0.84rem",
                              cursor: "pointer",
                            }}
                          >
                            💬 {t("Send Feedback", "ಪ್ರತಿಕ್ರಿಯೆ")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: 6 SPECIALIZED THERAPISTS DIRECTORY */}
        {activeNav === "specialists" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                👨‍⚕️ {t("Clinical Autism Specialist Panel (6 Therapists)", "ಕ್ಲಿನಿಕಲ್ ಆಟಿಸಂ ತಜ್ಞರ ತಂಡ (6 ವೈದ್ಯರು)")}
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
                {t("Each specialist leads tailored age-group & support level interventions based on evidence-based protocols.", "ಪ್ರತಿಯೊಬ್ಬ ತಜ್ಞರು ನಿರ್ದಿಷ್ಟ ವಯೋಮಾನ ಮತ್ತು ಬೆಂಬಲ ಮಟ್ಟದ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತಾರೆ.")}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {therapistsList.map((th) => {
                const isCurrent = th._id === activeTherapistId;
                const assignedKidsCount = children.filter((c) => String(c.therapistId) === String(th._id)).length;

                return (
                  <div
                    key={th._id}
                    style={{
                      background: "white",
                      borderRadius: "18px",
                      border: `2px solid ${isCurrent ? "#4F6EF7" : "#e2e8f0"}`,
                      boxShadow: isCurrent ? "0 8px 24px rgba(79, 110, 247, 0.15)" : "0 4px 16px rgba(0,0,0,0.04)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Top: Avatar and Doctor Name */}
                      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
                        <img
                          src={th.profilePhoto}
                          alt={th.name}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #4F6EF7",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                            {th.name}
                          </h3>
                          <div style={{ fontSize: "0.8rem", color: "#4F6EF7", fontWeight: "700" }}>
                            {th.qualification || "Pediatric Specialist"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {th.yearsOfExperience || 10} {t("Years Experience", "ವರ್ಷಗಳ ಅನುಭವ")}
                          </div>
                        </div>
                      </div>

                      {/* Specialization Badge */}
                      <div
                        style={{
                          background: "#eef2ff",
                          border: "1px solid #c7d2fe",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          marginBottom: "14px",
                        }}
                      >
                        <div style={{ fontSize: "0.72rem", color: "#4338ca", fontWeight: "800", textTransform: "uppercase" }}>
                          {t("Specialization", "ಪರಿಣತಿ")}
                        </div>
                        <div style={{ fontSize: "0.86rem", fontWeight: "700", color: "#1e1b4b", marginTop: "2px" }}>
                          {th.specialization}
                        </div>
                      </div>

                      {/* Bio */}
                      <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: "1.5", marginBottom: "16px" }}>
                        {th.bio}
                      </p>

                      {/* Clinical Match Criteria */}
                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.82rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#64748b" }}>🎯 {t("Target Ages:", "ವಯಸ್ಸಿನ ಗುಂಪು:")}</span>
                          <strong>{th.targetAgeMin}–{th.targetAgeMax} {t("Years", "ವರ್ಷಗಳು")}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#64748b" }}>🌱 {t("Support Levels:", "ಬೆಂಬಲ ಮಟ್ಟ:")}</span>
                          <strong>Level {th.targetLevels?.join(" & Level ") || "1 & 2"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>🏥 {t("Hospital / Clinic:", "ಆಸ್ಪತ್ರೆ:")}</span>
                          <span style={{ fontWeight: "600", textAlign: "right" }}>{th.clinic?.split(",")[0] || "NIMHANS Hub"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Switch / View Cohort Action Button */}
                    <button
                      onClick={() => {
                        setActiveTherapistId(th._id);
                        setActiveNav("children");
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "12px",
                        border: isCurrent ? "2px solid #4F6EF7" : "none",
                        background: isCurrent ? "#ffffff" : "#4F6EF7",
                        color: isCurrent ? "#4F6EF7" : "#ffffff",
                        fontWeight: "800",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: isCurrent ? "none" : "0 4px 12px rgba(79, 110, 247, 0.25)",
                      }}
                    >
                      {isCurrent ? `✅ ${t("Active Specialist View", "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ತಜ್ಞರು")} (${assignedKidsCount} ${t("Kids", "ಮಕ್ಕಳು")})` : `👁️ ${t("View Assigned Children", "ನಿಯೋಜಿತ ಮಕ್ಕಳನ್ನು ನೋಡಿ")} (${assignedKidsCount})`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Detail Modal ─────────────────────────────────────────────────── */}
        {selectedChild && (
          <ChildDetailModal
            child={selectedChild}
            lang={lang}
            onClose={() => setSelectedChild(null)}
            onRefresh={loadDashboardData}
          />
        )}

        {/* ── Register Patient Modal ───────────────────────────────────────── */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "480px",
                padding: "32px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                  {t("Register New Patient", "ಹೊಸ ರೋಗಿ ನೋಂದಣಿ")}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", fontWeight: "700", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              {createdLinkCode ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
                  <h3 style={{ fontWeight: "800", margin: "0 0 8px 0" }}>{t("Patient Profile Created & Clinically Matched!", "ರೋಗಿಯ ಪ್ರೊಫೈಲ್ ರಚಿಸಲಾಗಿದೆ ಮತ್ತು ಹೊಂದಿಸಲಾಗಿದೆ!")}</h3>
                  <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
                    {t("Share this 6-digit Link Code with the child's parent to link their app:", "ಪೋಷಕರೊಂದಿಗೆ ಈ ಲಿಂಕ್ ಕೋಡ್ ಹಂಚಿಕೊಳ್ಳಿ:")}
                  </p>
                  <div
                    style={{
                      background: "#fef3c7",
                      border: "2px dashed #f59e0b",
                      padding: "16px",
                      borderRadius: "12px",
                      fontSize: "1.8rem",
                      fontWeight: "800",
                      letterSpacing: "4px",
                      color: "#b45309",
                      fontFamily: "monospace",
                      marginBottom: "24px",
                    }}
                  >
                    {createdLinkCode}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setCreatedLinkCode("");
                    }}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "12px",
                      border: "none",
                      background: "#4F6EF7",
                      color: "white",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    {t("Done", "ಮುಗಿದಿದೆ")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreatePatient}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      {t("Child Name:", "ಮಗುವಿನ ಹೆಸರು:")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rohan Kumar"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        {t("Age:", "ವಯಸ್ಸು:")}
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="18"
                        required
                        placeholder="e.g., 6"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        {t("Gender:", "ಲಿಂಗ:")}
                      </label>
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      {t("Initial Support Category:", "ಪ್ರಾರಂಭಿಕ ಬೆಂಬಲ ವರ್ಗ:")}
                    </label>
                    <select
                      value={newPatient.supportLevel}
                      onChange={(e) => setNewPatient({ ...newPatient, supportLevel: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    >
                      <option value="Level 1 - Requiring Support">Level 1 — Requiring Support (Emerging)</option>
                      <option value="Level 2 - Requiring Substantial Support">Level 2 — Requiring Substantial Support (Developing)</option>
                      <option value="Level 3 - Requiring Very Substantial Support">Level 3 — Requiring Very Substantial Support (Advancing)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "700" }}
                    >
                      {t("Cancel", "ರದ್ದುಮಾಡಿ")}
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#4F6EF7", color: "white", fontWeight: "800", cursor: addLoading ? "not-allowed" : "pointer" }}
                    >
                      {addLoading ? t("Registering...", "ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ...") : t("Create & Auto-Match Specialist", "ರಚಿಸಿ")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
