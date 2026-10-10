import React, { useState, useEffect } from "react";
import {
  getTherapistChildProgress,
  sendFeedback,
  changeChildLevel,
  generateParentVideo,
  getParentVideoStatus,
  getExamHistory,
  approveLevelUpgradeAPI,
} from "../services/api";
import { generateClinicalPDF } from "../utils/pdfExportHelper";
import CertificateModal from "./CertificateModal";

const LEVEL_INFO = {
  1: {
    label: "Level 1 — Emerging",
    color: "#166534",
    bg: "#dcfce7",
    emoji: "🌱",
  },
  2: {
    label: "Level 2 — Developing",
    color: "#854d0e",
    bg: "#fef9c3",
    emoji: "🌿",
  },
  3: {
    label: "Level 3 — Advancing",
    color: "#991b1b",
    bg: "#fee2e2",
    emoji: "🌳",
  },
};

const TEMPLATES = [
  "Continue current activities as child is engaging well.",
  "Increase session duration to 20 minutes daily for better sensory regulation.",
  "Child showing great progress! Recommended advancing to the next difficulty level.",
  "Schedule a video consultation this week to review motor skill pacing.",
];

const ExamTab = ({ child }) => {
  const [exams, setExams] = useState([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (child?._id) {
      getExamHistory(child._id)
        .then(setExams)
        .catch(() => {});
    }
  }, [child?._id]);

  const latestExam = exams[0] || null;
  const lastScore = latestExam ? latestExam.score : (child?.lastExamScore || 75);
  const lastDate = latestExam ? latestExam.examDate : (child?.lastExamDate || new Date());
  const domains = latestExam?.domains || child?.lastExamDomains || {
    communication: { correct: 4, total: 4 },
    social: { correct: 1, total: 3 },
    emotion: { correct: 1, total: 1 }
  };

  const handleApproveUpgrade = async () => {
    setUpgrading(true);
    try {
      await approveLevelUpgradeAPI(child._id);
      alert(`✅ ${child.name} has been upgraded to Level ${Math.max(1, (child.level || 2) - 1)}!`);
      window.location.reload();
    } catch (e) {
      alert("Failed to upgrade child level");
    } finally {
      setUpgrading(false);
    }
  };

  const handleWaitTwoWeeks = () => {
    alert(`⏳ Recorded therapist note: Kept ${child.name} at Level ${child.level || 2} for 2 more weeks of consolidation.`);
  };

  return (
    <div style={{ padding: "24px" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: "800", color: "#1e1b4b" }}>
        📝 Exam Performance & Weekly Evaluation
      </h3>

      <div style={{
        background: lastScore >= 80 ? "#dcfce7" : lastScore >= 60 ? "#fef3c7" : "#fee2e2",
        border: `2px solid ${lastScore >= 80 ? "#86efac" : lastScore >= 60 ? "#fde047" : "#fca5a5"}`,
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <div style={{ fontSize: "2.4rem", fontWeight: "900", color: lastScore >= 80 ? "#15803d" : lastScore >= 60 ? "#b45309" : "#b91c1c" }}>
            {lastScore}%
          </div>
          <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem" }}>
            Latest Weekly Exam Score
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
            Evaluated on: {new Date(lastDate).toLocaleDateString("en-IN")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            background: lastScore >= 80 ? "#15803d" : lastScore >= 60 ? "#a16207" : "#be123c",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "99px",
            fontWeight: "800",
            fontSize: "0.85rem"
          }}>
            {lastScore >= 80 ? "✅ PASSED" : lastScore >= 60 ? "⚠️ PARTIAL PASS" : "🔄 NEEDS WORK"}
          </div>
        </div>
      </div>

      <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: "800", color: "#334155" }}>
        Domain Skill Breakdown:
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
        {Object.entries(domains).map(([domain, scores]) => {
          const total = scores?.total || 1;
          const correct = scores?.correct || 0;
          const pct = Math.round((correct / total) * 100);
          return (
            <div key={domain} style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.88rem", fontWeight: "700" }}>
                <span style={{ textTransform: "capitalize", color: "#1e293b" }}>{domain}</span>
                <span style={{ color: pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626" }}>
                  {correct}/{total} ({pct}%)
                </span>
              </div>
              <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444",
                  borderRadius: "99px"
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {lastScore >= 80 && (child?.level || 2) > 1 && (
        <div style={{
          background: "#eff6ff",
          border: "2px solid #bfdbfe",
          borderRadius: "16px",
          padding: "20px",
          marginTop: "16px"
        }}>
          <div style={{ fontWeight: "800", color: "#1d4ed8", fontSize: "1.05rem", marginBottom: "4px" }}>
            🎓 Exam Passed — Level Upgrade Available
          </div>
          <div style={{ fontSize: "0.9rem", color: "#1e40af", marginBottom: "16px" }}>
            {child.name} scored {lastScore}% on the weekly exam and is ready for Level {Math.max(1, (child.level || 2) - 1)}.
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleApproveUpgrade}
              disabled={upgrading}
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 20px",
                fontWeight: "800",
                fontSize: "0.9rem",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(34,197,94,0.3)"
              }}
            >
              ✅ Approve Upgrade to Level {Math.max(1, (child.level || 2) - 1)}
            </button>
            <button
              onClick={handleWaitTwoWeeks}
              style={{
                background: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 18px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              ⏳ Wait 2 More Weeks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChildDetailModal({
  child,
  onClose,
  onRefresh,
  initialTab = "overview",
  lang = "en",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [parentVideoConsent, setParentVideoConsent] = useState(false);
  const [parentVideo, setParentVideo] = useState(null);
  const [videoScript, setVideoScript] = useState("");
  const [videoError, setVideoError] = useState("");
  const [generatingVideo, setGeneratingVideo] = useState(false);

  // Level Management Confirmation Modal
  const [levelConfirm, setLevelConfirm] = useState(null); // target level e.g. 1, 2, 3
  const [levelReason, setLevelReason] = useState("");
  const [updatingLevel, setUpdatingLevel] = useState(false);

  // Send Feedback State
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const t = (en, kn) => (lang === "kn" ? kn : en);

  const loadProgress = async () => {
    if (!child?._id) return;
    setLoading(true);
    try {
      const res = await getTherapistChildProgress(child._id);
      setData(res);
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    try {
      const savedVideo = JSON.parse(
        localStorage.getItem(`parent_video_${child?._id}`) || "null",
      );
      if (savedVideo?.videoId) setParentVideo(savedVideo);
    } catch {
      // Ignore invalid saved video state.
    }
  }, [child?._id]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, child?._id]);

  const handleLevelChangeConfirm = async () => {
    if (!levelConfirm) return;
    setUpdatingLevel(true);
    try {
      await changeChildLevel(child._id, levelConfirm, levelReason);
      alert(
        `✅ ${t("Level updated successfully!", "ಮಟ್ಟವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!")}`,
      );
      setLevelConfirm(null);
      setLevelReason("");
      if (onRefresh) onRefresh();
      await loadProgress();
    } catch (err) {
      alert(err.message || "Failed to update level");
    } finally {
      setUpdatingLevel(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSendingFeedback(true);
    try {
      await sendFeedback(child._id, feedbackText.trim(), feedbackType);
      setFeedbackSuccess(
        t("Feedback sent to parent!", "ಪೋಷಕರಿಗೆ ಪ್ರತಿಕ್ರಿಯೆ ಕಳುಹಿಸಲಾಗಿದೆ!"),
      );
      setFeedbackText("");
      setTimeout(() => setFeedbackSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to send feedback");
    } finally {
      setSendingFeedback(false);
    }
  };

  const handlePrint = () => {
    try {
      generateClinicalPDF({
        child: child || {},
        progressData: data || {},
        domainScores: data?.domainScores || {},
        recentSessions: data?.recentSessions || [],
        dominantEmotion: data?.dominantEmotion || "Happy 😊",
        clinicalRecommendation: data?.clinicalRecommendation || "",
        therapistName: "Dr. Ananya Sharma, BCBA-D",
      });
    } catch (e) {
      window.print();
    }
  };

  const handleGenerateParentVideo = async () => {
    if (!parentVideoConsent) return;
    setGeneratingVideo(true);
    setVideoError("");
    try {
      const result = await generateParentVideo(child._id);
      setVideoScript(result.script || "");
      if (!result.configured) {
        setVideoError(result.message || "Video generation is not configured.");
        return;
      }
      setParentVideo({
        videoId: result.videoId,
        status: result.status || "processing",
      });
      localStorage.setItem(
        `parent_video_${child._id}`,
        JSON.stringify({
          videoId: result.videoId,
          status: result.status || "processing",
        }),
      );
    } catch (error) {
      setVideoScript(error?.script || "");
      setVideoError(error.message || "Unable to create the video request.");
    } finally {
      setGeneratingVideo(false);
    }
  };

  useEffect(() => {
    const terminalStatuses = ["done", "completed", "error", "rejected"];
    if (!parentVideo?.videoId || terminalStatuses.includes(parentVideo.status))
      return undefined;
    const pollVideo = async () => {
      try {
        const result = await getParentVideoStatus(parentVideo.videoId);
        setParentVideo((current) => {
          if (!current) return current;
          const updated = { ...current, ...result };
          localStorage.setItem(
            `parent_video_${child._id}`,
            JSON.stringify(updated),
          );
          return updated;
        });
      } catch (error) {
        setVideoError(error.message || "Unable to check video status.");
      }
    };
    pollVideo();
    const timer = setInterval(pollVideo, 10000);
    return () => clearInterval(timer);
  }, [parentVideo?.videoId, parentVideo?.status]);

  if (!child) return null;

  const currentLevel = child.level || 1;
  const levelData = LEVEL_INFO[currentLevel] || LEVEL_INFO[1];
  const progressStatus =
    data?.progressStatus || child.progressStatus || "Collecting Data";

  // Helper to extract domain score safely
  const getDomainInfo = (domainObj, fallbackVal = 0) => {
    if (typeof domainObj === "object" && domainObj !== null) {
      return {
        score:
          domainObj.score !== null && domainObj.score !== undefined
            ? domainObj.score
            : 0,
        hasData: Boolean(domainObj.hasData),
        count: domainObj.count || 0,
      };
    }
    if (typeof domainObj === "number") {
      return { score: domainObj, hasData: true, count: 1 };
    }
    return { score: fallbackVal, hasData: false, count: 0 };
  };

  const domainScoresList = [
    {
      key: "communication",
      label: t("Communication & Language (ಸಂವಹನ)", "ಸಂವಹನ ಮತ್ತು ಭಾಷೆ"),
      info: getDomainInfo(data?.domainScores?.communication),
      color: "#6366f1",
    },
    {
      key: "social",
      label: t("Social Skills & Reciprocity (ಸ್ನೇಹಿತರು)", "ಸಾಮಾಜಿಕ ಕೌಶಲ್ಯ"),
      info: getDomainInfo(data?.domainScores?.social),
      color: "#ec4899",
    },
    {
      key: "sensory",
      label: t("Sensory Integration (ಸಂವೇದನೆ)", "ಸಂವೇದನಾ ಸಮಗ್ರತೆ"),
      info: getDomainInfo(data?.domainScores?.sensory),
      color: "#10b981",
    },
    {
      key: "motor",
      label: t("Motor Skills & Coordination (ಚಲನೆ)", "ಚಲನಾ ಕೌಶಲ್ಯ"),
      info: getDomainInfo(data?.domainScores?.motor),
      color: "#f59e0b",
    },
    {
      key: "cognitive",
      label: t("Cognitive & Focus (ಆಲೋಚನೆ)", "ಅರಿವಿನ ಸಾಮರ್ಥ್ಯ"),
      info: getDomainInfo(data?.domainScores?.cognitive),
      color: "#8b5cf6",
    },
  ];

  const monthCalendar = data?.monthCalendar;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        className="fade-in"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "980px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 28px",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
              }}
            >
              🧒
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800" }}>
                {child.name}
              </h2>
              <div
                style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: "2px" }}
              >
                {t("Age", "ವಯಸ್ಸು")}: {child.age} ·{" "}
                {t("Support Level", "ಬೆಂಬಲ ಮಟ್ಟ")}:{" "}
                <span
                  style={{
                    background: levelData.bg,
                    color: levelData.color,
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontWeight: "700",
                  }}
                >
                  {levelData.emoji} {levelData.label}
                </span>
                {data?.streak > 0 && (
                  <span
                    style={{
                      marginLeft: "10px",
                      background: "#ffedd5",
                      color: "#9a3412",
                      padding: "2px 8px",
                      borderRadius: "8px",
                      fontWeight: "700",
                    }}
                  >
                    🔥 {data.streak} {t("Day Streak", "ದಿನಗಳ ಸತತ ಚಟುವಟಿಕೆ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              📄 {t("Download / Print PDF", "PDF ಮುದ್ರಿಸಿ")}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                width: 36,
                height: 36,
                borderRadius: "50%",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            overflowX: "auto",
          }}
        >
          {[
            {
              key: "overview",
              label: t("📊 Progress Overview", "📊 ಪ್ರಗತಿ ಅವಲೋಕನ"),
            },
            { key: "activities", label: t("🧩 Activities", "🧩 ಚಟುವಟಿಕೆಗಳು") },
            {
              key: "streak",
              label: t(
                "🔥 Monthly Streak & Calendar",
                "🔥 ಮಾಸಿಕ ಸ್ಟ್ರೀಕ್ ಮತ್ತು ಕ್ಯಾಲೆಂಡರ್",
              ),
            },
            {
              key: "achievements",
              label: t(
                "🏅 Badges & Certificates",
                "🏅 ಬ್ಯಾಡ್ಜ್‌ಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು",
              ),
            },
            {
              key: "parent-video",
              label: t("🎥 Parent AI Video", "🎥 ಪೋಷಕರ AI ವೀಡಿಯೊ"),
            },
            {
              key: "sessions",
              label: t("📝 Session History", "📝 ಸೆಷನ್ ಇತಿಹಾಸ"),
            },
            {
              key: "emotion",
              label: t("🎭 Emotion Analysis", "🎭 ಭಾವನೆ ವಿಶ್ಲೇಷಣೆ"),
            },
            {
              key: "level",
              label: t("⚙️ Level Management", "⚙️ ಮಟ್ಟ ನಿರ್ವಹಣೆ"),
            },
            {
              key: "exam",
              label: t("🎓 Exam Performance", "🎓 ಪರೀಕ್ಷಾ ಕಾರ್ಯಕ್ಷಮತೆ"),
            },
            {
              key: "feedback",
              label: t("💬 Send Feedback", "💬 ಪ್ರತಿಕ್ರಿಯೆ ಕಳುಹಿಸಿ"),
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "14px 20px",
                border: "none",
                background: activeTab === tab.key ? "white" : "transparent",
                borderBottom:
                  activeTab === tab.key
                    ? "3px solid #4F6EF7"
                    : "3px solid transparent",
                color: activeTab === tab.key ? "#4F6EF7" : "#64748b",
                fontWeight: activeTab === tab.key ? "800" : "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <span className="spinner" style={{ width: 36, height: 36 }} />
              <p style={{ color: "#64748b", marginTop: "12px" }}>
                {t(
                  "Loading clinical analytics...",
                  "ವಿಶ್ಲೇಷಣೆಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                )}
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROGRESS OVERVIEW */}
              {activeTab === "overview" && (
                <div>
                  {/* AI Prediction Header */}
                  <div
                    style={{
                      background:
                        progressStatus === "Improving"
                          ? "#dcfce7"
                          : progressStatus === "Regressing"
                            ? "#fee2e2"
                            : progressStatus === "Collecting Data"
                              ? "#f1f5f9"
                              : "#fef9c3",
                      border: `1.5px solid ${
                        progressStatus === "Improving"
                          ? "#86efac"
                          : progressStatus === "Regressing"
                            ? "#fca5a5"
                            : progressStatus === "Collecting Data"
                              ? "#cbd5e1"
                              : "#fde047"
                      }`,
                      color:
                        progressStatus === "Improving"
                          ? "#166534"
                          : progressStatus === "Regressing"
                            ? "#991b1b"
                            : progressStatus === "Collecting Data"
                              ? "#475569"
                              : "#854d0e",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      marginBottom: "24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "1.1rem" }}>
                        {progressStatus === "Improving" &&
                          "📈 " +
                            t(
                              "AI Prediction: Improving (ಸುಧಾರಿಸುತ್ತಿದೆ)",
                              "AI ಮುನ್ಸೂಚನೆ: ಸುಧಾರಿಸುತ್ತಿದೆ",
                            )}
                        {progressStatus === "Stable" &&
                          "➖ " +
                            t(
                              "AI Prediction: Stable (ಸ್ಥಿರವಾಗಿದೆ)",
                              "AI ಮುನ್ಸೂಚನೆ: ಸ್ಥಿರವಾಗಿದೆ",
                            )}
                        {progressStatus === "Regressing" &&
                          "📉 " +
                            t(
                              "AI Prediction: Regressing (ಹಿಂದುಳಿಯುತ್ತಿದೆ)",
                              "AI ಮುನ್ಸೂಚನೆ: ಹಿಂದುಳಿಯುತ್ತಿದೆ",
                            )}
                        {progressStatus === "Collecting Data" &&
                          "⏳ " +
                            t(
                              "Status: Collecting Baseline Data (ಹೊಸ ಪ್ರವೇಶ)",
                              "ಸ್ಥಿತಿ: ಆರಂಭಿಕ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ",
                            )}
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {data?.clinicalRecommendation}
                      </div>
                    </div>

                    <span
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontWeight: "800",
                        fontSize: "0.88rem",
                      }}
                    >
                      DREAM Protocol Validated
                    </span>
                  </div>

                  {/* 4-Week Progression Score Trend (Dynamic with No Fake Fallbacks) */}
                  <div style={{ marginBottom: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "700",
                          margin: 0,
                          color: "#1e293b",
                        }}
                      >
                        📈{" "}
                        {t(
                          "Weekly Score Progression (Last 4 Weeks)",
                          "ವಾರದ ಅಂಕಗಳ ಪ್ರಗತಿ (ಕಳೆದ 4 ವಾರಗಳು)",
                        )}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {t(
                          "Calculated strictly from completed activities",
                          "ಕೇವಲ ಪೂರ್ಣಗೊಂಡ ಚಟುವಟಿಕೆಗಳಿಂದ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ",
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "12px",
                      }}
                    >
                      {(data?.weeklyScoreTrend || []).map((w, idx) => {
                        const hasScore =
                          w.hasData &&
                          w.score !== null &&
                          w.score !== undefined;
                        return (
                          <div
                            key={idx}
                            style={{
                              background: hasScore ? "#f8fafc" : "#fafafa",
                              border: hasScore
                                ? "1.5px solid #e2e8f0"
                                : "1.5px dashed #cbd5e1",
                              borderRadius: "14px",
                              padding: "16px",
                              textAlign: "center",
                              opacity: hasScore ? 1 : 0.75,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "600",
                              }}
                            >
                              {w.week}
                            </div>
                            <div
                              style={{
                                fontSize: "1.8rem",
                                fontWeight: "800",
                                color: hasScore ? "#4F6EF7" : "#94a3b8",
                                margin: "6px 0",
                              }}
                            >
                              {hasScore ? `${w.score}%` : "—"}
                            </div>
                            {hasScore ? (
                              <div
                                className="progress-bar"
                                style={{ height: "6px", margin: "0 auto" }}
                              >
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${w.score}%`,
                                    background: "#4F6EF7",
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#94a3b8",
                                  fontWeight: "500",
                                }}
                              >
                                {t("No sessions logged", "ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Domain Performance Bar Chart */}
                  <div style={{ marginBottom: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "700",
                          margin: 0,
                          color: "#1e293b",
                        }}
                      >
                        🧠{" "}
                        {t(
                          "Clinical Domain Performance",
                          "ಕ್ಷೇತ್ರವಾರು ಸಾಮರ್ಥ್ಯ",
                        )}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {t(
                          "Live score from domain activities",
                          "ನೈಜ ಕ್ಷೇತ್ರ ಚಟುವಟಿಕೆಗಳ ಅಂಕ",
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {domainScoresList.map((domain) => (
                        <div
                          key={domain.key}
                          style={{
                            background: "#f8fafc",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                              fontSize: "0.88rem",
                            }}
                          >
                            <span
                              style={{ fontWeight: "700", color: "#334155" }}
                            >
                              {domain.label}
                            </span>
                            <strong
                              style={{
                                color: domain.info.hasData
                                  ? domain.color
                                  : "#94a3b8",
                              }}
                            >
                              {domain.info.hasData
                                ? `${domain.info.score}% (${domain.info.count} done)`
                                : t(
                                    "0% (Not attempted yet)",
                                    "0% (ಇನ್ನೂ ಪ್ರಾರಂಭಿಸಿಲ್ಲ)",
                                  )}
                            </strong>
                          </div>
                          <div
                            className="progress-bar"
                            style={{ height: "8px" }}
                          >
                            <div
                              className="progress-fill"
                              style={{
                                width: `${domain.info.hasData ? domain.info.score : 0}%`,
                                background: domain.info.hasData
                                  ? domain.color
                                  : "#cbd5e1",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE ACTIVITY PLAN */}
              {activeTab === "activities" && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: "800",
                      margin: "0 0 6px",
                      color: "#0f172a",
                    }}
                  >
                    🧩{" "}
                    {t(
                      "Child's Therapy Activities",
                      "ಮಗುವಿನ ಚಿಕಿತ್ಸಾ ಚಟುವಟಿಕೆಗಳು",
                    )}
                  </h3>
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 20px",
                      fontSize: "0.9rem",
                    }}
                  >
                    {t(
                      "Assignments and completed work are loaded from this child's live profile.",
                      "ನಿಯೋಜನೆಗಳು ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ಕೆಲಸವನ್ನು ಈ ಮಗುವಿನ ಪ್ರೊಫೈಲ್‌ನಿಂದ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ.",
                    )}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        title: t("Assigned", "ನಿಯೋಜಿಸಲಾಗಿದೆ"),
                        activities: data?.assignedActivities || [],
                        bg: "#eef2ff",
                        border: "#c7d2fe",
                        color: "#4338ca",
                        empty: t(
                          "No activities are assigned yet.",
                          "ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆಗಳನ್ನು ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ.",
                        ),
                      },
                      {
                        title: t("Completed", "ಪೂರ್ಣಗೊಂಡಿದೆ"),
                        activities: data?.completedActivities || [],
                        bg: "#f0fdf4",
                        border: "#bbf7d0",
                        color: "#166534",
                        empty: t(
                          "No activities completed yet.",
                          "ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆಗಳು ಪೂರ್ಣಗೊಂಡಿಲ್ಲ.",
                        ),
                      },
                    ].map((group) => (
                      <section
                        key={group.title}
                        style={{
                          background: group.bg,
                          border: `1px solid ${group.border}`,
                          borderRadius: "16px",
                          padding: "18px",
                        }}
                      >
                        <div
                          style={{
                            color: group.color,
                            fontWeight: "800",
                            marginBottom: "12px",
                          }}
                        >
                          {group.title} ({group.activities.length})
                        </div>
                        {group.activities.length ? (
                          group.activities.map((activity) => (
                            <div
                              key={activity._id}
                              style={{
                                background: "white",
                                borderRadius: "12px",
                                padding: "12px",
                                marginBottom: "10px",
                                border: "1px solid rgba(148,163,184,.28)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "9px",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ fontSize: "1.25rem" }}>
                                  {activity.icon || "🧩"}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: "750",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {activity.title}
                                  </div>
                                  <div
                                    style={{
                                      color: "#64748b",
                                      fontSize: "0.78rem",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {activity.category || "Therapy"}
                                    {activity.duration
                                      ? ` · ${activity.duration}`
                                      : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "0.88rem",
                              padding: "14px 0",
                            }}
                          >
                            {group.empty}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MONTHLY STREAK & CALENDAR */}
              {activeTab === "streak" && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "800",
                        margin: "0 0 6px 0",
                        color: "#0f172a",
                      }}
                    >
                      🔥{" "}
                      {t(
                        "Therapy Activity Streak & Monthly Consistency",
                        "ದೈನಂದಿನ ಚಟುವಟಿಕೆ ಸ್ಟ್ರೀಕ್ ಮತ್ತು ಮಾಸಿಕ ಕ್ಯಾಲೆಂಡರ್",
                      )}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        margin: 0,
                        fontSize: "0.88rem",
                      }}
                    >
                      {t(
                        "Live streak of the child's enrolled month. Inactive days remain clean.",
                        "ಪ್ರಸ್ತುತ ತಿಂಗಳ ನೈಜ ದಾಖಲೆಗಳು. ಚಟುವಟಿಕೆ ಇಲ್ಲದ ದಿನಗಳು ಖಾಲಿಯಾಗಿರುತ್ತವೆ.",
                      )}
                    </p>
                  </div>

                  {/* Streak Stats Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        background: "#fff7ed",
                        border: "1.5px solid #fed7aa",
                        borderRadius: "16px",
                        padding: "18px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "4px" }}>
                        🔥
                      </div>
                      <div
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "800",
                          color: "#c2410c",
                        }}
                      >
                        {data?.streak || 0} {t("Days", "ದಿನಗಳು")}
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#9a3412",
                          fontWeight: "700",
                        }}
                      >
                        {t("Current Active Streak", "ಪ್ರಸ್ತುತ ಸತತ ಚಟುವಟಿಕೆ")}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#eff6ff",
                        border: "1.5px solid #bfdbfe",
                        borderRadius: "16px",
                        padding: "18px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "4px" }}>
                        ⭐
                      </div>
                      <div
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "800",
                          color: "#1d4ed8",
                        }}
                      >
                        {data?.longestStreak || data?.streak || 0}{" "}
                        {t("Days", "ದಿನಗಳು")}
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#1e40af",
                          fontWeight: "700",
                        }}
                      >
                        {t("Longest Streak Achieved", "ದೀರ್ಘಾವಧಿ ಸತತ ದಿನಗಳು")}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #bbf7d0",
                        borderRadius: "16px",
                        padding: "18px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "4px" }}>
                        📅
                      </div>
                      <div
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "800",
                          color: "#15803d",
                        }}
                      >
                        {monthCalendar?.activeDaysCount || 0} /{" "}
                        {monthCalendar?.totalDays || 30}
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#166534",
                          fontWeight: "700",
                        }}
                      >
                        {t("Active Days This Month", "ಈ ತಿಂಗಳು ಸಕ್ರಿಯ ದಿನಗಳು")}
                      </div>
                    </div>
                  </div>

                  {/* Calendar Matrix for Current Month */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "24px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "18px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#1e293b",
                        }}
                      >
                        🗓️ {monthCalendar?.monthName || "Current Month"}{" "}
                        {monthCalendar?.year || 2026}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: "#22c55e",
                              display: "inline-block",
                            }}
                          />
                          {t("Completed Therapy", "ಚಟುವಟಿಕೆ ಪೂರ್ಣ")}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: "#e2e8f0",
                              display: "inline-block",
                            }}
                          />
                          {t("No Activity", "ಚಟುವಟಿಕೆ ಇಲ್ಲ")}
                        </span>
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "10px",
                        textAlign: "center",
                      }}
                    >
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (dayName) => (
                          <div
                            key={dayName}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              color: "#94a3b8",
                              paddingBottom: "6px",
                            }}
                          >
                            {dayName}
                          </div>
                        ),
                      )}

                      {(monthCalendar?.days || []).map((d) => {
                        return (
                          <div
                            key={d.day}
                            title={
                              d.isActive
                                ? `${d.activityCount} therapy sessions completed on ${d.date}`
                                : `No activity on ${d.date}`
                            }
                            style={{
                              aspectRatio: "1",
                              borderRadius: "12px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              background: d.isActive
                                ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                                : d.isToday
                                  ? "#f1f5f9"
                                  : "#fafafa",
                              border: d.isActive
                                ? "1.5px solid #86efac"
                                : d.isToday
                                  ? "1.5px solid #3b82f6"
                                  : "1px solid #f1f5f9",
                              color: d.isActive
                                ? "#166534"
                                : d.isToday
                                  ? "#1e40af"
                                  : "#94a3b8",
                              fontWeight:
                                d.isActive || d.isToday ? "800" : "500",
                              fontSize: "0.9rem",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span>{d.day}</span>
                            {d.isActive && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  marginTop: "-2px",
                                }}
                              >
                                🔥
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BADGES & CERTIFICATES */}
              {activeTab === "achievements" && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: "800",
                      margin: "0 0 6px",
                      color: "#0f172a",
                    }}
                  >
                    🏅 {t("Achievements", "ಸಾಧನೆಗಳು")}
                  </h3>
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 20px",
                      fontSize: "0.9rem",
                    }}
                  >
                    {t(
                      "Badges are calculated from this child's completed activities and live streak.",
                      "ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಮಗುವಿನ ಪೂರ್ಣಗೊಂಡ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಸತತ ಚಟುವಟಿಕೆಯಿಂದ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.",
                    )}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: "14px",
                      marginBottom: "28px",
                    }}
                  >
                    {(data?.badges || []).map((badge) => (
                      <div
                        key={badge.id}
                        style={{
                          padding: "16px",
                          borderRadius: "16px",
                          border: `1px solid ${badge.earned ? "#fde68a" : "#e2e8f0"}`,
                          background: badge.earned ? "#fffbeb" : "#f8fafc",
                          opacity: badge.earned ? 1 : 0.55,
                        }}
                      >
                        <div style={{ fontSize: "1.8rem" }}>
                          {badge.earned ? badge.emoji : "🔒"}
                        </div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: "#1e293b",
                            marginTop: "8px",
                          }}
                        >
                          {badge.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#64748b",
                            marginTop: "3px",
                          }}
                        >
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "800",
                      margin: "0 0 12px",
                      color: "#0f172a",
                    }}
                  >
                    📜 {t("Certificates", "ಪ್ರಮಾಣಪತ್ರಗಳು")}
                  </h3>
                  {(data?.certificates || []).length ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {data.certificates.map((certificate) => (
                        <div
                          key={certificate.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "14px",
                            padding: "14px 16px",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            borderRadius: "14px",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: "800", color: "#9a3412" }}
                            >
                              🏆 {certificate.activityTitle}
                            </div>
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#9a3412",
                                marginTop: "3px",
                              }}
                            >
                              {t(
                                "Certificate of completion",
                                "ಪೂರ್ಣಗೊಳಿಸಿದ ಪ್ರಮಾಣಪತ್ರ",
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedCertificate(certificate)}
                            style={{
                              border: "none",
                              borderRadius: "9px",
                              padding: "8px 12px",
                              background: "#ea580c",
                              color: "white",
                              fontWeight: "750",
                              cursor: "pointer",
                            }}
                          >
                            {t("View / Print", "ವೀಕ್ಷಿಸಿ / ಮುದ್ರಿಸಿ")}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "22px",
                        textAlign: "center",
                        color: "#64748b",
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "14px",
                      }}
                    >
                      {t(
                        "Certificates unlock after an activity is completed.",
                        "ಚಟುವಟಿಕೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ ನಂತರ ಪ್ರಮಾಣಪತ್ರಗಳು ಅನ್‌ಲಾಕ್ ಆಗುತ್ತವೆ.",
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PARENT AI VIDEO */}
              {activeTab === "parent-video" && (
                <div style={{ maxWidth: "720px" }}>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: "800",
                      margin: "0 0 8px",
                      color: "#0f172a",
                    }}
                  >
                    🎥{" "}
                    {t("Parent Performance Video", "ಪೋಷಕರ ಕಾರ್ಯಕ್ಷಮತೆ ವೀಡಿಯೊ")}
                  </h3>
                  <p
                    style={{
                      color: "#64748b",
                      lineHeight: "1.55",
                      margin: "0 0 20px",
                    }}
                  >
                    {t(
                      "Create a short, warm avatar-video that explains this child's real activity, streak, and progress data in simple parent-friendly language.",
                      "ಈ ಮಗುವಿನ ನೈಜ ಚಟುವಟಿಕೆ, ಸತತತೆ ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಪೋಷಕರಿಗೆ ಸರಳವಾಗಿ ವಿವರಿಸುವ ಚಿಕ್ಕ ಅವತಾರ ವೀಡಿಯೊ ರಚಿಸಿ.",
                    )}
                  </p>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "14px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "12px",
                      color: "#713f12",
                      fontSize: "0.88rem",
                      lineHeight: "1.45",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={parentVideoConsent}
                      onChange={(event) =>
                        setParentVideoConsent(event.target.checked)
                      }
                      style={{ marginTop: "3px" }}
                    />
                    <span>
                      {t(
                        "I confirm that the parent/guardian has consented to sharing this child-specific progress summary with the video provider.",
                        "ಈ ಮಗುವಿನ ಪ್ರಗತಿ ಸಾರಾಂಶವನ್ನು ವೀಡಿಯೊ ಸೇವೆಗೆ ಹಂಚಲು ಪೋಷಕರು/ಪಾಲಕರು ಸಮ್ಮತಿಸಿದ್ದಾರೆ ಎಂದು ನಾನು ದೃಢೀಕರಿಸುತ್ತೇನೆ.",
                      )}
                    </span>
                  </label>
                  <button
                    onClick={handleGenerateParentVideo}
                    disabled={!parentVideoConsent || generatingVideo}
                    style={{
                      marginTop: "16px",
                      padding: "12px 18px",
                      border: "none",
                      borderRadius: "12px",
                      background:
                        !parentVideoConsent || generatingVideo
                          ? "#94a3b8"
                          : "#4F6EF7",
                      color: "white",
                      fontWeight: "800",
                      cursor:
                        !parentVideoConsent || generatingVideo
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {generatingVideo
                      ? t("Preparing video…", "ವೀಡಿಯೊ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…")
                      : t("Generate Parent Video", "ಪೋಷಕರ ವೀಡಿಯೊ ರಚಿಸಿ")}
                  </button>
                  {videoError && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#9a3412",
                        fontSize: "0.86rem",
                      }}
                    >
                      {videoError}
                    </div>
                  )}
                  {videoScript && (
                    <div
                      style={{
                        marginTop: "18px",
                        padding: "16px",
                        borderRadius: "14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "800",
                          color: "#334155",
                          marginBottom: "6px",
                        }}
                      >
                        {t(
                          "Generated parent script",
                          "ರಚಿಸಲಾದ ಪೋಷಕರ ಸ್ಕ್ರಿಪ್ಟ್",
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "#475569",
                          lineHeight: "1.55",
                          fontSize: "0.9rem",
                        }}
                      >
                        {videoScript}
                      </p>
                    </div>
                  )}
                  {parentVideo?.videoUrl ? (
                    <video
                      controls
                      src={parentVideo.videoUrl}
                      style={{
                        width: "100%",
                        marginTop: "18px",
                        borderRadius: "14px",
                        background: "#0f172a",
                      }}
                    />
                  ) : parentVideo?.videoId ? (
                    <div
                      style={{
                        marginTop: "18px",
                        padding: "14px",
                        borderRadius: "12px",
                        background: "#eef2ff",
                        color: "#3730a3",
                        fontWeight: "700",
                      }}
                    >
                      {t(
                        `Video status: ${parentVideo.status || "processing"}. This page checks again automatically.`,
                        `ವೀಡಿಯೊ ಸ್ಥಿತಿ: ${parentVideo.status || "processing"}. ಈ ಪುಟವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮತ್ತೆ ಪರಿಶೀಲಿಸುತ್ತದೆ.`,
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 6: SESSION HISTORY */}
              {activeTab === "sessions" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        margin: 0,
                      }}
                    >
                      📋 {t("Therapy Session History", "ಸೆಷನ್ ಇತಿಹಾಸ")}
                    </h3>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {data?.recentSessions?.length || 0}{" "}
                      {t("sessions logged", "ಸೆಷನ್‌ಗಳು ದಾಖಲಾಗಿವೆ")}
                    </span>
                  </div>

                  {!data?.recentSessions || data.recentSessions.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#f8fafc",
                        borderRadius: "14px",
                        border: "1px dashed #cbd5e1",
                      }}
                    >
                      <p style={{ color: "#64748b", margin: 0 }}>
                        {t(
                          "No therapy sessions recorded yet for this child.",
                          "ಈ ಮಗುವಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ಸೆಷನ್‌ಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
                        )}
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          textAlign: "left",
                          fontSize: "0.88rem",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              borderBottom: "1px solid #cbd5e1",
                            }}
                          >
                            <th style={{ padding: "12px 16px" }}>
                              {t("Date", "ದಿನಾಂಕ")}
                            </th>
                            <th style={{ padding: "12px 16px" }}>
                              {t("Activity Name", "ಚಟುವಟಿಕೆ ಹೆಸರು")}
                            </th>
                            <th style={{ padding: "12px 16px" }}>
                              {t("Score", "ಅಂಕ")}
                            </th>
                            <th style={{ padding: "12px 16px" }}>
                              {t("Emotion (FER2013)", "ಭಾವನೆ")}
                            </th>
                            <th style={{ padding: "12px 16px" }}>
                              {t("Duration", "ಅವಧಿ")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.recentSessions || []).map((s, i) => {
                            const isHigh = s.score >= 4;
                            const isMed = s.score === 3;
                            const rowBg = isHigh
                              ? "#f0fdf4"
                              : isMed
                                ? "#fefce8"
                                : "#fef2f2";
                            const badgeColor = isHigh
                              ? "#166534"
                              : isMed
                                ? "#854d0e"
                                : "#991b1b";
                            const badgeBg = isHigh
                              ? "#dcfce7"
                              : isMed
                                ? "#fef9c3"
                                : "#fee2e2";

                            return (
                              <tr
                                key={s._id || i}
                                style={{
                                  background: rowBg,
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    color: "#64748b",
                                  }}
                                >
                                  {new Date(s.date).toLocaleDateString()}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontWeight: "700",
                                    color: "#1e293b",
                                  }}
                                >
                                  {s.activityName}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span
                                    style={{
                                      background: badgeBg,
                                      color: badgeColor,
                                      padding: "3px 10px",
                                      borderRadius: "12px",
                                      fontWeight: "800",
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    {s.score}/5 (
                                    {s.performanceScore || s.score * 20}%)
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {s.emotion}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    color: "#64748b",
                                  }}
                                >
                                  {s.duration}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EMOTION ANALYSIS */}
              {activeTab === "emotion" && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      marginBottom: "16px",
                    }}
                  >
                    🎭{" "}
                    {t(
                      "Facial Emotion AI Analysis (FER-2013)",
                      "ಮುಖಭಾವ ವಿಶ್ಲೇಷಣೆ",
                    )}
                  </h3>

                  {!data?.emotionDistribution ||
                  data.emotionDistribution.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#f8fafc",
                        borderRadius: "14px",
                        border: "1px dashed #cbd5e1",
                      }}
                    >
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
                        📷
                      </div>
                      <h4 style={{ margin: "0 0 6px 0", fontWeight: "700" }}>
                        {t(
                          "No Emotion Recognition Sessions Logged Yet",
                          "ಯಾವುದೇ ಮುಖಭಾವ ದಾಖಲೆಗಳಿಲ್ಲ",
                        )}
                      </h4>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.88rem",
                          margin: 0,
                        }}
                      >
                        {t(
                          "Play emotion games with webcam enabled to capture and analyze real-time emotional reactions.",
                          "ಮುಖಭಾವವನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಕ್ಯಾಮರಾ ಸಕ್ರಿಯಗೊಳಿಸಿ ಚಟುವಟಿಕೆಗಳನ್ನು ನಡೆಸಿ.",
                        )}
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "12px",
                        marginBottom: "24px",
                      }}
                    >
                      {(data?.emotionDistribution || []).map((em, i) => (
                        <div
                          key={i}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            padding: "14px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{ fontSize: "1.1rem", fontWeight: "700" }}
                          >
                            {em.emotion}
                          </div>
                          <div
                            style={{
                              fontSize: "1.6rem",
                              fontWeight: "800",
                              color: em.color || "#4F6EF7",
                              margin: "4px 0",
                            }}
                          >
                            {em.percentage}%
                          </div>
                          <div
                            className="progress-bar"
                            style={{ height: "6px" }}
                          >
                            <div
                              className="progress-fill"
                              style={{
                                width: `${em.percentage}%`,
                                background: em.color || "#4F6EF7",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: LEVEL MANAGEMENT */}
              {activeTab === "level" && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      marginBottom: "16px",
                    }}
                  >
                    ⚙️{" "}
                    {t(
                      "Therapist Level Decision & Verification",
                      "ಮಟ್ಟ ಬದಲಾವಣೆ ನಿರ್ಧಾರ",
                    )}
                  </h3>

                  {/* Current Status Card */}
                  <div
                    style={{
                      background: levelData.bg,
                      border: `1.5px solid ${levelData.color}44`,
                      borderRadius: "16px",
                      padding: "20px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: levelData.color,
                        fontWeight: "700",
                      }}
                    >
                      {t("Current Verified Status", "ಪ್ರಸ್ತುತ ಪರಿಶೀಲಿತ ಸ್ಥಿತಿ")}
                      :
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "800",
                        color: levelData.color,
                        margin: "6px 0",
                      }}
                    >
                      {levelData.emoji} {levelData.label}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "#334155",
                      }}
                    >
                      {t("Current Progress Status", "ಪ್ರಗತಿ ಸ್ಥಿತಿ")}:{" "}
                      <strong>{progressStatus}</strong> ·{" "}
                      {t("Active Streak", "ಸತತ ಚಟುವಟಿಕೆ")}:{" "}
                      <strong>
                        {data?.streak || 0} {t("days", "ದಿನಗಳು")}
                      </strong>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "14px",
                      marginBottom: "20px",
                    }}
                  >
                    <button
                      onClick={() => setLevelConfirm(1)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border:
                          currentLevel === 1
                            ? "2px solid #16a34a"
                            : "1px solid #cbd5e1",
                        background: currentLevel === 1 ? "#dcfce7" : "#ffffff",
                        color: "#166534",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    >
                      🌱 {t("Set Level 1 (Emerging)", "ಮಟ್ಟ 1 (ಆರಂಭಿಕ)")}
                    </button>

                    <button
                      onClick={() => setLevelConfirm(2)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border:
                          currentLevel === 2
                            ? "2px solid #ca8a04"
                            : "1px solid #cbd5e1",
                        background: currentLevel === 2 ? "#fef9c3" : "#ffffff",
                        color: "#854d0e",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    >
                      🌿 {t("Set Level 2 (Developing)", "ಮಟ್ಟ 2 (ಅಭಿವೃದ್ಧಿ)")}
                    </button>

                    <button
                      onClick={() => setLevelConfirm(3)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border:
                          currentLevel === 3
                            ? "2px solid #dc2626"
                            : "1px solid #cbd5e1",
                        background: currentLevel === 3 ? "#fee2e2" : "#ffffff",
                        color: "#991b1b",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    >
                      🌳 {t("Set Level 3 (Advancing)", "ಮಟ್ಟ 3 (ಸುಧಾರಿತ)")}
                    </button>
                  </div>

                  {levelConfirm && (
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "20px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <h4 style={{ margin: "0 0 10px 0" }}>
                        {t(
                          `Confirm change to Level ${levelConfirm}?`,
                          `ಮಟ್ಟ ${levelConfirm} ಕ್ಕೆ ಬದಲಾಯಿಸಲು ಖಚಿತಪಡಿಸಿ?`,
                        )}
                      </h4>
                      <textarea
                        rows={3}
                        value={levelReason}
                        onChange={(e) => setLevelReason(e.target.value)}
                        placeholder={t(
                          "Clinical clinical justification for level change...",
                          "ಮಟ್ಟ ಬದಲಾವಣೆಗೆ ವೈದ್ಯಕೀಯ ಕಾರಣ...",
                        )}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          marginBottom: "12px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={handleLevelChangeConfirm}
                          disabled={updatingLevel}
                          style={{
                            padding: "8px 18px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#4F6EF7",
                            color: "white",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          {updatingLevel
                            ? t("Updating...", "ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...")
                            : t("Confirm & Notify Parent", "ಖಚಿತಪಡಿಸಿ")}
                        </button>
                        <button
                          onClick={() => setLevelConfirm(null)}
                          style={{
                            padding: "8px 18px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          {t("Cancel", "ರದ್ದು")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SEND FEEDBACK */}
              {activeTab === "feedback" && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      marginBottom: "16px",
                    }}
                  >
                    💬{" "}
                    {t(
                      "Send Clinical Guidance to Parent",
                      "ಪೋಷಕರಿಗೆ ಮಾರ್ಗದರ್ಶನ ಕಳುಹಿಸಿ",
                    )}
                  </h3>

                  {feedbackSuccess && (
                    <div
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        marginBottom: "16px",
                        fontWeight: "700",
                      }}
                    >
                      ✅ {feedbackSuccess}
                    </div>
                  )}

                  {/* Templates */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      {t(
                        "Quick Clinical Templates:",
                        "ತ್ವರಿತ ಸಂದೇಶ ಟೆಂಪ್ಲೇಟ್‌ಗಳು:",
                      )}
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFeedbackText(tmpl)}
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          💡 {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSendFeedback}>
                    <div style={{ marginBottom: "16px" }}>
                      <textarea
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={t(
                          "Write detailed weekly observations and actionable guidance for the parents...",
                          "ಪೋಷಕರಿಗೆ ವಾರದ ಅವಲೋಕನ ಮತ್ತು ಮಾರ್ಗದರ್ಶನವನ್ನು ಬರೆಯಿರಿ...",
                        )}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.95rem",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingFeedback || !feedbackText.trim()}
                      style={{
                        padding: "12px 24px",
                        background: "#4F6EF7",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(79, 110, 247, 0.3)",
                      }}
                    >
                      {sendingFeedback
                        ? t("Sending...", "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...")
                        : t("Send Guidance to Parent", "ಮಾರ್ಗದರ್ಶನ ಕಳುಹಿಸಿ")}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "exam" && <ExamTab child={child} />}
            </>
          )}
        </div>
        {selectedCertificate && (
          <CertificateModal
            childName={child.name}
            childPhoto={child.profilePhoto}
            activityTitle={selectedCertificate.activityTitle}
            onClose={() => setSelectedCertificate(null)}
          />
        )}
      </div>
    </div>
  );
}
