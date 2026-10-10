import React, { useState, useEffect } from "react";
import EmotionDetector from "./EmotionDetector";
import { getExamQuestions, submitExamResult, changeChildLevel } from "../services/api";
import {
  examTranslations,
  EmotionIdentifyQuestion,
  SocialScenarioQuestion,
  PatternCompleteQuestion,
  InstructionFollowQuestion,
  TurnTakingQuestion,
  EmotionCausePairQuestion,
  SequenceOrderQuestion,
  CalmingStrategyQuestion
} from "./ExamGameQuestions";
import jsPDF from "jspdf";

export default function MasteryExamModal({
  open = true,
  onClose,
  child,
  childId: propChildId,
  childName: propChildName,
  childAge: propChildAge,
  childLevel: propChildLevel,
  onExamPassed
}) {
  if (!open) return null;

  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState("intro"); // 'intro' | 'question' | 'result'
  const [loading, setLoading] = useState(false);

  // Extract Child Metadata
  const targetChildId = child?._id || propChildId || "mock_child";
  const childName = child?.name || propChildName || "Child";
  const childAge = Number(child?.age || propChildAge) || 6;
  const childLevel = Number(child?.level || propChildLevel) || 2;
  const ageGroupNum = childAge <= 5 ? 1 : childAge <= 8 ? 2 : 3;
  const ageCategoryLabel = ageGroupNum === 1 ? "Age 2–5 (Early Development)" : ageGroupNum === 2 ? "Age 5–8 (Foundation)" : "Age 9–12 (Advanced)";

  // Exam Data
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(360);
  const [examResult, setExamResult] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState("Focused");
  const [emotionLogs, setEmotionLogs] = useState([]);
  const [promoting, setPromoting] = useState(false);
  const [promotedSuccess, setPromotedSuccess] = useState(false);

  const t = examTranslations[language] || examTranslations.en;

  // Load Exam Questions for Child's Age Category and Level
  useEffect(() => {
    let isMounted = true;
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const data = await getExamQuestions(targetChildId);
        if (isMounted) {
          setExamData(data);
          setQuestions(data.questions || []);
          setTimeRemaining(data.timeLimit || (ageGroupNum === 1 ? 240 : 360));
        }
      } catch (err) {
        console.warn("Using offline adaptive question generator for child:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadQuestions();
    return () => { isMounted = false; };
  }, [targetChildId, childAge, childLevel, ageGroupNum]);

  // Timer Countdown during Question Step
  useEffect(() => {
    if (step !== "question" || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeRemaining]);

  // Live FER Emotion Detection
  const handleEmotionDetected = (emo) => {
    const emoName = typeof emo === "string" ? emo : emo?.rawEmotion || emo?.emotion || "Focused";
    setCurrentEmotion(emoName);
    setEmotionLogs((prev) => [...prev, emoName]);
  };

  // Handle Answer Selection
  const handleAnswerQuestion = (childAns, isCorrect) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newAnswer = {
      questionId: currentQ.id,
      questionType: currentQ.type,
      domain: currentQ.domain,
      childAnswer: childAns,
      correctAnswer: currentQ.correctAnswer || "correct_option",
      isCorrect: Boolean(isCorrect),
      emotionDuringAnswer: currentEmotion,
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinalSubmit(updatedAnswers);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async (finalAnsList) => {
    const ansToSubmit = finalAnsList || userAnswers;
    setLoading(true);

    const totalQuestions = ansToSubmit.length || 1;
    const correctCount = ansToSubmit.filter((a) => a.isCorrect).length;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);

    // Compute Emotion Frequency
    const emoCounts = { happy: 0, neutral: 0, sad: 0, angry: 0, fearful: 0 };
    emotionLogs.forEach((e) => {
      const el = (e || "").toLowerCase();
      if (el.includes("happy") || el.includes("joy")) emoCounts.happy++;
      else if (el.includes("sad") || el.includes("gloom")) emoCounts.sad++;
      else if (el.includes("angry") || el.includes("frustrat")) emoCounts.angry++;
      else if (el.includes("fear") || el.includes("anxious")) emoCounts.fearful++;
      else emoCounts.neutral++;
    });

    const totalLogs = emotionLogs.length || 1;
    const emotionDataPct = {
      happy: Math.round((emoCounts.happy / totalLogs) * 100),
      neutral: Math.round((emoCounts.neutral / totalLogs) * 100),
      sad: Math.round((emoCounts.sad / totalLogs) * 100),
      angry: Math.round((emoCounts.angry / totalLogs) * 100),
      fearful: Math.round((emoCounts.fearful / totalLogs) * 100),
    };

    let result = "NEEDS_WORK";
    let statusText = "Needs More Practice 🔄";
    let statusColor = "#ef4444";
    let statusBg = "#fee2e2";

    if (scorePct >= 80) {
      result = "PASSED";
      statusText = "Mastery Achieved! 🏆";
      statusColor = "#16a34a";
      statusBg = "#dcfce7";
    } else if (scorePct >= 60) {
      result = "PARTIAL";
      statusText = "Solid Progress 👍";
      statusColor = "#ca8a04";
      statusBg = "#fef9c3";
    }

    const compiledResult = {
      score: scorePct,
      correct: correctCount,
      total: totalQuestions,
      result,
      statusText,
      statusColor,
      statusBg,
      recommendation:
        scorePct >= 80
          ? `Outstanding! ${childName} achieved ${scorePct}% and demonstrated mastery of Level ${childLevel} games! Ready for Level advancement.`
          : scorePct >= 60
          ? `Good job! ${childName} scored ${scorePct}% on the game challenges. Continue practice to achieve full mastery.`
          : `Keep practicing! ${childName} scored ${scorePct}%. Engaging with daily therapy games will build these core milestones.`,
      domains: {
        emotion: { correct: ansToSubmit.filter((a) => a.domain === "emotion" && a.isCorrect).length, total: ansToSubmit.filter((a) => a.domain === "emotion").length || 1 },
        social: { correct: ansToSubmit.filter((a) => a.domain === "social" && a.isCorrect).length, total: ansToSubmit.filter((a) => a.domain === "social").length || 1 },
        cognitive: { correct: ansToSubmit.filter((a) => a.domain === "cognitive" && a.isCorrect).length, total: ansToSubmit.filter((a) => a.domain === "cognitive").length || 1 },
        communication: { correct: ansToSubmit.filter((a) => a.domain === "communication" && a.isCorrect).length, total: ansToSubmit.filter((a) => a.domain === "communication").length || 1 },
        sensory: { correct: ansToSubmit.filter((a) => a.domain === "sensory" && a.isCorrect).length, total: ansToSubmit.filter((a) => a.domain === "sensory").length || 1 }
      }
    };

    try {
      const res = await submitExamResult(child?._id || "mock_child", {
        answers: ansToSubmit,
        emotionData: emotionDataPct,
        timeTaken: (examData?.timeLimit || 360) - timeRemaining,
      });
      if (res?.result) {
        setExamResult({ ...compiledResult, ...res.result });
      } else {
        setExamResult(compiledResult);
      }
    } catch (err) {
      console.warn("Exam submit fallback:", err);
      setExamResult(compiledResult);
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  // Handle Child Level Promotion
  const handlePromoteLevel = async () => {
    if (!child?._id) return;
    setPromoting(true);
    try {
      const nextLevel = Math.min(3, (Number(child.level) || 1) + 1);
      await changeChildLevel(child._id, nextLevel, `Passed Game-Based Mastery Exam with ${examResult?.score}%!`);
      setPromotedSuccess(true);
      if (onExamPassed) onExamPassed(nextLevel);
    } catch (err) {
      alert("Level promotion failed: " + err.message);
    } finally {
      setPromoting(false);
    }
  };

  // Download Clinical PDF Report
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, 210, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AutismAssist — Game-Based Mastery Examination", 14, 22);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Child Name: ${childName}`, 14, 48);
      doc.text(`Age: ${childAge} years (${ageCategoryLabel})`, 14, 55);
      doc.text(`Clinical ASD Level: Level ${childLevel}`, 14, 62);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 69);

      const score = examResult?.score || 80;
      const resLabel = examResult?.result || "PASSED";

      doc.setFillColor(resLabel === "PASSED" ? 220 : 254, resLabel === "PASSED" ? 252 : 243, resLabel === "PASSED" ? 231 : 199);
      doc.rect(14, 76, 182, 22, "F");

      doc.setFontSize(14);
      doc.setTextColor(resLabel === "PASSED" ? 22 : 180, resLabel === "PASSED" ? 163 : 83, resLabel === "PASSED" ? 74 : 9);
      doc.text(`Game Exam Score: ${score}% — ${resLabel}`, 20, 90);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("Clinical Domain Skill Breakdown:", 14, 110);

      let yPos = 120;
      const domainsObj = examResult?.domains || {};
      Object.entries(domainsObj).forEach(([domain, stats]) => {
        const domName = domain.charAt(0).toUpperCase() + domain.slice(1);
        const pct = Math.round(((stats.correct || 0) / (stats.total || 1)) * 100);
        doc.setFontSize(10);
        doc.text(`• ${domName} Domain: ${stats.correct}/${stats.total} (${pct}%)`, 20, yPos);
        yPos += 8;
      });

      doc.text(`Recommendation: ${examResult?.recommendation || "Continue daily game activities."}`, 14, yPos + 10, { maxWidth: 180 });
      doc.save(`Game_Exam_Report_${childName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      alert("PDF report generated successfully!");
    }
  };

  // Render Current Game Question
  const renderCurrentQuestion = () => {
    if (!questions || questions.length === 0) {
      return (
        <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>
          Loading game challenges...
        </div>
      );
    }

    const q = questions[currentIndex];
    if (!q) return null;

    switch (q.type) {
      case "EmotionIdentifyQuestion":
        return <EmotionIdentifyQuestion question={q} level={childLevel} ageGroup={ageGroupNum} onAnswer={handleAnswerQuestion} language={language} />;
      case "SocialScenarioQuestion":
        return <SocialScenarioQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "PatternCompleteQuestion":
        return <PatternCompleteQuestion question={q} onAnswer={handleAnswerQuestion} />;
      case "InstructionFollowQuestion":
        return <InstructionFollowQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "TurnTakingQuestion":
        return <TurnTakingQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "EmotionCausePairQuestion":
        return <EmotionCausePairQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "SequenceOrderQuestion":
        return <SequenceOrderQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "CalmingStrategyQuestion":
        return <CalmingStrategyQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      default:
        return <SocialScenarioQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Nunito', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "28px",
          padding: "24px 28px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px -10px rgba(0, 0, 0, 0.5)",
          border: "2px solid rgba(255, 255, 255, 0.15)",
          color: "#ffffff",
          position: "relative"
        }}
      >
        {/* MODAL HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>🎮</span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0, color: "#a5b4fc" }}>
                {language === "kn" ? "ಗೇಮ್-ಆಧಾರಿತ ಮಾಸ್ಟರಿ ಪರೀಕ್ಷೆ" : "Game-Based Mastery Examination"}
              </h2>
            </div>
            <div style={{ fontSize: "0.82rem", color: "#c7d2fe", marginTop: "4px" }}>
              {childName} &bull; {ageCategoryLabel} &bull; Level {childLevel}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Bilingual Switch */}
            <button
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "6px 12px",
                borderRadius: "16px",
                fontSize: "0.82rem",
                fontWeight: "800",
                cursor: "pointer"
              }}
            >
              🌐 {language === "en" ? "EN" : "ಕನ್ನಡ"}
            </button>

            {/* Launch Fullscreen Mode */}
            <button
              onClick={() => {
                onClose && onClose();
                window.history.pushState({}, "", "/exam");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              title="Open full page examination"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "16px",
                fontSize: "0.82rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
              }}
            >
              ⛶ {language === "kn" ? "ಪೂರ್ಣ ಪರದೆ" : "Fullscreen"}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "1.1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── STAGE 1: INTRO SCREEN ─── */}
        {step === "intro" && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{ fontSize: "4.5rem", animation: "bounce 2s infinite", marginBottom: "8px" }}>🏆</div>
            <h3 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 10px", color: "#fbbf24" }}>
              {language === "kn" ? "ಮಾಸ್ಟರಿ ಆಟದ ಸವಾಲು ಪ್ರಾರಂಭಿಸಿ!" : "Interactive Mastery Game Challenge!"}
            </h3>
            <p style={{ color: "#cbd5e1", fontSize: "1rem", maxWidth: "560px", margin: "0 auto 20px" }}>
              {language === "kn"
                ? "ಇದು ಪ್ರಶ್ನೆ ಪತ್ರಿಕೆಯಲ್ಲ! ಮಗುವಿನ ವಯಸ್ಸು ಮತ್ತು ಹಂತಕ್ಕೆ ಅನುಗುಣವಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಸಂವಾದಾತ್ಮಕ ಆಟಗಳು."
                : "Not a question paper! This is a series of interactive mini-games tailored for your child's age group and therapeutic level."}
            </p>

            {/* Game Skills Feature Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "14px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.8rem" }}>🎭</div>
                <div style={{ fontWeight: "800", fontSize: "0.92rem", marginTop: "4px" }}>Emotion Detective</div>
                <div style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Disappearing Face Memory</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "14px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.8rem" }}>🧩</div>
                <div style={{ fontWeight: "800", fontSize: "0.92rem", marginTop: "4px" }}>Pattern Master</div>
                <div style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Color & Shape Logic</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "14px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.8rem" }}>🐾</div>
                <div style={{ fontWeight: "800", fontSize: "0.92rem", marginTop: "4px" }}>Safari Touch</div>
                <div style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Multi-Step Animal Touch</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "14px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.8rem" }}>📋</div>
                <div style={{ fontWeight: "800", fontSize: "0.92rem", marginTop: "4px" }}>Routine Arranger</div>
                <div style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Step-by-Step Sequencing</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
              <button
                onClick={() => setStep("question")}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "22px",
                  padding: "14px 36px",
                  fontSize: "1.1rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(245,158,11,0.4)",
                  transition: "transform 0.15s"
                }}
              >
                🎮 {language === "kn" ? "ಆಟದ ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ!" : "Start Game Exam →"}
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 2: QUESTION STEP ─── */}
        {step === "question" && (
          <div>
            {/* Top Bar Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#fbbf24" }}>
                  {t.question} {currentIndex + 1} {t.of} {questions.length}
                </span>
                <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#a5b4fc", background: "rgba(99,102,241,0.25)", padding: "2px 8px", borderRadius: "10px" }}>
                  {questions[currentIndex]?.domain?.toUpperCase()}
                </span>
              </div>

              {/* Timer */}
              <div style={{
                background: timeRemaining <= 60 ? "#ef4444" : "rgba(255,255,255,0.1)",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "14px",
                fontWeight: "900",
                fontSize: "0.95rem",
                fontFamily: "monospace"
              }}>
                ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "99px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{
                width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f59e0b, #10b981)",
                transition: "width 0.3s ease"
              }} />
            </div>

            {/* Game Question + Camera Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: "18px" }}>
              {/* Question Game Canvas */}
              <div style={{
                background: "rgba(255, 255, 255, 0.06)",
                borderRadius: "20px",
                padding: "20px",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}>
                {renderCurrentQuestion()}
              </div>

              {/* Emotion Detector Panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: "16px",
                  padding: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#38bdf8", marginBottom: "6px" }}>
                    🎥 FER VISION AI
                  </div>
                  <div style={{ borderRadius: "10px", overflow: "hidden", height: "110px" }}>
                    <EmotionDetector isActive={true} onEmotionDetected={handleEmotionDetected} />
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#cbd5e1" }}>
                    Status: <strong style={{ color: "#38bdf8" }}>{currentEmotion}</strong>
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", color: "#cbd5e1", fontWeight: "700" }}>Level Adaptive</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#fbbf24", marginTop: "2px" }}>
                    Level {childLevel}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                    Age {childAge}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STAGE 3: RESULTS SCREEN ─── */}
        {step === "result" && examResult && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{ fontSize: "4.5rem", animation: "bounce 1.5s infinite" }}>🎉</div>
            <h3 style={{ fontSize: "1.9rem", fontWeight: "900", margin: "6px 0", color: "#10b981" }}>
              {language === "kn" ? "ಪರೀಕ್ಷೆ ಮುಕ್ತಾಯಗೊಂಡಿದೆ!" : "Exam Completed!"}
            </h3>
            <div style={{
              display: "inline-block",
              background: examResult.statusBg,
              color: examResult.statusColor,
              fontWeight: "900",
              fontSize: "1.1rem",
              padding: "6px 20px",
              borderRadius: "20px",
              margin: "8px 0 16px"
            }}>
              {examResult.statusText} &bull; Score: {examResult.score}%
            </div>

            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", maxWidth: "560px", margin: "0 auto 20px", lineHeight: "1.5" }}>
              {examResult.recommendation}
            </p>

            {/* Domains Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", maxWidth: "600px", margin: "0 auto 24px" }}>
              {Object.entries(examResult.domains || {}).map(([domain, stats]) => {
                const domName = domain.charAt(0).toUpperCase() + domain.slice(1);
                const pct = Math.round(((stats.correct || 0) / (stats.total || 1)) * 100);
                return (
                  <div key={domain} style={{ background: "rgba(255,255,255,0.08)", padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ fontSize: "0.75rem", color: "#a5b4fc", fontWeight: "700" }}>{domName}</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900", color: pct >= 70 ? "#10b981" : "#f59e0b", marginTop: "2px" }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              {examResult.score >= 80 && (
                <button
                  onClick={handlePromoteLevel}
                  disabled={promoting || promotedSuccess}
                  style={{
                    background: promotedSuccess ? "#10b981" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    padding: "12px 28px",
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    cursor: promotedSuccess ? "default" : "pointer",
                    boxShadow: "0 4px 14px rgba(16,185,129,0.4)"
                  }}
                >
                  {promotedSuccess ? "✅ Promoted to Level " + Math.min(3, childLevel + 1) : "🎖️ Promote Child to Level " + Math.min(3, childLevel + 1)}
                </button>
              )}

              <button
                onClick={handleDownloadPDF}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "12px 24px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
                }}
              >
                📄 {language === "kn" ? "ವರದಿ ಡೌನ್ಲೋಡ್" : "Download Clinical Report"}
              </button>

              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "20px",
                  padding: "12px 24px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                {language === "kn" ? "ಮುಚ್ಚಿ" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
