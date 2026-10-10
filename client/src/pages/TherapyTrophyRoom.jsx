import React, { useState, useEffect } from "react";
import { getChildTasks, getActivities, getChildren, getLeaderboard } from "../services/api";
import InteractiveGameZone from "../components/InteractiveGameZone";
import jsPDF from "jspdf";

// ─── Category Icons ────────────────────────────────────────────────────────────
const CATEGORY_ICON = {
  Communication: "💬",
  "Motor Skills": "🖐️",
  Social: "👫",
  Sensory: "👁️",
  "Life Skills": "🏠",
  Emotional: "❤️",
  "Sensory and Motor": "🎨",
  Cognitive: "🧩",
};

// ─── Badge Definitions ─────────────────────────────────────────────────────────
const BADGE_DEFS = [
  {
    id: "enrolled_star",
    emoji: "🌱",
    name: "Enrolled Star",
    desc: "Enrolled in the AutismAssist therapeutic intervention program!",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
    condition: () => true,
  },
  {
    id: "first_step",
    emoji: "🌟",
    name: "First Step Explorer",
    desc: "Completed your baseline clinical assessment & first steps!",
    color: "#ca8a04",
    bg: "#fef9c3",
    border: "#fde047",
    condition: () => true,
  },
  {
    id: "triple_star",
    emoji: "⭐⭐⭐",
    name: "Triple Star",
    desc: "Completed 3 therapy activities!",
    color: "#ca8a04",
    bg: "#fef9c3",
    border: "#fde047",
    condition: (completed) => completed.length >= 3,
  },
  {
    id: "high_five",
    emoji: "🖐️",
    name: "High Five Hero",
    desc: "Completed 5 therapy activities!",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#a5b4fc",
    condition: (completed) => completed.length >= 5,
  },
  {
    id: "ten_champion",
    emoji: "🏆",
    name: "Ten-Task Champion",
    desc: "Mastered 10 therapy activities! Incredible effort!",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    condition: (completed) => completed.length >= 10,
  },
  {
    id: "emotion_expert",
    emoji: "😊",
    name: "Emotion Explorer",
    desc: "Completed an Emotional or Social activity!",
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#f9a8d4",
    condition: (completed) =>
      completed.some((a) => ["Emotional", "Social"].includes(a.category)),
  },
  {
    id: "communication_pro",
    emoji: "💬",
    name: "Communication Pro",
    desc: "Mastered a Communication activity!",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#67e8f9",
    condition: (completed) =>
      completed.some((a) => a.category === "Communication"),
  },
  {
    id: "sensory_star",
    emoji: "👁️",
    name: "Sensory Star",
    desc: "Completed a Sensory or Motor Skills activity!",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fdba74",
    condition: (completed) =>
      completed.some((a) =>
        ["Sensory", "Motor Skills", "Sensory and Motor"].includes(a.category)
      ),
  },
  {
    id: "cognitive_genius",
    emoji: "🧩",
    name: "Cognitive Genius",
    desc: "Completed a Cognitive therapy activity!",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#7dd3fc",
    condition: (completed) =>
      completed.some((a) => a.category === "Cognitive"),
  },
  {
    id: "life_skills_master",
    emoji: "🏠",
    name: "Life Skills Master",
    desc: "Completed a Life Skills activity — independence champion!",
    color: "#047857",
    bg: "#f0fdf4",
    border: "#6ee7b7",
    condition: (completed) =>
      completed.some((a) => a.category === "Life Skills"),
  },
  {
    id: "streak_warrior",
    emoji: "🔥",
    name: "Streak Warrior",
    desc: "Maintained a 5-day therapy streak!",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    condition: (_, tasks) => (tasks?.streak || 0) >= 5,
  },
  {
    id: "xp_legend",
    emoji: "⚡",
    name: "XP Legend",
    desc: "Earned 500+ total XP points!",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    condition: (completed) => completed.length * 50 >= 500,
  },
  {
    id: "full_master",
    emoji: "🌟",
    name: "Full Mastery",
    desc: "Completed ALL assigned therapy activities — you are amazing!",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fcd34d",
    condition: (completed, tasks) =>
      completed.length > 0 &&
      (tasks?.assigned?.length || 0) === 0 &&
      completed.length >= 5,
  },
];

// ─── Certificate Generator ─────────────────────────────────────────────────────
function generateCertificate(childName, childAge, completedCount, level) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Background gradient effect
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 210, "F");

  // Gold border frames
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(3);
  doc.rect(8, 8, 281, 194);
  doc.setLineWidth(1);
  doc.rect(12, 12, 273, 186);

  // Trophy emoji area
  doc.setFontSize(60);
  doc.text("🏆", 148.5, 48, { align: "center" });

  // Title
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF ACHIEVEMENT", 148.5, 68, { align: "center" });

  // Subtitle
  doc.setTextColor(165, 180, 252);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Therapy Activity Completion Award", 148.5, 78, {
    align: "center",
  });

  // Decorative line
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  doc.line(40, 83, 257, 83);

  // "This certifies that"
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(12);
  doc.text("This proudly certifies that", 148.5, 95, { align: "center" });

  // Child name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.setFont("helvetica", "bold");
  doc.text(childName || "Young Learner", 148.5, 112, { align: "center" });

  // Body
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `has successfully completed ${completedCount} therapy ${completedCount === 1 ? "activity" : "activities"}`,
    148.5,
    124,
    { align: "center" }
  );
  doc.text(
    `through the AutismAssist Home-Based Therapeutic Intervention Platform`,
    148.5,
    132,
    { align: "center" }
  );

  // Level badge area
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(114, 139, 69, 16, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `ASD Level ${level || 2} · Age ${childAge || "–"} yrs`,
    148.5,
    150,
    { align: "center" }
  );

  // Bottom line
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  doc.line(40, 161, 257, 161);

  // Date and org
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Issued on: ${today}`, 60, 172);
  doc.text("AutismAssist · Empowering Every Journey 🌟", 148.5, 172, {
    align: "center",
  });
  doc.text("autismassist.app", 237, 172, { align: "right" });

  doc.save(`${childName || "Child"}_TherapyCertificate.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────────────────────
// ─── Main Component ─────────────────────────────────────────────────────────────
export default function TherapyTrophyRoom({ user, childId, onNavigate }) {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(() => {
    if (childId) return childId;
    try {
      const stored = JSON.parse(localStorage.getItem("currentChild") || "{}");
      if (stored?._id) return stored._id;
    } catch (e) {}
    return null;
  });

  const [tasks, setTasks] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState({ leaderboard: [], currentChildRank: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ranking"); // 'ranking' | 'certificates' | 'badges' | 'activities'
  const [activeTask, setActiveTask] = useState(null);
  const [gameCompletedReward, setGameCompletedReward] = useState(false);
  const [completing, setCompleting] = useState("");
  const [generatingCert, setGeneratingCert] = useState(false);
  const [celebratingBadge, setCelebratingBadge] = useState(null);

  // Load parent's children if needed
  useEffect(() => {
    const parentId = user?._id || user?.id;
    if (parentId) {
      getChildren(parentId)
        .then((kids) => {
          const arr = Array.isArray(kids) ? kids : [];
          setChildrenList(arr);
          if (!selectedChildId && arr.length > 0) {
            setSelectedChildId(arr[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [user?._id, user?.id]);

  const fetchTasks = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [tasksRes, lbRes] = await Promise.all([
        getChildTasks(targetId).catch(() => null),
        getLeaderboard(targetId).catch(() => ({ leaderboard: [], currentChildRank: null })),
      ]);
      setTasks(tasksRes);
      if (lbRes) setLeaderboardData(lbRes);
    } catch (err) {
      console.error("Failed to fetch trophy room data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchTasks(selectedChildId);
    } else {
      setLoading(false);
    }
  }, [selectedChildId]);

  const handlePlayAgain = (act) => {
    setActiveTask(act);
    setGameCompletedReward(false);
  };

  const handleComplete = async (actId) => {
    setCompleting(actId);
    try {
      const { completeTask } = await import("../services/api");
      await completeTask(selectedChildId, actId);
      setGameCompletedReward(true);
      await fetchTasks(selectedChildId);
      setTimeout(() => {
        setGameCompletedReward(false);
        setActiveTask(null);
      }, 3000);
    } catch (err) {
      alert(err.message || "Failed to complete task");
    } finally {
      setCompleting("");
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const completed = tasks?.completed || [];
  const assigned = tasks?.assigned || [];
  const childName = tasks?.name || (childrenList.find((k) => k._id === selectedChildId)?.name) || "Young Learner";
  const childAge = tasks?.age || (childrenList.find((k) => k._id === selectedChildId)?.age) || 5;
  const childLevel = Number(tasks?.level) || Number(childrenList.find((k) => k._id === selectedChildId)?.level) || 2;
  const streak = Math.max(1, tasks?.streak || 1);
  const totalXP = Math.max(150, (completed.length || 1) * 50 + streak * 25);

  // Compute earned badges
  const earnedBadges = BADGE_DEFS.filter((b) => b.condition(completed, tasks));
  const lockedBadges = BADGE_DEFS.filter((b) => !b.condition(completed, tasks));

  // Certificates unlock conditions
  const certificates = [
    {
      id: "enrollment_cert",
      title: "Clinical Enrollment Certificate",
      subtitle: `Official AutismAssist Certificate: Enrolled in ASD Support Level ${childLevel}`,
      emoji: "📜",
      unlocked: true,
      color: "#059669",
      bg: "linear-gradient(135deg, #059669, #10b981)",
      threshold: 0,
    },
    {
      id: "first_cert",
      title: "First Step Explorer Certificate",
      subtitle: "Awarded for completing initial clinical therapy steps & baseline assessment",
      emoji: "🎓",
      unlocked: true,
      color: "#16a34a",
      bg: "linear-gradient(135deg, #16a34a, #15803d)",
      threshold: 1,
    },
    {
      id: "five_cert",
      title: "5-Activity Super Achiever",
      subtitle: "Awarded for completing 5 therapy activities across clinical domains",
      emoji: "🏅",
      unlocked: completed.length >= 5,
      color: "#4f46e5",
      bg: "linear-gradient(135deg, #4f46e5, #4338ca)",
      threshold: 5,
    },
    {
      id: "ten_cert",
      title: "Therapy Champion Certificate",
      subtitle: "Awarded for mastering 10 therapy activities with excellence",
      emoji: "🏆",
      unlocked: completed.length >= 10,
      color: "#b45309",
      bg: "linear-gradient(135deg, #d97706, #b45309)",
      threshold: 10,
    },
    {
      id: "master_cert",
      title: "Master Therapist Award",
      subtitle: "Awarded for completing 20+ activities — true dedication & perseverance!",
      emoji: "🌟",
      unlocked: completed.length >= 20,
      color: "#7c3aed",
      bg: "linear-gradient(135deg, #7c3aed, #6d28d9)",
      threshold: 20,
    },
  ];

  // Leaderboard data
  const peers = leaderboardData.leaderboard || [];
  const currentRankInfo = leaderboardData.currentChildRank;
  const childRank = currentRankInfo?.rank || 3;
  const topThree = peers.slice(0, 3);

  // ── GAME VIEW ─────────────────────────────────────────────────────────────
  if (activeTask) {
    return (
      <div
        className="fade-in"
        style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "60px" }}
      >
        {/* Back button */}
        <button
          className="btn btn-ghost"
          style={{ fontWeight: "700", marginBottom: "20px" }}
          onClick={() => {
            setActiveTask(null);
            setGameCompletedReward(false);
          }}
        >
          ← Back to Trophy Room
        </button>

        {/* Celebration Banner */}
        {gameCompletedReward && (
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
              marginBottom: "24px",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.35)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>
              🎉 ⭐ 🏆
            </div>
            <h2
              style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 6px" }}
            >
              Awesome Replay, {childName}!
            </h2>
            <p style={{ fontSize: "1.1rem", margin: 0, opacity: 0.95 }}>
              Activity completed again! +50 XP Earned! 🔥
            </p>
          </div>
        )}

        {/* Game card */}
        <div
          className="card"
          style={{ padding: "28px 32px", borderRadius: "24px" }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "18px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className="badge badge-category">
              {activeTask.category || "Therapy Activity"}
            </span>
            <span
              style={{
                background: "#fef3c7",
                color: "#b45309",
                padding: "4px 12px",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "0.82rem",
              }}
            >
              ⭐ +50 XP
            </span>
            <span
              style={{
                marginLeft: "auto",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                fontWeight: "700",
              }}
            >
              ⏱ {activeTask.duration || "10 min"}
            </span>
          </div>

          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: "900",
              color: "#1e1b4b",
              marginBottom: "8px",
            }}
          >
            🔄 Replaying: {activeTask.title}
          </h1>
          <p
            style={{
              color: "#4b5563",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {activeTask.description}
          </p>

          <div
            style={{
              background: "#fdf4ff",
              border: "2px solid #f0abfc",
              borderRadius: "24px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <InteractiveGameZone
              activity={activeTask}
              language="en"
              currentEmotion="Happy"
              emotionConfidence={85}
              onComplete={() => handleComplete(activeTask._id)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-success"
              style={{
                padding: "14px 28px",
                fontSize: "1.05rem",
                fontWeight: "800",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
              onClick={() => handleComplete(activeTask._id)}
              disabled={completing === activeTask._id}
            >
              {completing === activeTask._id ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />{" "}
                  Completing...
                </>
              ) : (
                "⭐ Finish Replay & Claim XP"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏆</div>
        <p style={{ color: "#64748b", fontWeight: "700" }}>
          Loading Trophy Room...
        </p>
      </div>
    );
  }

  // ── MAIN PAGE ──────────────────────────────────────────────────────────────
  return (
    <div
      className="animate-fade-in"
      style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "80px" }}
    >
      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)",
          borderRadius: "28px",
          padding: "36px 40px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(79,70,229,0.3)",
        }}
      >
        {/* Decorative circles */}
        {[200, 140, 80].map((size, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.06)",
              top: -size / 3,
              right: -size / 4 + i * 40,
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#a5b4fc",
                marginBottom: "6px",
              }}
            >
              🏆 Achievement Hub
            </div>
            <h1
              style={{
                fontSize: "2.4rem",
                fontWeight: "900",
                color: "#ffffff",
                margin: "0 0 6px",
                letterSpacing: "-0.5px",
              }}
            >
              {childName}'s Trophy Room ✨
            </h1>
            <p
              style={{
                color: "#c7d2fe",
                fontSize: "1rem",
                margin: 0,
                maxWidth: "500px",
              }}
            >
              Your personal gallery of completed activities, earned badges, and
              achievement certificates!
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {childrenList.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 14px",
                  borderRadius: "14px",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🧒</span>
                <select
                  value={selectedChildId || ""}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "none",
                    fontWeight: "800",
                    fontSize: "0.9rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {childrenList.map((k) => (
                    <option key={k._id} value={k._id} style={{ color: "#0f172a" }}>
                      {k.name} (Age {k.age})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() =>
                onNavigate
                  ? onNavigate("/dashboard")
                  : (window.location.href = "/dashboard")
              }
              style={{
                padding: "10px 20px",
                borderRadius: "14px",
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
                backdropFilter: "blur(6px)",
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* ── XP + Stats Row ───────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "14px",
            marginTop: "28px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            {
              icon: "🏆",
              label: "Cohort Rank",
              value: `#${childRank}`,
              color: "#facc15",
            },
            {
              icon: "✅",
              label: "Activities Done",
              value: completed.length,
              color: "#4ade80",
            },
            {
              icon: "⚡",
              label: "Total XP Earned",
              value: `${totalXP} XP`,
              color: "#facc15",
            },
            {
              icon: "🔥",
              label: "Current Streak",
              value: `${streak} Days`,
              color: "#fb923c",
            },
            {
              icon: "🏅",
              label: "Badges Earned",
              value: earnedBadges.length,
              color: "#c084fc",
            },
            {
              icon: "🎓",
              label: "Certificates",
              value: certificates.filter((c) => c.unlocked).length,
              color: "#60a5fa",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "18px",
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: stat.color,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "#94a3b8",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB SWITCHER (ALWAYS VISIBLE WITH LEADERBOARD) ─────────────── */}
      <div
        style={{
          display: "flex",
          background: "#e0e7ff",
          borderRadius: "18px",
          padding: "5px",
          gap: "4px",
          marginBottom: "28px",
          width: "fit-content",
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "ranking", label: "🏆 Community Ranking", count: `#${childRank}` },
          { id: "certificates", label: "🎓 Certificates", count: certificates.filter((c) => c.unlocked).length },
          { id: "badges", label: "🏅 Badges", count: `${earnedBadges.length}/${BADGE_DEFS.length}` },
          { id: "activities", label: "🎮 Completed Activities", count: completed.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              borderRadius: "14px",
              border: "none",
              background: activeTab === tab.id ? "#4f46e5" : "transparent",
              color: activeTab === tab.id ? "white" : "#4338ca",
              fontWeight: "800",
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {tab.label}
            <span
              style={{
                background:
                  activeTab === tab.id ? "rgba(255,255,255,0.25)" : "#c7d2fe",
                color: activeTab === tab.id ? "white" : "#4f46e5",
                borderRadius: "20px",
                padding: "1px 8px",
                fontSize: "0.78rem",
                fontWeight: "900",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 0 — COMMUNITY STAR RANKING & LEADERBOARD
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "ranking" && (
        <div className="fade-in">
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontWeight: "900", fontSize: "1.4rem", color: "#1e1b4b", margin: "0 0 6px" }}>
              🏆 Community Star Ranking & Peer Leaderboard
            </h2>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
              Positive, encouraging peer ranking celebrating therapy consistency, activity stars, and daily streaks!
            </p>
          </div>

          {/* Child's Highlighted Standing Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%)",
              borderRadius: "24px",
              padding: "26px 30px",
              color: "white",
              marginBottom: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "18px",
              boxShadow: "0 10px 30px rgba(79, 70, 229, 0.25)",
              border: "2px solid rgba(255,255,255,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "18px", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "3rem",
                  width: "74px",
                  height: "74px",
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                }}
              >
                {childRank === 1 ? "🥇" : childRank === 2 ? "🥈" : "🥉"}
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#c7d2fe", fontWeight: "800" }}>
                  ⭐ Your Official Cohort Standing
                </div>
                <div style={{ fontSize: "1.7rem", fontWeight: "900", margin: "3px 0" }}>
                  Rank #{childRank} — Top 10% Star Achiever! 🌟
                </div>
                <div style={{ fontSize: "0.92rem", color: "#e0e7ff" }}>
                  {childName} • {totalXP} XP • Level {childLevel} • {streak}-Day Streak 🔥 • Active Learner
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(10px)",
                padding: "14px 22px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.25)",
                textAlign: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ fontSize: "1.45rem", fontWeight: "900", color: "#facc15" }}>
                🚀 Super Star
              </div>
              <div style={{ fontSize: "0.78rem", color: "#c7d2fe", fontWeight: "700", marginTop: "2px" }}>
                24 Enrolled Peer Students
              </div>
            </div>
          </div>

          {/* Top 3 Animated Podium Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", marginBottom: "32px" }}>
            {topThree.map((peer, idx) => {
              const isCurrent = String(peer._id) === String(selectedChildId) || peer.rank === childRank;
              const medals = ["🥇 1st Place Champion", "🥈 2nd Place Explorer", "🥉 3rd Place Achiever"];
              const bgs = [
                "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              ];
              const borders = ["#f59e0b", "#94a3b8", "#f97316"];
              return (
                <div
                  key={peer._id || idx}
                  style={{
                    background: isCurrent ? "#eef2ff" : bgs[idx] || "#ffffff",
                    border: `2px solid ${isCurrent ? "#4f46e5" : borders[idx] || "#e2e8f0"}`,
                    borderRadius: "22px",
                    padding: "24px 20px",
                    textAlign: "center",
                    position: "relative",
                    boxShadow: isCurrent ? "0 8px 24px rgba(79,70,229,0.18)" : "0 4px 14px rgba(0,0,0,0.05)",
                    transform: isCurrent ? "translateY(-4px)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#4f46e5",
                        color: "white",
                        padding: "2px 14px",
                        borderRadius: "99px",
                        fontSize: "0.72rem",
                        fontWeight: "900",
                        letterSpacing: "1px",
                      }}
                    >
                      YOU! ⭐
                    </div>
                  )}
                  <div style={{ fontSize: "2.8rem", marginBottom: "6px" }}>
                    {idx === 0 ? "👑" : idx === 1 ? "🥈" : "🥉"}
                  </div>
                  <div style={{ fontWeight: "900", fontSize: "1.15rem", color: "#1e1b4b" }}>
                    {isCurrent ? `${childName} (You)` : peer.name}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "700", margin: "4px 0 12px" }}>
                    {medals[idx]} • Age {peer.age || 5} • Level {peer.level || 2}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "white",
                      padding: "6px 14px",
                      borderRadius: "99px",
                      fontWeight: "800",
                      color: "#4338ca",
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span>⚡ {peer.xp || 600} XP</span>
                    <span>•</span>
                    <span>🔥 {peer.streak || 4}d streak</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Community Peer Leaderboard Table */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem" }}>
                🌟 Cohort Star Leaderboard (All 24 Students)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "700" }}>
                Updated dynamically from daily activities
              </div>
            </div>

            <div>
              {peers.map((peer, idx) => {
                const isCurrent = String(peer._id) === String(selectedChildId) || peer.rank === childRank;
                return (
                  <div
                    key={peer._id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      borderBottom: idx < peers.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: isCurrent ? "#eef2ff" : "white",
                      transition: "background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background:
                            peer.rank === 1 ? "#fef3c7" : peer.rank === 2 ? "#f1f5f9" : peer.rank === 3 ? "#ffedd5" : "#f1f5f9",
                          color:
                            peer.rank === 1 ? "#b45309" : peer.rank === 2 ? "#475569" : peer.rank === 3 ? "#c2410c" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "900",
                          fontSize: "0.95rem",
                        }}
                      >
                        {peer.rank <= 3 ? (peer.rank === 1 ? "🥇" : peer.rank === 2 ? "🥈" : "🥉") : `#${peer.rank}`}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: isCurrent ? "#4338ca" : "#1e293b",
                            fontSize: "0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>{isCurrent ? `${childName} (You)` : peer.name}</span>
                          {isCurrent && (
                            <span
                              style={{
                                background: "#4f46e5",
                                color: "white",
                                padding: "1px 8px",
                                borderRadius: "99px",
                                fontSize: "0.68rem",
                                fontWeight: "900",
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          Age {peer.age || 5} • Level {peer.level || 2} • {peer.badgeTitle || "Star Explorer"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "900", color: "#f59e0b", fontSize: "1rem" }}>
                          ⚡ {peer.xp || 500} XP
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>
                          🔥 {peer.streak || 3}d streak
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 1 — COMPLETED ACTIVITIES
      ════════════════════════════════════════════════════════════════ */}
          {activeTab === "activities" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <h2
                  style={{
                    fontWeight: "900",
                    fontSize: "1.3rem",
                    margin: 0,
                    color: "#1e1b4b",
                  }}
                >
                  ✅ All Completed Activities
                  <span
                    style={{
                      marginLeft: "10px",
                      background: "#dcfce7",
                      color: "#16a34a",
                      borderRadius: "20px",
                      padding: "2px 12px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                    }}
                  >
                    {completed.length} done
                  </span>
                </h2>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    fontWeight: "600",
                  }}
                >
                  🔄 Click "Play Again" to replay any activity!
                </span>
              </div>

              {completed.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 24px",
                    background: "white",
                    borderRadius: "24px",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>🎮</div>
                  <h3 style={{ fontWeight: "800", color: "#1e1b4b", fontSize: "1.3rem", margin: "0 0 8px" }}>
                    No Completed Activities Yet
                  </h3>
                  <p style={{ color: "#64748b", margin: "0 auto 24px", maxWidth: "440px", fontSize: "0.95rem" }}>
                    Once {childName} completes assigned games or tasks from the dashboard, they will appear here for instant replay and extra XP!
                  </p>
                  <button
                    onClick={() =>
                      onNavigate
                        ? onNavigate("/dashboard")
                        : (window.location.href = "/dashboard")
                    }
                    className="btn btn-primary"
                    style={{ padding: "12px 28px", borderRadius: "14px", fontWeight: "800", fontSize: "0.95rem" }}
                  >
                    Start Assigned Activities →
                  </button>
                </div>
              ) : (
                <div className="grid-3">
                {completed.map((act) => {
                  const cardColor = act.color || "#16a34a";
                  const cardBg = act.bg || "#dcfce7";
                  const xpAmount = act.xp || 50;
                  const starCount = act.stars || 3;

                  return (
                    <div
                      key={act._id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "24px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        border: "2px solid #d1fae5",
                        transition:
                          "transform 0.2s ease, box-shadow 0.2s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 40px rgba(22,163,74,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 20px rgba(0,0,0,0.06)";
                      }}
                    >
                      {/* Completed pill badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: "14px",
                          left: "14px",
                          zIndex: 10,
                          background: "rgba(22,163,74,0.9)",
                          color: "#fff",
                          fontSize: "0.7rem",
                          fontWeight: "900",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        ✅ COMPLETED
                      </div>

                      {/* Color banner */}
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${cardColor}90, ${cardColor}bb)`,
                          padding: "20px 20px 38px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              position: "absolute",
                              width: "44px",
                              height: "44px",
                              borderRadius: "50%",
                              border: "2px solid rgba(255,255,255,0.15)",
                              top: `${-8 + i * 20}%`,
                              right: `${-4 + i * 14}%`,
                            }}
                          />
                        ))}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <div
                            style={{
                              background: "rgba(255,255,255,0.22)",
                              color: "#ffffff",
                              border: "1px solid rgba(255,255,255,0.4)",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: "900",
                              fontSize: "0.78rem",
                            }}
                          >
                            +{xpAmount} XP ⚡
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "3rem",
                            marginTop: "6px",
                          }}
                        >
                          {act.icon || CATEGORY_ICON[act.category] || "🎮"}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div
                        style={{
                          padding: "0 18px 18px",
                          marginTop: "-20px",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          zIndex: 2,
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "10px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: cardBg,
                              color: cardColor,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: "800",
                              fontSize: "0.72rem",
                            }}
                          >
                            {act.category || "Therapy"}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: "900",
                            margin: "0 0 4px",
                            color: "#111827",
                            lineHeight: 1.25,
                          }}
                        >
                          {act.title}
                        </h3>
                        {act.titleKn && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#6b7280",
                              marginBottom: "8px",
                              fontWeight: "700",
                            }}
                          >
                            {act.titleKn}
                          </div>
                        )}
                        <p
                          style={{
                            fontSize: "0.84rem",
                            color: "#4b5563",
                            lineHeight: "1.5",
                            margin: "0 0 12px",
                            flex: 1,
                          }}
                        >
                          {act.description?.substring(0, 85)}...
                        </p>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                          }}
                        >
                          <div style={{ fontSize: "0.95rem" }}>
                            {"⭐".repeat(starCount)}
                            {"☆".repeat(Math.max(0, 5 - starCount))}
                          </div>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#6b7280",
                              fontWeight: "700",
                            }}
                          >
                            ⏱ {act.duration || "10 mins"}
                          </div>
                        </div>

                        {/* Play Again Button */}
                        <button
                          onClick={() => handlePlayAgain(act)}
                          style={{
                            width: "100%",
                            padding: "11px",
                            borderRadius: "14px",
                            border: "none",
                            background:
                              "linear-gradient(135deg, #16a34a, #15803d)",
                            color: "#ffffff",
                            fontWeight: "900",
                            fontSize: "0.92rem",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "transform 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.03)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        >
                          🔄 Play Again
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2 — BADGES
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "badges" && (
            <div>
              {/* Earned Badges */}
              {earnedBadges.length > 0 && (
                <div style={{ marginBottom: "36px" }}>
                  <h2
                    style={{
                      fontWeight: "900",
                      fontSize: "1.3rem",
                      marginBottom: "6px",
                      color: "#1e1b4b",
                    }}
                  >
                    🏅 Earned Badges
                    <span
                      style={{
                        marginLeft: "10px",
                        background: "#fef9c3",
                        color: "#ca8a04",
                        borderRadius: "20px",
                        padding: "2px 12px",
                        fontSize: "0.82rem",
                        fontWeight: "800",
                      }}
                    >
                      {earnedBadges.length} unlocked
                    </span>
                  </h2>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "0.9rem",
                      marginBottom: "20px",
                    }}
                  >
                    These are the badges {childName} has earned through
                    hard work and dedication! 🌟
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        style={{
                          background: badge.bg,
                          border: `2px solid ${badge.border}`,
                          borderRadius: "20px",
                          padding: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                          cursor: "pointer",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onClick={() =>
                          setCelebratingBadge(
                            celebratingBadge === badge.id ? null : badge.id
                          )
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 28px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 16px rgba(0,0,0,0.06)";
                        }}
                      >
                        {/* Shine effect */}
                        <div
                          style={{
                            position: "absolute",
                            top: -30,
                            right: -30,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${badge.border}40 0%, transparent 70%)`,
                          }}
                        />

                        <div
                          style={{
                            fontSize: "3rem",
                            flexShrink: 0,
                            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                          }}
                        >
                          {badge.emoji}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: "900",
                              fontSize: "1rem",
                              color: badge.color,
                              marginBottom: "4px",
                            }}
                          >
                            {badge.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#475569",
                              lineHeight: 1.4,
                            }}
                          >
                            {badge.desc}
                          </div>
                        </div>

                        {/* Earned checkmark */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "14px",
                            fontSize: "1.1rem",
                          }}
                        >
                          ✅
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadges.length > 0 && (
                <div>
                  <h2
                    style={{
                      fontWeight: "900",
                      fontSize: "1.2rem",
                      marginBottom: "6px",
                      color: "#94a3b8",
                    }}
                  >
                    🔒 Locked Badges — Keep Going!
                  </h2>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "0.88rem",
                      marginBottom: "16px",
                    }}
                  >
                    Complete more activities to unlock these badges!
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {lockedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        style={{
                          background: "#f8fafc",
                          border: "2px dashed #cbd5e1",
                          borderRadius: "20px",
                          padding: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          opacity: 0.65,
                          filter: "grayscale(0.6)",
                        }}
                      >
                        <div style={{ fontSize: "3rem", flexShrink: 0 }}>
                          {badge.emoji}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: "900",
                              fontSize: "1rem",
                              color: "#64748b",
                              marginBottom: "4px",
                            }}
                          >
                            🔒 {badge.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#94a3b8",
                              lineHeight: 1.4,
                            }}
                          >
                            {badge.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3 — CERTIFICATES
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "certificates" && (
            <div>
              <div
                style={{
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontWeight: "900",
                    fontSize: "1.3rem",
                    marginBottom: "6px",
                    color: "#1e1b4b",
                  }}
                >
                  🎓 Achievement Certificates
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Unlock certificates by completing therapy milestones. Each
                  certificate can be downloaded as a beautiful PDF!
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "20px",
                }}
              >
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    style={{
                      borderRadius: "24px",
                      overflow: "hidden",
                      boxShadow: cert.unlocked
                        ? "0 8px 24px rgba(0,0,0,0.12)"
                        : "0 4px 16px rgba(0,0,0,0.06)",
                      border: cert.unlocked
                        ? `2px solid ${cert.color}40`
                        : "2px dashed #cbd5e1",
                      opacity: cert.unlocked ? 1 : 0.55,
                      filter: cert.unlocked ? "none" : "grayscale(0.5)",
                    }}
                  >
                    {/* Certificate Preview Banner */}
                    <div
                      style={{
                        background: cert.unlocked
                          ? cert.bg
                          : "linear-gradient(135deg, #94a3b8, #64748b)",
                        padding: "32px 24px",
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      {/* Decorative border lines */}
                      <div
                        style={{
                          position: "absolute",
                          inset: "8px",
                          border: "1.5px solid rgba(255,255,255,0.3)",
                          borderRadius: "16px",
                          pointerEvents: "none",
                        }}
                      />

                      <div style={{ fontSize: "3.5rem", marginBottom: "8px" }}>
                        {cert.unlocked ? cert.emoji : "🔒"}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          marginBottom: "6px",
                        }}
                      >
                        CERTIFICATE OF ACHIEVEMENT
                      </div>
                      <div
                        style={{
                          color: "#ffffff",
                          fontWeight: "900",
                          fontSize: "1.2rem",
                        }}
                      >
                        {cert.title}
                      </div>
                    </div>

                    {/* Certificate Body */}
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "20px 24px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.88rem",
                          color: "#4b5563",
                          marginBottom: "16px",
                          lineHeight: 1.5,
                        }}
                      >
                        {cert.subtitle}
                      </p>

                      {/* Progress indicator */}
                      {!cert.unlocked && (
                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.78rem",
                              color: "#64748b",
                              fontWeight: "700",
                              marginBottom: "6px",
                            }}
                          >
                            <span>Progress</span>
                            <span>
                              {completed.length}/{cert.threshold} activities
                            </span>
                          </div>
                          <div
                            style={{
                              height: "8px",
                              borderRadius: "99px",
                              background: "#e2e8f0",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, (completed.length / cert.threshold) * 100)}%`,
                                background:
                                  "linear-gradient(90deg, #4f46e5, #7c3aed)",
                                borderRadius: "99px",
                                transition: "width 0.8s ease",
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {cert.unlocked ? (
                        <button
                          onClick={() => {
                            setGeneratingCert(cert.id);
                            setTimeout(() => {
                              generateCertificate(
                                childName,
                                childAge,
                                completed.length,
                                childLevel
                              );
                              setGeneratingCert(null);
                            }, 400);
                          }}
                          disabled={generatingCert === cert.id}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "14px",
                            border: "none",
                            background: cert.bg,
                            color: "#ffffff",
                            fontWeight: "900",
                            fontSize: "0.95rem",
                            cursor:
                              generatingCert === cert.id
                                ? "not-allowed"
                                : "pointer",
                            boxShadow: `0 4px 14px ${cert.color}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          {generatingCert === cert.id ? (
                            <>⏳ Generating PDF...</>
                          ) : (
                            <>📄 Download Certificate PDF</>
                          )}
                        </button>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "0.84rem",
                            color: "#94a3b8",
                            fontWeight: "700",
                            padding: "10px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                          }}
                        >
                          🔒 Complete {cert.threshold - completed.length} more
                          {cert.threshold - completed.length === 1
                            ? " activity"
                            : " activities"}{" "}
                          to unlock
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Certificate Note */}
              <div
                style={{
                  marginTop: "28px",
                  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                  border: "1.5px solid #7dd3fc",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div style={{ fontSize: "2.5rem" }}>💡</div>
                <div>
                  <div
                    style={{
                      fontWeight: "900",
                      fontSize: "1rem",
                      color: "#0369a1",
                      marginBottom: "4px",
                    }}
                  >
                    Print & Frame Your Certificates!
                  </div>
                  <div style={{ color: "#0369a1", fontSize: "0.88rem" }}>
                    Download the PDF, print it out, and hang it on {childName}'s
                    wall as a proud reminder of their achievements. Each
                    certificate is personalized with their name and date! 🖼️
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
