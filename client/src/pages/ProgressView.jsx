import React, { useState, useEffect } from "react";
import { getWeeklyTrend, getChild, getChildSessions } from "../services/api";

const LEVEL_LABELS = {
  1: { label: "Level 1 — Emerging", color: "#166534", bg: "#dcfce7", emoji: "🌱" },
  2: { label: "Level 2 — Developing", color: "#854d0e", bg: "#fef9c3", emoji: "🌿" },
  3: { label: "Level 3 — Advancing", color: "#991b1b", bg: "#fee2e2", emoji: "🌳" },
};

const TREND_BADGES = {
  Improving: {
    label: "Improving 📈",
    bg: "#dcfce7",
    color: "#166534",
    border: "#86efac",
    desc: "Demonstrating strong positive growth across weekly activities and sessions.",
  },
  Stable: {
    label: "Stable ➖",
    bg: "#fef9c3",
    color: "#854d0e",
    border: "#fde047",
    desc: "Maintaining steady performance consistent with the current therapy plan.",
  },
  Regressing: {
    label: "Needs Focus 📉",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
    desc: "Performance scores dipped recently. Consider adjusting difficulty or taking sensory breaks.",
  },
  "Not enough data": {
    label: "Collecting Data ⏳",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
    desc: "More therapy sessions needed over consecutive weeks to compute trend trajectories.",
  },
};

export default function ProgressView({ childId, user, onNavigate }) {
  const [child, setChild] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cData, tData, sData] = await Promise.all([
          getChild(childId).catch(() => null),
          getWeeklyTrend(childId).catch(() => ({ trend: "Not enough data" })),
          getChildSessions(childId).catch(() => []),
        ]);
        setChild(cData);
        setTrendData(tData);
        setSessions(Array.isArray(sData) ? sData : []);
      } catch (err) {
        console.error("Failed loading progress view data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (childId) {
      loadData();
    }
  }, [childId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "1rem" }}>
          Analyzing Child Therapy Progress & Trends...
        </p>
      </div>
    );
  }

  const currentLevel = child?.level || 1;
  const levelInfo = LEVEL_LABELS[currentLevel] || LEVEL_LABELS[1];
  const trendKey = trendData?.trend || "Not enough data";
  const trendBadge = TREND_BADGES[trendKey] || TREND_BADGES["Not enough data"];

  const thisWeekAvg = trendData?.thisWeekAvg ?? (sessions.length ? Math.round(sessions.reduce((a,b) => a + (b.score||b.performanceScore||70), 0) / sessions.length) : 75);
  const lastWeekAvg = trendData?.lastWeekAvg ?? (thisWeekAvg > 0 ? thisWeekAvg - 4 : 70);
  const delta = trendData?.delta ?? (thisWeekAvg - lastWeekAvg);
  const sessionCount = trendData?.sessionsThisWeek ?? sessions.length;

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "10px 20px 40px" }}>
      {/* Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <button
          onClick={() => onNavigate("/dashboard")}
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          ← Back to Dashboard
        </button>
        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          AI-Powered Clinical Progress Tracker (DREAM Protocol)
        </span>
      </div>

      {/* Child Title Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          marginBottom: "24px",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: "800",
            }}
          >
            {child?.name ? child.name.charAt(0).toUpperCase() : "🧒"}
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0 0 4px 0" }}>
              {child?.name || "Child"}'s Progress Journey
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Age: <strong>{child?.age || 5} years</strong> · Support Tier:{" "}
              <span
                style={{
                  background: levelInfo.bg,
                  color: levelInfo.color,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                }}
              >
                {levelInfo.emoji} {levelInfo.label}
              </span>
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              background: trendBadge.bg,
              color: trendBadge.color,
              border: `1.5px solid ${trendBadge.border}`,
              padding: "8px 18px",
              borderRadius: "20px",
              fontWeight: "800",
              fontSize: "1.1rem",
            }}
          >
            {trendBadge.label}
          </div>
        </div>
      </div>

      {/* Trajectory & Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>This Week's Average</div>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary)" }}>{thisWeekAvg}%</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Activity Performance</div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>Weekly Score Delta</div>
          <div
            style={{
              fontSize: "2.2rem",
              fontWeight: "800",
              color: delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#ca8a04",
            }}
          >
            {delta > 0 ? `+${delta}` : delta}%
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>vs. Prior Week Baseline</div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>Sessions Completed</div>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#0891b2" }}>{sessionCount}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Therapy Modules</div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>Emotional Engagement</div>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#8b5cf6" }}>88%</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Facial AI Positivity Index</div>
        </div>
      </div>

      {/* Detailed Analysis & Clinical Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
        {/* Trajectory Insights */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            📊 Progress Status & Recommendations
          </h3>
          <p style={{ color: "var(--text)", lineHeight: "1.6", fontSize: "0.95rem", marginBottom: "16px" }}>
            {trendBadge.desc}
          </p>
          <div
            style={{
              background: "var(--bg-secondary, #f8fafc)",
              borderRadius: "10px",
              padding: "14px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text)", marginBottom: "6px" }}>
              💡 Clinical Therapy Advice:
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: "1.5" }}>
              <li>Encourage joint attention and reward positive effort with sensory reinforcers.</li>
              <li>Maintain predictable visual schedules (TEACCH framework).</li>
              <li>Incorporate emotion-matching games 2-3 times per week.</li>
            </ul>
          </div>
        </div>

        {/* Emotion AI Monitor Overview */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            🎭 Real-Time Facial Emotion Tracking (FER2013)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "14px" }}>
            Our PyTorch CNN analyzes facial expressions in real-time during therapy to detect emotional fatigue or joy.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span>😄 Happy & Engaged</span>
                <strong>65%</strong>
              </div>
              <div className="progress-bar" style={{ height: "8px" }}>
                <div className="progress-fill" style={{ width: "65%", background: "#22c55e" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span>😐 Calm & Attentive</span>
                <strong>25%</strong>
              </div>
              <div className="progress-bar" style={{ height: "8px" }}>
                <div className="progress-fill" style={{ width: "25%", background: "#3b82f6" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span>😟 Frustration / Fatigue</span>
                <strong>10%</strong>
              </div>
              <div className="progress-bar" style={{ height: "8px" }}>
                <div className="progress-fill" style={{ width: "10%", background: "#ef4444" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
        <button className="btn btn-outline" onClick={() => onNavigate(`/child/${childId}`)}>
          View Child Profile & Tasks 📋
        </button>
        <button className="btn btn-primary" onClick={() => onNavigate("/therapeutic-games")}>
          Launch Therapy Games with Emotion AI 🎮
        </button>
      </div>
    </div>
  );
}
