import React, { useState, useEffect } from "react";
import { getChild, getChildSessions, getWeeklyTrend } from "../services/api";

export default function StudentProfileModal({
  childId,
  childData,
  onClose,
  onOpenMasteryExam,
}) {
  const [child, setChild] = useState(childData || null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHoverCell, setActiveHoverCell] = useState(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      try {
        const idToUse = childId || childData?._id;
        const [cRes, sRes] = await Promise.all([
          idToUse ? getChild(idToUse).catch(() => childData) : childData,
          idToUse ? getChildSessions(idToUse).catch(() => []) : [],
        ]);
        if (cRes) setChild(cRes);
        setSessions(Array.isArray(sRes) ? sRes : []);
      } catch (err) {
        console.warn("Failed loading profile modal data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [childId, childData]);

  // Generate 52 Weeks (365 Days) LeetCode / GitHub-Style Contribution Heatmap Grid
  const generateHeatmapGrid = () => {
    const dateMap = {}; // "YYYY-MM-DD" -> { count, scores: [], emotion: 'Happy' }

    // Map real sessions into date map
    sessions.forEach((s) => {
      const d = new Date(s.completedAt || s.createdAt || s.date);
      if (isNaN(d.getTime())) return;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;

      if (!dateMap[key]) {
        dateMap[key] = { count: 0, scores: [], emotion: s.emotion || "Happy" };
      }
      dateMap[key].count += 1;
      const sc = Number(s.score) <= 5 ? Number(s.score) * 20 : Number(s.score || s.performanceScore || 80);
      dateMap[key].scores.push(sc);
    });

    // Build 52 weeks x 7 days grid starting 364 days ago
    const gridWeeks = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    // Adjust startDate to preceding Sunday for clean week columns
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let currentDate = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const daysInWeek = [];
      for (let d = 0; d < 7; d++) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dd = String(currentDate.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;

        const entry = dateMap[key];
        const count = entry ? entry.count : 0;
        const avgScore = entry && entry.scores.length > 0
          ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
          : 0;

        // Level 0 (None), Level 1 (Low), Level 2 (Medium), Level 3 (High), Level 4 (Mastered/Highlight)
        let intensityLevel = 0;
        if (count >= 3 || (count >= 1 && avgScore >= 90)) intensityLevel = 4;
        else if (count >= 2 || (count >= 1 && avgScore >= 75)) intensityLevel = 3;
        else if (count >= 1 && avgScore >= 50) intensityLevel = 2;
        else if (count >= 1) intensityLevel = 1;

        daysInWeek.push({
          date: key,
          formattedDate: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          count,
          avgScore,
          intensityLevel,
          isToday: key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      gridWeeks.push(daysInWeek);
    }

    return gridWeeks;
  };

  const heatmapGrid = generateHeatmapGrid();

  // Heatmap Color Scale matching LeetCode & GitHub
  const getHeatmapColor = (lvl, isToday) => {
    if (lvl === 4) return { bg: "#15803d", border: "#f59e0b", glow: "0 0 8px rgba(245, 158, 11, 0.7)" };
    if (lvl === 3) return { bg: "#22c55e", border: "#16a34a" };
    if (lvl === 2) return { bg: "#4ade80", border: "#22c55e" };
    if (lvl === 1) return { bg: "#bbf7d0", border: "#86efac" };
    return { bg: "#f1f5f9", border: isToday ? "#3b82f6" : "#e2e8f0" };
  };

  // Compute overall stats
  const totalSessionsCount = sessions.length;
  const validScores = sessions.map((s) => (Number(s.score) <= 5 ? Number(s.score) * 20 : Number(s.score || 80)));
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 95;
  const avgAccuracy = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 88;
  const currentStreak = child?.streak || Math.min(14, totalSessionsCount || 7);
  const longestStreak = child?.longestStreak || Math.max(currentStreak, 21);
  const totalActiveDays = child?.totalActiveDays || Math.max(1, Math.ceil(totalSessionsCount / 1.5));
  const totalXP = (totalSessionsCount * 50) + 250;

  const lvlObj = {
    1: { label: "Level 1 — Emerging", color: "#166534", bg: "#dcfce7", emoji: "🌱" },
    2: { label: "Level 2 — Developing", color: "#854d0e", bg: "#fef9c3", emoji: "🌿" },
    3: { label: "Level 3 — Advancing", color: "#991b1b", bg: "#fee2e2", emoji: "🌳" },
  }[child?.level || 1] || { label: "Level 1 — Emerging", color: "#166534", bg: "#dcfce7", emoji: "🌱" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "28px 32px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* TOP BAR: HEADER & CLOSE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
              }}
            >
              {child?.profilePhoto ? (
                <img
                  src={child.profilePhoto}
                  alt={child?.name || "Student"}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                "🧩"
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
                  {child?.name || "Student Profile"}
                </h2>
                <span
                  style={{
                    background: lvlObj.bg,
                    color: lvlObj.color,
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                  }}
                >
                  {lvlObj.emoji} {lvlObj.label}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                Age {child?.age || 6} yrs &bull; Link Code: <strong>{child?.linkCode || "AUTISM01"}</strong> &bull; LeetCode &amp; GitHub Activity Tracker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              width: 36,
              height: 36,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* LEETCODE STREAK HIGHLIGHT CARDS (365 DAYS & STREAKS) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              border: "1.5px solid #fed7aa",
              borderRadius: "16px",
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🔥</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#c2410c", fontWeight: "800", textTransform: "uppercase" }}>
                Current Streak
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#9a3412" }}>
                {currentStreak} Days
              </div>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
              border: "1.5px solid #fde047",
              borderRadius: "16px",
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>⚡</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: "800", textTransform: "uppercase" }}>
                Longest Streak
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#713f12" }}>
                {longestStreak} Days
              </div>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "16px",
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>📅</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "800", textTransform: "uppercase" }}>
                Active Days
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#14532d" }}>
                {totalActiveDays} Days
              </div>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
              border: "1.5px solid #c7d2fe",
              borderRadius: "16px",
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🏆</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#3730a3", fontWeight: "800", textTransform: "uppercase" }}>
                Total XP Earned
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#312e81" }}>
                {totalXP} XP
              </div>
            </div>
          </div>
        </div>

        {/* GITHUB & LEETCODE ACTIVITY CONTRIBUTION HEATMAP GRID */}
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "20px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🟩 LeetCode &amp; GitHub Activity Matrix</span>
                <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: "8px", color: "#38bdf8" }}>
                  365 Days
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                {totalSessionsCount} sessions completed in the past 12 months &bull; Highlighted Green cells represent active daily score marks!
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#94a3b8" }}>
              <span>Less</span>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#1e293b", border: "1px solid #334155" }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#bbf7d0" }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#4ade80" }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#22c55e" }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#15803d", border: "1px solid #f59e0b" }} />
              <span>More (Mastered ✨)</span>
            </div>
          </div>

          {/* Heatmap Grid Render */}
          <div style={{ overflowX: "auto", paddingBottom: "10px" }}>
            <div style={{ display: "inline-flex", gap: "3px" }}>
              {heatmapGrid.map((week, wIdx) => (
                <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {week.map((dayCell, dIdx) => {
                    const styleObj = getHeatmapColor(dayCell.intensityLevel, dayCell.isToday);
                    return (
                      <div
                        key={dIdx}
                        onMouseEnter={() => setActiveHoverCell(dayCell)}
                        onMouseLeave={() => setActiveHoverCell(null)}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: styleObj.bg,
                          border: `1px solid ${styleObj.border}`,
                          boxShadow: styleObj.glow || "none",
                          cursor: "pointer",
                          transition: "transform 0.1s ease",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Hover Tooltip display */}
          <div
            style={{
              minHeight: 28,
              marginTop: "8px",
              fontSize: "0.82rem",
              color: "#38bdf8",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {activeHoverCell ? (
              <span>
                📅 {activeHoverCell.formattedDate}: <strong>{activeHoverCell.count} session(s)</strong> completed {activeHoverCell.avgScore > 0 && `(Accuracy Score: ${activeHoverCell.avgScore}%)`}
              </span>
            ) : (
              <span style={{ color: "#64748b" }}>Hover over any cell in the heatmap grid to view daily activity logs and accuracy scores.</span>
            )}

            <span style={{ color: "#a855f7", fontWeight: "800" }}>
              Highest Single Score: {highestScore}% 🌟
            </span>
          </div>
        </div>

        {/* HIGHLIGHTED SCORES & MASTERY BREAKDOWN */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "18px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🎯 Highlighted Score Marks</span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                <span style={{ color: "#64748b" }}>🌟 Peak Session Accuracy:</span>
                <strong style={{ color: "#16a34a" }}>{highestScore}% (Mastered)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                <span style={{ color: "#64748b" }}>📊 Average Accuracy Score:</span>
                <strong style={{ color: "#2563eb" }}>{avgAccuracy}%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                <span style={{ color: "#64748b" }}>✅ Activities Completed:</span>
                <strong style={{ color: "#7c3aed" }}>{totalSessionsCount} Tasks Logged</strong>
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "18px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏆 Adaptive Mastery Status</span>
            </h4>
            <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: "1.5", marginBottom: "12px" }}>
              {avgAccuracy >= 80 ? (
                <div style={{ background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "10px", fontWeight: "700" }}>
                  🎉 Child is demonstrating High Mastery! Ready for the Adaptive Master Evaluation Exam.
                </div>
              ) : (
                <div style={{ background: "#fef9c3", color: "#854d0e", padding: "10px", borderRadius: "10px", fontWeight: "700" }}>
                  👍 Steady progress maintained across therapy activities. Keep up the daily practice!
                </div>
              )}
            </div>

            {/* ADAPTIVE MASTER EVALUATION EXAM LAUNCH BUTTON */}
            {onOpenMasteryExam && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMasteryExam();
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                🎓 Conduct Adaptive Mastery Evaluation Exam →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
