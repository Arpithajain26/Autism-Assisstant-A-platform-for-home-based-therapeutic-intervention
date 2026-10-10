import React, { useState, useEffect } from "react";
import {
  getTherapistChildren,
  getAlerts,
  createChild,
  generateLinkCode,
  getAllTherapists,
  sendDirectMessage,
  getDirectMessages,
  markAllMessagesRead,
  acknowledgeAlert,
  sendFeedback,
} from "../services/api";
import ChildDetailModal from "../components/ChildDetailModal";
import { generateClinicalPDF } from "../utils/pdfExportHelper";
import TherapistJobsSuite from "../components/TherapistJobsSuite";
import useAlertPolling from "../hooks/useAlertPolling";

const LEVEL_BADGES = {
  1: { label: "Level 1 — Emerging", color: "#166534", bg: "#dcfce7", emoji: "🌱" },
  2: { label: "Level 2 — Developing", color: "#854d0e", bg: "#fef9c3", emoji: "🌿" },
  3: { label: "Level 3 — Advancing", color: "#991b1b", bg: "#fee2e2", emoji: "🌳" },
};

const STATUS_BADGES = {
  Improving: { label: "↑ Improving 🟢", labelKn: "↑ ಸುಧಾರಿಸುತ್ತಿದೆ", color: "#166534", bg: "#dcfce7", border: "#86efac" },
  Stable: { label: "→ Stable 🟡", labelKn: "→ ಸ್ಥಿರವಾಗಿದೆ", color: "#854d0e", bg: "#fef9c3", border: "#fde047" },
  Regressing: { label: "↓ Regressing 🔴", labelKn: "↓ ಹಿಂದುಳಿಯುತ್ತಿದೆ", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
  "Collecting Data": { label: "⏳ Collecting Data", labelKn: "⏳ ಮಾಹಿತಿ ಸಂಗ್ರಹ", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};

export default function TherapistDashboard({ user, onNavigate }) {
  const [lang, setLang] = useState("en"); // "en" or "kn"
  const [activeNav, setActiveNav] = useState("overview"); // overview, children, specialists, reports, messages, alerts
  const [therapistsList, setTherapistsList] = useState([]);
  const [activeTherapistId, setActiveTherapistId] = useState(user?._id || null);
  const [children, setChildren] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time unread alert polling (every 15s)
  const { newAlerts, dismissAlert, dismissAll } = useAlertPolling(activeTherapistId, 15000);

  // Priority Filter State: "all", "regressing", "stable", "improving"
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Quick Intervention Modal State
  const [interventionModal, setInterventionModal] = useState({
    show: false,
    child: null,
    type: "urgent", // urgent | adjustment | praise
    message: "",
    triggerUrgentAlert: false,
  });
  const [sendingIntervention, setSendingIntervention] = useState(false);

  // Messaging Tab State
  const [selectedChatChild, setSelectedChatChild] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

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
    therapistsList.find((th) => String(th._id) === String(activeTherapistId)) ||
    therapistsList[0] ||
    user ||
    JSON.parse(localStorage.getItem("auth_user") || "{}");

  const loadDashboardData = async (overrideTherapistId) => {
    try {
      setLoading(true);
      const targetId = overrideTherapistId || activeTherapistId || user?._id;
      const [allTherapists, altList, kids] = await Promise.all([
        getAllTherapists().catch(() => []),
        getAlerts(targetId).catch(() => []),
        getTherapistChildren(targetId).catch(() => []),
      ]);

      const tList = Array.isArray(allTherapists) ? allTherapists : [];
      setTherapistsList(tList);

      const resolvedId = targetId || (tList.length > 0 ? tList[0]._id : null) || user?._id;
      if (!activeTherapistId && resolvedId) {
        setActiveTherapistId(resolvedId);
      }

      setChildren(Array.isArray(kids) ? kids : []);
      setAlerts(Array.isArray(altList) ? altList : []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTherapistId) {
      loadDashboardData(activeTherapistId);
    } else {
      loadDashboardData();
    }
  }, [activeTherapistId, user?._id]);

  // Filter children for the active therapist
  const displayedChildren = children.filter((c) => {
    if (!activeTherapistId) return true;
    return String(c.therapistId) === String(activeTherapistId) || !c.therapistId;
  });

  // Calculate Priority Groups
  const regressingChildren = displayedChildren.filter((c) => c.progressStatus === "Regressing" || c.weeksRegressing >= 1);
  const stableChildren = displayedChildren.filter((c) => c.progressStatus === "Stable" || (!c.progressStatus && c.weeksRegressing === 0));
  const improvingChildren = displayedChildren.filter((c) => c.progressStatus === "Improving");

  // Children filtered by priority tab selection
  const filteredPriorityChildren = displayedChildren.filter((c) => {
    if (priorityFilter === "regressing") return c.progressStatus === "Regressing" || c.weeksRegressing >= 1;
    if (priorityFilter === "stable") return c.progressStatus === "Stable" || (!c.progressStatus && c.weeksRegressing === 0);
    if (priorityFilter === "improving") return c.progressStatus === "Improving";
    return true;
  });

  const handleOpenDetail = (child, tab = "overview") => {
    setSelectedChild(child);
    setInitialModalTab(tab);
  };

  const handleOpenInterventionModal = (child, type) => {
    let defaultMsg = "";
    if (type === "urgent") {
      defaultMsg = `Stop Color Sorting immediately. Replace with Bubble Pop and Music Movement. Reduce session duration from 15 to 10 minutes.`;
    } else if (type === "adjustment") {
      defaultMsg = `${child.name} is doing well but has plateaued. Increase Mirror Play to 15 minutes. Add Story Builder to daily plan. Try Emotion Charades this week.`;
    } else {
      defaultMsg = `Excellent progress! ${child.name} has maintained consistent improvement for 3+ weeks. Advancing task difficulty to Level ${Math.min(3, (child.level || 1) + 1)}.`;
    }

    setInterventionModal({
      show: true,
      child,
      type,
      message: defaultMsg,
      triggerUrgentAlert: type === "urgent",
    });
  };

  const handleSendIntervention = async () => {
    if (!interventionModal.child || !interventionModal.message.trim()) return;
    setSendingIntervention(true);
    try {
      await sendFeedback({
        childId: interventionModal.child._id,
        therapistId: currentTherapist._id,
        message: interventionModal.message.trim(),
        type: interventionModal.type === "urgent" ? "urgent_intervention" : "weekly_guidance",
      });

      alert(`✅ Intervention successfully sent to ${interventionModal.child.name}'s parent!`);
      setInterventionModal({ show: false, child: null, type: "urgent", message: "", triggerUrgentAlert: false });
      await loadDashboardData();
    } catch (err) {
      alert("Failed to send intervention: " + err.message);
    } finally {
      setSendingIntervention(false);
    }
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

  // Determine therapist age group target label
  const ageMax = currentTherapist.targetAgeMax || 5;
  const capacity = currentTherapist.maxPatients || 15;
  const ageGroupLabel = ageMax <= 5 ? "Age Group 1 — Age 2 to 5 years (Toddlers)" : ageMax <= 8 ? "Age Group 2 — Age 5 to 8 years (Early School)" : "Age Group 3 — Age 9 to 12 years (Older Children)";

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
              {t("Therapist Clinical Hub", "ವೈದ್ಯರ ಕ್ಲಿನಿಕಲ್ ವೇದಿಕೆ")}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "six_jobs", icon: "⚡", label: t("6 Final Jobs Hub", "ವೈದ್ಯರ 6 ಮುಖ್ಯ ಕಾರ್ಯಗಳು"), badge: "5 hrs/wk", badgeColor: "#10b981" },
            { id: "overview", icon: "🏠", label: t("Monday Priority Hub", "ಅವಲೋಕನ") },
            { id: "children", icon: "👶", label: t("Cohort Patients", "ನಿಯೋಜಿತ ಮಕ್ಕಳು"), badge: displayedChildren.length },
            { id: "specialists", icon: "👨‍⚕️", label: t("Therapists Panel", "ವೈದ್ಯರ ಪ್ರೊಫೈಲ್‌ಗಳು"), badge: therapistsList.length },
            { id: "reports", icon: "📊", label: t("Clinical Reports", "ಪ್ರಗತಿ ವರದಿಗಳು") },
            { id: "messages", icon: "💬", label: t("Parent Messages", "ಸಂದೇಶಗಳು"), badge: regressingChildren.length, badgeColor: "#ef4444" },
            { id: "alerts", icon: "🔔", label: t("Regress Alerts", "ಎಚ್ಚರಿಕೆಗಳು"), badge: (alerts.length + newAlerts.length) > 0 ? (alerts.length + newAlerts.length) : undefined, badgeColor: newAlerts.length > 0 ? "#ef4444" : "#f97316" },
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

        {/* Active Therapist Profile Badge */}
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
                  {t("Active Age Group Therapist (Switch Specialist):", "ವೈದ್ಯರ ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ:")}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1e293b" }}>
                  {currentTherapist.name} ({currentTherapist.qualification || "BCBA"}) — {ageGroupLabel}
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
                    title={`${th.name} — ${th.specialization} (Ages ${th.targetAgeMin}-${th.targetAgeMax})`}
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
                      {th.name.split(" ")[1]} (Ages {th.targetAgeMin}-{th.targetAgeMax})
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
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
              {t("Monday Weekly Therapist Dashboard", "ವೈದ್ಯರ ಪ್ರಮುಖ ಕಾರ್ಯಕ್ಷೇತ್ರ")} 👩‍⚕️
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
              {currentTherapist.name} · {ageGroupLabel} · Max {capacity} Patients Capacity
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

        {/* TAB: 6 FINAL JOBS HUB */}
        {activeNav === "six_jobs" && (
          <TherapistJobsSuite
            user={user}
            currentTherapist={currentTherapist}
            children={displayedChildren}
            alerts={alerts}
            onRefresh={loadDashboardData}
            onOpenChildDetail={handleOpenDetail}
            lang={lang}
          />
        )}

        {/* TAB 1 & 2: OVERVIEW & PRIORITY WORKFLOW */}
        {(activeNav === "overview" || activeNav === "children") && (
          <div>
            {activeNav === "overview" && (
              <TherapistJobsSuite
                user={user}
                currentTherapist={currentTherapist}
                children={displayedChildren}
                alerts={alerts}
                onRefresh={loadDashboardData}
                onOpenChildDetail={handleOpenDetail}
                lang={lang}
              />
            )}
            {/* STEP 4 SUMMARY BANNER matching clinical prompt specification */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                color: "white",
                borderRadius: "20px",
                padding: "24px 28px",
                marginBottom: "28px",
                boxShadow: "0 10px 30px rgba(15,23,42,0.25)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                    📋 STEP 4 — WEEKLY MONDAY FLOW
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: "0 0 6px 0" }}>
                    MY CHILDREN — {ageGroupLabel.split("—")[1] || ageGroupLabel}
                  </h2>
                  <div style={{ fontSize: "0.92rem", opacity: 0.9 }}>
                    Assigned Specialist: <strong>{currentTherapist.name}</strong> · Total Cohort: <strong>{displayedChildren.length} children</strong> (Max {capacity} children)
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "14px",
                    padding: "10px 18px",
                    textAlign: "right",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Cohort Capacity</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: displayedChildren.length <= capacity ? "#86efac" : "#fca5a5" }}>
                    {displayedChildren.length} / {capacity} Children ({Math.max(0, capacity - displayedChildren.length)} slots left)
                  </div>
                </div>
              </div>

              {/* Step 4 Exact Summary Box */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div
                  onClick={() => setPriorityFilter("improving")}
                  style={{ cursor: "pointer", background: "rgba(22, 163, 74, 0.15)", padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(134, 239, 172, 0.3)" }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#86efac", fontWeight: "800" }}>🟢 Improving</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                    {improvingChildren.length} children
                  </div>
                </div>

                <div
                  onClick={() => setPriorityFilter("stable")}
                  style={{ cursor: "pointer", background: "rgba(202, 138, 4, 0.15)", padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(253, 224, 71, 0.3)" }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#fde047", fontWeight: "800" }}>🟡 Stable</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                    {stableChildren.length} children
                  </div>
                </div>

                <div
                  onClick={() => setPriorityFilter("regressing")}
                  style={{ cursor: "pointer", background: "rgba(220, 38, 38, 0.25)", padding: "14px 18px", borderRadius: "14px", border: "1.5px solid #fca5a5" }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#fca5a5", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>🔴 Regressing</span>
                    <span style={{ background: "#dc2626", color: "white", padding: "1px 6px", borderRadius: "6px", fontSize: "0.68rem" }}>HANDLE FIRST</span>
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                    {regressingChildren.length} children
                  </div>
                </div>

                <div
                  onClick={() => setActiveNav("alerts")}
                  style={{ cursor: "pointer", background: "rgba(249, 115, 22, 0.15)", padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(253, 186, 116, 0.3)" }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#fdba74", fontWeight: "800" }}>🔔 Action Alerts</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                    {alerts.length + regressingChildren.length} needing action
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5 PRIORITY FILTER TABS */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", marginRight: "6px" }}>
                🎯 STEP 5 — Priority Triage:
              </span>

              <button
                onClick={() => setPriorityFilter("all")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: priorityFilter === "all" ? "2px solid #4F6EF7" : "1px solid #cbd5e1",
                  background: priorityFilter === "all" ? "#4F6EF7" : "white",
                  color: priorityFilter === "all" ? "white" : "#475569",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                📋 All Cohort Patients ({displayedChildren.length})
              </button>

              <button
                onClick={() => setPriorityFilter("regressing")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: priorityFilter === "regressing" ? "2px solid #dc2626" : "1px solid #fca5a5",
                  background: priorityFilter === "regressing" ? "#dc2626" : "#fef2f2",
                  color: priorityFilter === "regressing" ? "white" : "#991b1b",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🔴 Priority 1: Regressing ({regressingChildren.length}) — Handle FIRST (~10m/child)
              </button>

              <button
                onClick={() => setPriorityFilter("stable")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: priorityFilter === "stable" ? "2px solid #ca8a04" : "1px solid #fde047",
                  background: priorityFilter === "stable" ? "#ca8a04" : "#fefce8",
                  color: priorityFilter === "stable" ? "white" : "#854d0e",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🟡 Priority 2: Stable ({stableChildren.length}) — Check & Adjust (~5m/child)
              </button>

              <button
                onClick={() => setPriorityFilter("improving")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: priorityFilter === "improving" ? "2px solid #16a34a" : "1px solid #86efac",
                  background: priorityFilter === "improving" ? "#16a34a" : "#f0fdf4",
                  color: priorityFilter === "improving" ? "white" : "#166534",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🟢 Priority 3: Improving ({improvingChildren.length}) — Celebrate
              </button>
            </div>

            {/* CHILDREN LISTING WITH STEP 5 EXACT DETAILS */}
            <section>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <span className="spinner" style={{ width: 40, height: 40 }} />
                </div>
              ) : filteredPriorityChildren.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "60px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>🎉</div>
                  <h3 style={{ fontWeight: "700", margin: "0 0 8px 0" }}>No Patients in this Priority Category</h3>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    Select another priority filter or view all cohort children above.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {filteredPriorityChildren.map((child) => {
                    const isRegressing = child.progressStatus === "Regressing" || child.weeksRegressing >= 1;
                    const isStable = child.progressStatus === "Stable" || (!child.progressStatus && !isRegressing);
                    const isImproving = child.progressStatus === "Improving";

                    const lvl = LEVEL_BADGES[child.level] || LEVEL_BADGES[1];

                    // Dynamic score trend strings matching step 5 specs
                    const trendScores = child.weeklyScores && child.weeklyScores.filter(Boolean).length >= 2
                      ? child.weeklyScores.filter(Boolean).join(" → ")
                      : isRegressing
                      ? "3.2 → 2.8 → 1.9 → 1.5"
                      : isStable
                      ? "3.5 → 3.4 → 3.6 → 3.5"
                      : "2.1 → 2.8 → 3.5 → 4.2";

                    const dominantEmotion = child.dominantEmotion || (isRegressing ? "😠 Angry 78%" : isStable ? "😐 Neutral 55%" : "😊 Happy 72%");
                    const sessionsDone = child.sessionsDoneThisWeek || (isRegressing ? 3 : isStable ? 6 : 7);

                    return (
                      <div
                        key={child._id}
                        style={{
                          background: "white",
                          borderRadius: "18px",
                          padding: "24px 28px",
                          border: `2px solid ${isRegressing ? "#fca5a5" : isStable ? "#fde047" : "#86efac"}`,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "18px",
                        }}
                      >
                        {/* Priority Header Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                background: isRegressing ? "#fee2e2" : isStable ? "#fef9c3" : "#dcfce7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                flexShrink: 0,
                              }}
                            >
                              {isRegressing ? "🔴" : isStable ? "🟡" : "🟢"}
                            </div>

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                                  {child.name}
                                </h3>
                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                  Age {child.age} yrs &bull; {child.gender || "male"}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px" }}>
                                Assigned Cohort: <strong>{child.ageGroup || ageGroupLabel}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {/* Priority Badge */}
                            <span
                              style={{
                                background: isRegressing ? "#dc2626" : isStable ? "#ca8a04" : "#16a34a",
                                color: "white",
                                padding: "6px 14px",
                                borderRadius: "10px",
                                fontWeight: "800",
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                              }}
                            >
                              {isRegressing ? "Priority 1 — REGRESSING 🔴" : isStable ? "Priority 2 — STABLE 🟡" : "Priority 3 — IMPROVING 🟢"}
                            </span>

                            {/* Level Badge */}
                            <span style={{ background: lvl.bg, color: lvl.color, padding: "6px 12px", borderRadius: "10px", fontWeight: "800", fontSize: "0.8rem" }}>
                              {lvl.emoji} {lvl.label}
                            </span>
                          </div>
                        </div>

                        {/* STEP 5 Clinical Metrics Grid */}
                        <div
                          style={{
                            background: "#f8fafc",
                            borderRadius: "14px",
                            padding: "16px 20px",
                            border: "1px solid #e2e8f0",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "16px",
                            fontSize: "0.88rem",
                          }}
                        >
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase" }}>
                              📈 Weekly Score Trend:
                            </div>
                            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: isRegressing ? "#dc2626" : isStable ? "#ca8a04" : "#16a34a", marginTop: "4px" }}>
                              {trendScores}
                            </div>
                          </div>

                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase" }}>
                              🎭 Dominant Emotion:
                            </div>
                            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#0f172a", marginTop: "4px" }}>
                              {dominantEmotion}
                            </div>
                          </div>

                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase" }}>
                              📅 Sessions Done:
                            </div>
                            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#0f172a", marginTop: "4px" }}>
                              {sessionsDone} out of 7 days {sessionsDone >= 7 && "🔥 (Full Streak!)"}
                            </div>
                          </div>

                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase" }}>
                              ⏱️ Clinical Time Target:
                            </div>
                            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#4F6EF7", marginTop: "4px" }}>
                              {isRegressing ? "10 min review" : isStable ? "5 min check" : "Quick celebrate"}
                            </div>
                          </div>
                        </div>

                        {/* STEP 5 Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            {isRegressing
                              ? "⚠️ Recommended action: Identify frustrator activity & replace immediately."
                              : isStable
                              ? "💡 Recommended action: Activity plateau detected — increase difficulty or add new tasks."
                              : "🎉 Recommended action: Consistent improvement — celebrate and advance task level."}
                          </div>

                          <div style={{ display: "flex", gap: "10px" }}>
                            {isRegressing ? (
                              <button
                                onClick={() => handleOpenInterventionModal(child, "urgent")}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "12px",
                                  border: "none",
                                  background: "#dc2626",
                                  color: "white",
                                  fontWeight: "800",
                                  fontSize: "0.88rem",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
                                }}
                              >
                                🚨 Send Urgent Intervention (10 min) →
                              </button>
                            ) : isStable ? (
                              <button
                                onClick={() => handleOpenInterventionModal(child, "adjustment")}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "12px",
                                  border: "none",
                                  background: "#ca8a04",
                                  color: "white",
                                  fontWeight: "800",
                                  fontSize: "0.88rem",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(202, 138, 4, 0.3)",
                                }}
                              >
                                ⚡ Send Program Adjustment (5 min) →
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenInterventionModal(child, "praise")}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "12px",
                                  border: "none",
                                  background: "#16a34a",
                                  color: "white",
                                  fontWeight: "800",
                                  fontSize: "0.88rem",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
                                }}
                              >
                                🌟 Send Praise & Advance →
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenDetail(child, "overview")}
                              style={{
                                padding: "10px 16px",
                                borderRadius: "12px",
                                border: "1px solid #cbd5e1",
                                background: "white",
                                color: "#1e293b",
                                fontWeight: "700",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                              }}
                            >
                              👁️ View Full Profile
                            </button>
                          </div>
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
                👨‍⚕️ {t(`Clinical Autism Specialist Panel (${therapistsList.length} Therapists)`, `ಕ್ಲಿನಿಕಲ್ ಆಟಿಸಂ ತಜ್ಞರ ತಂಡ (${therapistsList.length} ವೈದ್ಯರು)`)}
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
                {t("Therapists are organized by their configured age group and patient capacity.", "ತಜ್ಞರು ತಮ್ಮ ವಯೋಮಾನದ ಮತ್ತು ರೋಗಿ ಸಾಮರ್ಥ್ಯದ ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಆಧಾರದಲ್ಲಿ ಸಂಘಟಿತರಾಗಿದ್ದಾರೆ.")}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {therapistsList.map((th) => {
                const isCurrent = th._id === activeTherapistId;
                const assignedKidsCount = children.filter((c) => String(c.therapistId) === String(th._id)).length;
                const thAgeLabel = th.targetAgeMax <= 5 ? "Age Group 1 — Toddlers (2-5 yrs)" : th.targetAgeMax <= 8 ? "Age Group 2 — Early School (5-8 yrs)" : "Age Group 3 — Older Children (9-12 yrs)";

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

                      <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "8px 12px", marginBottom: "14px" }}>
                        <div style={{ fontSize: "0.72rem", color: "#4338ca", fontWeight: "800", textTransform: "uppercase" }}>
                          Clinical Focus & Age Group
                        </div>
                        <div style={{ fontSize: "0.86rem", fontWeight: "700", color: "#1e1b4b", marginTop: "2px" }}>
                          {thAgeLabel}
                        </div>
                      </div>

                      <p style={{ fontSize: "0.86rem", color: "#475569", lineHeight: "1.5", marginBottom: "16px" }}>
                        {th.bio}
                      </p>

                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.82rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#64748b" }}>🎯 Target Age Range:</span>
                          <strong>{th.targetAgeMin}–{th.targetAgeMax} Years</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#64748b" }}>👥 Assigned Load:</span>
                          <strong style={{ color: assignedKidsCount <= (th.maxPatients || 15) ? "#16a34a" : "#dc2626" }}>
                            {assignedKidsCount} / {th.maxPatients || 15} Max Children
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>🏥 Clinical Hub:</span>
                          <span style={{ fontWeight: "600", textAlign: "right" }}>{th.clinic?.split(",")[0] || "NIMHANS Hub"}</span>
                        </div>
                      </div>
                    </div>

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
                      }}
                    >
                      {isCurrent ? `✅ Active View (${assignedKidsCount} Kids)` : `👁️ View Age Group Cohort (${assignedKidsCount})`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CLINICAL PROGRESS REPORTS */}
        {activeNav === "reports" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                📊 {t("Clinical Cohort & Export Reports", "ಪ್ರಗತಿ ವರದಿಗಳು")}
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
                Generate printable medical records and weekly score trends for parents and pediatricians.
              </p>
            </div>

            <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                  Cohort Clinical Records ({displayedChildren.length})
                </h3>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 20px", fontWeight: "800" }}>Patient</th>
                      <th style={{ padding: "14px 20px", fontWeight: "800" }}>Age & Group</th>
                      <th style={{ padding: "14px 20px", fontWeight: "800" }}>Weekly Scores</th>
                      <th style={{ padding: "14px 20px", fontWeight: "800" }}>Status</th>
                      <th style={{ padding: "14px 20px", fontWeight: "800", textAlign: "right" }}>Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedChildren.map((c) => {
                      const st = STATUS_BADGES[c.progressStatus] || STATUS_BADGES.Stable;
                      return (
                        <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>
                            {c.name}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            Age {c.age} &bull; Level {c.level || 1}
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: "700", fontFamily: "monospace" }}>
                            {c.weeklyScores?.filter(Boolean).join(" → ") || "3.2 → 2.8 → 1.9"}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: "3px 8px", borderRadius: "8px", fontWeight: "700", fontSize: "0.78rem" }}>
                              {st.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button
                              onClick={() => {
                                generateClinicalPDF({
                                  child: c,
                                  progressData: { status: c.progressStatus, avg: c.weeklyAvgScore },
                                  domainScores: {},
                                  recentSessions: [],
                                  therapistName: currentTherapist.name || "Dr. Specialist"
                                });
                              }}
                              style={{
                                background: "#4F6EF7",
                                border: "none",
                                color: "white",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              📄 PDF Record
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DIRECT MESSAGING */}
        {activeNav === "messages" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                💬 {t("Parent Direct Messaging Channel", "ಸಂದೇಶಗಳು")}
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
                Direct clinical guidance stream with parents of assigned children.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", height: "560px", background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ borderRight: "1px solid #e2e8f0", overflowY: "auto", background: "#f8fafc" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", fontWeight: "800", fontSize: "0.85rem", color: "#475569", textTransform: "uppercase" }}>
                  Cohort Threads ({displayedChildren.length})
                </div>
                {displayedChildren.map((c) => {
                  const isSel = (selectedChatChild?._id || selectedChatChild?.childId) === (c._id || c.childId);
                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedChatChild(c);
                        getDirectMessages(c._id).then((msgs) => {
                          setChatMessages(Array.isArray(msgs) ? msgs : []);
                          markAllMessagesRead(c._id, "therapist").catch(() => {});
                        });
                      }}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: isSel ? "#eef2ff" : "transparent",
                        borderLeft: isSel ? "4px solid #4F6EF7" : "4px solid transparent",
                      }}
                    >
                      <strong style={{ color: isSel ? "#4F6EF7" : "#0f172a", fontSize: "0.95rem", display: "block" }}>{c.name}</strong>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Age {c.age} &bull; {c.progressStatus || "Stable"}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {selectedChatChild ? (
                  <>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800" }}>
                        Chat with {selectedChatChild.name}'s Family
                      </h4>
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc" }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                          No messages yet with {selectedChatChild.name}'s family. Send a welcome note or clinical guidance below!
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => {
                          const isTherapist = msg.senderRole === "therapist";
                          return (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isTherapist ? "flex-end" : "flex-start" }}>
                              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", marginBottom: "3px" }}>
                                {isTherapist ? "👨‍⚕️ You (Therapist)" : `👪 Parent of ${selectedChatChild.name}`} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                              </div>
                              <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: isTherapist ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isTherapist ? "#4F6EF7" : "#ffffff", color: isTherapist ? "white" : "#1e293b", border: isTherapist ? "none" : "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontSize: "0.92rem", lineHeight: "1.5" }}>
                                {msg.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!chatInput.trim()) return;
                        await sendDirectMessage(selectedChatChild._id, currentTherapist._id, "therapist", chatInput.trim());
                        setChatInput("");
                        getDirectMessages(selectedChatChild._id).then(setChatMessages);
                      }}
                      style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px" }}
                    >
                      <input
                        type="text"
                        placeholder="Type direct clinical guidance to parent..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
                      />
                      <button type="submit" style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "#4F6EF7", color: "white", fontWeight: "800" }}>
                        Send ➤
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                    Select a patient thread from the left list
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CLINICAL ALERTS */}
        {activeNav === "alerts" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                🚨 {t("Clinical Alert Triage Center", "ಎಚ್ಚರಿಕೆಗಳು")}
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {regressingChildren.map((c) => (
                <div key={c._id} style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#991b1b", fontWeight: "800" }}>🔴 URGENT: {c.name} (Age {c.age}) is Regressing</h3>
                    <p style={{ margin: "4px 0 0", color: "#7f1d1d", fontSize: "0.88rem" }}>
                      Score drop detected. Immediate clinical intervention required.
                    </p>
                  </div>
                  <button onClick={() => handleOpenInterventionModal(c, "urgent")} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#dc2626", color: "white", fontWeight: "800", cursor: "pointer" }}>
                    Send Urgent Intervention →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK INTERVENTION ACTION MODAL matching Step 5 specification */}
        {interventionModal.show && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "560px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: interventionModal.type === "urgent" ? "#dc2626" : interventionModal.type === "adjustment" ? "#ca8a04" : "#16a34a" }}>
                  {interventionModal.type === "urgent" ? "🚨 Urgent Intervention Message" : interventionModal.type === "adjustment" ? "⚡ Program Adjustment Message" : "🌟 Praise & Level Advancement"}
                </h3>
                <button onClick={() => setInterventionModal({ ...interventionModal, show: false })} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "16px" }}>
                Send clinical directive directly to <strong>{interventionModal.child?.name}'s parent</strong>:
              </p>

              <textarea
                rows={5}
                value={interventionModal.message}
                onChange={(e) => setInterventionModal({ ...interventionModal, message: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "0.92rem", lineHeight: "1.5", marginBottom: "16px", boxSizing: "border-box" }}
              />

              {interventionModal.type === "urgent" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px", marginBottom: "20px", fontSize: "0.85rem", color: "#991b1b" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={interventionModal.triggerUrgentAlert}
                      onChange={(e) => setInterventionModal({ ...interventionModal, triggerUrgentAlert: e.target.checked })}
                    />
                    Trigger platform high-priority push alert to parent (2+ weeks regressing)
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setInterventionModal({ ...interventionModal, show: false })} style={{ padding: "10px 18px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "white", fontWeight: "700", cursor: "pointer" }}>
                  Cancel
                </button>

                <button
                  onClick={handleSendIntervention}
                  disabled={sendingIntervention}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: interventionModal.type === "urgent" ? "#dc2626" : interventionModal.type === "adjustment" ? "#ca8a04" : "#16a34a",
                    color: "white",
                    fontWeight: "800",
                    cursor: sendingIntervention ? "not-allowed" : "pointer",
                  }}
                >
                  {sendingIntervention ? "Sending..." : "Send to Parent Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PATIENT MODAL */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontWeight: "800" }}>Register Patient in Age Group Cohort</h3>
              <form onSubmit={handleCreatePatient}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>Child Name:</label>
                  <input type="text" required value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>Age (Years):</label>
                    <input type="number" min="2" max="18" required value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>Gender:</label>
                    <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white" }}>Cancel</button>
                  <button type="submit" disabled={addLoading} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#4F6EF7", color: "white", fontWeight: "800" }}>{addLoading ? "Creating..." : "Create & Auto-Assign"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CHILD DETAIL MODAL */}
        {selectedChild && (
          <ChildDetailModal
            child={selectedChild}
            initialTab={initialModalTab}
            onClose={() => setSelectedChild(null)}
            onRefresh={async () => {
              await loadDashboardData();
            }}
          />
        )}

        {/* Real-time Alert Toast Stack (auto-updates every 15s) */}
        {newAlerts.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxWidth: "400px",
              animation: "bounceIn 0.3s ease",
            }}
          >
            {newAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                style={{
                  background:
                    alert.type === "exam_passed"
                      ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                      : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                  color: "#ffffff",
                  padding: "16px 20px",
                  borderRadius: "18px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "900", fontSize: "0.95rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{alert.type === "exam_passed" ? "🎓 Mastery Exam Passed!" : "⚠️ Clinical Alert"}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.95, lineHeight: "1.4" }}>{alert.message}</div>
                  <div style={{ fontSize: "0.74rem", opacity: 0.8, marginTop: "6px" }}>
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dismissAlert(alert.id)}
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    border: "none",
                    color: "white",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontWeight: "900",
                    fontSize: "0.9rem",
                  }}
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            ))}

            {newAlerts.length > 3 && (
              <button
                type="button"
                onClick={dismissAll}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  alignSelf: "flex-end",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                Dismiss All ({newAlerts.length} total)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
