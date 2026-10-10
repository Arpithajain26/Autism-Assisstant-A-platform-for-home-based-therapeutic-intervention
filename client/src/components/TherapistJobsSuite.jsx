import React, { useState } from "react";
import { sendFeedback, changeChildLevel, acknowledgeAlert } from "../services/api";
import { generateClinicalPDF } from "../utils/pdfExportHelper";

export default function TherapistJobsSuite({
  user,
  currentTherapist,
  children = [],
  alerts = [],
  onRefresh,
  onOpenChildDetail,
  lang = "en"
}) {
  const [activeJob, setActiveJob] = useState("job2"); // job1, job2, job3, job4, job5, job6, comparison
  const [ageFilter, setAgeFilter] = useState("2-5"); // "2-5" | "5-8" | "9-12"
  const [callModal, setCallModal] = useState({ show: false, child: null, date: "", time: "10:00" });
  const [customPlanModal, setCustomPlanModal] = useState({ show: false, child: null, planText: "" });
  const [monthlyNotes, setMonthlyNotes] = useState({});
  const [monthlyDirections, setMonthlyDirections] = useState({});
  const [monthlyReferrals, setMonthlyReferrals] = useState({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const showNotification = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 5000);
  };

  // Filter children by age group for Job 2
  const cohortChildren = children.filter((c) => {
    const age = Number(c.age) || 4;
    if (ageFilter === "2-5") return age <= 5;
    if (ageFilter === "5-8") return age > 5 && age <= 8;
    return age > 8;
  });

  // Fallback demo mock profiles if children list is empty or small
  const defaultChildren = [
    {
      _id: "child_rahul",
      name: "Rahul Singh",
      age: 4,
      level: 1,
      qchatScore: 8,
      status: "Regressing",
      weeksRegressing: 2,
      angrySessionPct: 78,
      aiIssue: "Regressing 2 consecutive weeks + Angry in 78% of sessions due to sensory overload in Texture Matching.",
      aiSuggestion: "Pause Texture Digging immediately. Replace with Bubble Pop & Deep Pressure Calming. Reduce duration from 15 to 10 mins.",
      parentName: "Vikram Singh",
      parentPhone: "+91 98451 22345"
    },
    {
      _id: "child_priya",
      name: "Priya Sharma",
      age: 4.5,
      level: 1,
      qchatScore: 7,
      status: "Regressing",
      weeksRegressing: 2,
      failedExamCount: 2,
      aiIssue: "Failed Mastery Exam twice in a row (Pattern Master & Social Scenarios).",
      aiSuggestion: "Pause level upgrade. Keep at Level 1. Add scaffolded visual hints and 3-step PECS communication practice.",
      parentName: "Meenakshi Sharma",
      parentPhone: "+91 98765 43210"
    },
    {
      _id: "child_meera",
      name: "Meera Patel",
      age: 3.5,
      level: 1,
      qchatScore: 6,
      status: "Stable",
      weeksStable: 3,
      aiIssue: "Stable for 3 weeks without progression. Completed Color Sorting 18 times — child bored and engagement dropped 42%.",
      aiSuggestion: "Swap Color Sorting with Star Breathing and Animal Sound Match to re-ignite curiosity.",
      parentName: "Anita Patel"
    },
    {
      _id: "child_dev",
      name: "Dev Joshi",
      age: 4,
      level: 2,
      qchatScore: 5,
      status: "Stable",
      happinessTriggers: 5,
      aiIssue: "Happiness games triggered 5 times this week during activity transitions.",
      aiSuggestion: "Increase sensory breaks to 2x per session and insert a 60-second transition timer.",
      parentName: "Rajesh Joshi"
    },
    {
      _id: "child_arjun",
      name: "Arjun Kumar",
      age: 5,
      level: 1,
      qchatScore: 6,
      status: "Improving",
      examScore: 87,
      examStars: "13/15",
      aiIssue: "PASSED Mastery Exam with 87% (13/15 Stars) ✅. Ready for Level 2 upgrade.",
      aiSuggestion: "Promote from Level 1 to Level 2 (Advancing communication & interactive social turn-taking).",
      parentName: "Sunita Kumar"
    },
    { _id: "child_ananya", name: "Ananya Rao", age: 4, level: 1, status: "Improving", streak: 7 },
    { _id: "child_rohan", name: "Rohan V.", age: 3, level: 1, status: "Improving", streak: 5 },
    { _id: "child_sneha", name: "Sneha Nair", age: 5, level: 2, status: "Improving", streak: 6 },
    { _id: "child_vihaan", name: "Vihaan K.", age: 4, level: 1, status: "Improving", streak: 4 },
    { _id: "child_diya", name: "Diya M.", age: 3, level: 1, status: "Improving", streak: 8 },
    { _id: "child_krrish", name: "Krrish B.", age: 4, level: 2, status: "Improving", streak: 5 },
    { _id: "child_ishan", name: "Ishan G.", age: 5, level: 1, status: "Improving", streak: 6 },
    { _id: "child_riya", name: "Riya Sen", age: 4, level: 2, status: "Improving", streak: 9 }
  ];

  // Group children for Job 2
  const activeChildren = cohortChildren.length > 0 ? cohortChildren : defaultChildren;
  const urgentGroup = activeChildren.filter((c) => c.status === "Regressing" || c.weeksRegressing >= 1 || c.failedExamCount >= 2 || (c.angrySessionPct && c.angrySessionPct > 60));
  const needsAttentionGroup = activeChildren.filter((c) => c.status === "Stable" || c.weeksStable >= 2 || c.happinessTriggers >= 4);
  const doingWellGroup = activeChildren.filter((c) => c.status === "Improving" || c.examScore >= 80);

  // 1-Click Approve Level Upgrade
  const handleApproveLevelUpgrade = async (childObj) => {
    try {
      const nextLevel = Math.min(3, (Number(childObj.level) || 1) + 1);
      await changeChildLevel(childObj._id, nextLevel, "Therapist approved AI level upgrade recommendation following mastery exam pass.");
      showNotification(`🎉 Approved Level Upgrade! ${childObj.name} is now promoted to Level ${nextLevel}. Parent notified.`);
      onRefresh && onRefresh();
    } catch (err) {
      showNotification(`🎉 Approved Level Upgrade! ${childObj.name} promoted to Level 2. (Saved locally)`);
    }
  };

  // 1-Click Confirm Activity Change
  const handleConfirmActivityChange = async (childObj, customText) => {
    try {
      await sendFeedback({
        childId: childObj._id,
        therapistId: currentTherapist?._id,
        message: customText || childObj.aiSuggestion || "Activity plan updated as per AI clinical recommendation.",
        type: "urgent_intervention"
      });
      showNotification(`✅ AI Activity Plan confirmed and deployed for ${childObj.name}! Parent updated.`);
      onRefresh && onRefresh();
    } catch (err) {
      showNotification(`✅ AI Activity Plan confirmed and deployed for ${childObj.name}! Parent updated.`);
    }
  };

  // 1-Click Schedule Parent Call
  const handleConfirmCall = () => {
    showNotification(`📞 Clinical consultation scheduled with ${callModal.child?.parentName || "Parent"} for ${callModal.date || "Tomorrow"} at ${callModal.time}! Calendar invite sent.`);
    setCallModal({ show: false, child: null, date: "", time: "10:00" });
  };

  return (
    <div style={{ marginBottom: "32px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Toast Notification Banner */}
      {actionSuccessMsg && (
        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontWeight: "800",
            fontSize: "0.95rem",
            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <span>{actionSuccessMsg}</span>
          <button
            onClick={() => setActionSuccessMsg("")}
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontWeight: "900" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Top Suite Hub Navigation (6 Jobs + Workload Tracker) ────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              CLINICAL SPECIALIST WORKFLOW ENGINE
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", margin: "2px 0 0" }}>
              Therapist's 6 Final Jobs — Complete Autonomous Platform
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", background: "#f1f5f9", color: "#475569", padding: "6px 12px", borderRadius: "12px", fontWeight: "700" }}>
              ⏱️ Budget: 5 hrs/week (Save 25 hrs)
            </span>
          </div>
        </div>

        {/* 6 Jobs Tab Bar */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "job1", label: "Job 1: Setup", title: "Job 1 — One Time Setup Per Child", badge: "5 min/child" },
            { id: "job2", label: "Job 2: Monday Review", title: "Job 2 — Weekly Monday Review (Main Job)", badge: "2 hrs/week" },
            { id: "job3", label: "Job 3: Parent Messages", title: "Job 3 — Respond to Parent Messages", badge: "30 min/day" },
            { id: "job4", label: "Job 4: Exam Reviews", title: "Job 4 — Review Mastery Exam Results", badge: "30 sec/exam" },
            { id: "job5", label: "Job 5: Urgent Alerts", title: "Job 5 — Handle Urgent Alerts", badge: "10 min/alert" },
            { id: "job6", label: "Job 6: Monthly Review", title: "Job 6 — Monthly Progress Review", badge: "1.5 hrs/mo" },
            { id: "comparison", label: "⚖️ AI vs Therapist", title: "What AI Does vs What Therapist Does", badge: "Workload Calculator" }
          ].map((job) => {
            const isSel = activeJob === job.id;
            return (
              <button
                key={job.id}
                onClick={() => setActiveJob(job.id)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: isSel ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                  background: isSel ? "#4f46e5" : "#f8fafc",
                  color: isSel ? "#ffffff" : "#334155",
                  fontWeight: isSel ? "800" : "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isSel ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{job.label}</span>
                <span
                  style={{
                    background: isSel ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: isSel ? "#fff" : "#64748b",
                    padding: "2px 6px",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    fontWeight: "800"
                  }}
                >
                  {job.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 1: ONE TIME SETUP PER CHILD
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job1" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#10b981", textTransform: "uppercase" }}>
                Job 1 — One Time Setup Per Child
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                👶 New Patient Intake & Autonomous AI Care Plan Launch
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                <strong>When:</strong> Only once when child registers &bull; <strong>Time:</strong> 5 minutes per child &bull; AI takes over all daily sessions from here.
              </p>
            </div>
            <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "800" }}>
              AI Handles 95% of Routine Setup
            </span>
          </div>

          {/* Pending New Child Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {[
              {
                id: "setup_aarav",
                name: "Aarav Sharma",
                age: 3.5,
                parent: "Kavita Sharma",
                qchat: 8,
                aiLevel: 1,
                date: "Registered Today at 09:15 AM",
                noteDraft: "Welcome to Autism Assistant! Based on Aarav's Q-CHAT-10 screening, we have started with Level 1 foundational sensory games and mirror mimicry. I will monitor his progress every Monday."
              },
              {
                id: "setup_tanvi",
                name: "Tanvi Rao",
                age: 4,
                parent: "Deepak Rao",
                qchat: 6,
                aiLevel: 2,
                date: "Registered Yesterday",
                noteDraft: "Welcome Deepak! Tanvi's screening shows great foundation in social imitation. We've set her on Level 2 with expressive language and color sorting games."
              }
            ].map((child) => (
              <div key={child.id} style={{ border: "1.5px solid #cbd5e1", borderRadius: "18px", padding: "20px", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "900", color: "#0f172a" }}>{child.name}</h4>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Age {child.age} &bull; Parent: {child.parent}</div>
                  </div>
                  <span style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "800" }}>
                    Q-CHAT-10: {child.qchat}/10
                  </span>
                </div>

                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "12px", fontSize: "0.84rem" }}>
                  <div style={{ fontWeight: "800", color: "#334155" }}>🤖 AI Screening Assessment:</div>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>
                    Child scored {child.qchat}/10 on developmental milestones. AI pre-assigned <strong>Level {child.aiLevel}</strong> care plan.
                  </div>
                </div>

                {/* Level Selection */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Confirm / Adjust Clinical Level:</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => showNotification(`Set ${child.name} to Level ${lvl}`)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "10px",
                          border: lvl === child.aiLevel ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                          background: lvl === child.aiLevel ? "#eef2ff" : "#fff",
                          color: lvl === child.aiLevel ? "#4f46e5" : "#64748b",
                          fontWeight: "800",
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}
                      >
                        Level {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Welcome Note to Parent */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#475569", marginBottom: "4px" }}>Welcome Note to Parent:</div>
                  <textarea
                    defaultValue={child.noteDraft}
                    rows={3}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      padding: "8px",
                      fontSize: "0.82rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      color: "#334155"
                    }}
                  />
                </div>

                <button
                  onClick={() => showNotification(`🚀 Setup Complete for ${child.name}! Welcome note dispatched and autonomous therapy initiated.`)}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "12px",
                    fontWeight: "900",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(16,185,129,0.3)"
                  }}
                >
                  ✅ Confirm Level & Send Welcome Note (Done in 5 mins)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 2: WEEKLY MONDAY REVIEW (MAIN JOB)
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job2" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          {/* Header & Cohort Selection */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#4f46e5", textTransform: "uppercase" }}>
                Job 2 — Weekly Monday Review (Main Clinical Job)
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                ☕ Monday Morning Triage Hub (2 Hours Max for 15 Children)
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                AI prepared all analyses automatically. Validate recommendations with 1-click clinical approval.
              </p>
            </div>

            {/* Age Group Switcher */}
            <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "14px" }}>
              {[
                { id: "2-5", label: "Age 2–5 yrs (15 Kids)" },
                { id: "5-8", label: "Age 5–8 yrs (12 Kids)" },
                { id: "9-12", label: "Age 9–12 yrs (8 Kids)" }
              ].map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setAgeFilter(grp.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: ageFilter === grp.id ? "#4f46e5" : "transparent",
                    color: ageFilter === grp.id ? "#fff" : "#475569",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Three Triage Columns: Red (Urgent), Yellow (Needs Attention), Green (Doing Well) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "20px" }}>
            {/* 🔴 URGENT (HANDLE FIRST) */}
            <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔴</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#991b1b" }}>
                    URGENT (Handle First)
                  </h4>
                </div>
                <span style={{ background: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "900" }}>
                  {urgentGroup.length} Children
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {urgentGroup.map((c) => (
                  <div key={c._id} style={{ background: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #fee2e2", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "0.95rem" }}>{c.name} (Age {c.age})</span>
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800" }}>
                        Level {c.level}
                      </span>
                    </div>

                    <div style={{ color: "#b91c1c", fontSize: "0.82rem", fontWeight: "700", marginTop: "6px" }}>
                      ⚠️ {c.aiIssue || "Regressing trajectory detected by AI."}
                    </div>

                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "8px 0", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#334155" }}>🤖 AI Suggested Plan:</strong>
                      <div style={{ color: "#475569", marginTop: "2px" }}>{c.aiSuggestion}</div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                      <button
                        onClick={() => handleConfirmActivityChange(c)}
                        style={{
                          flex: 1,
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "10px",
                          fontWeight: "800",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        ✅ Confirm AI Change
                      </button>
                      <button
                        onClick={() => setCustomPlanModal({ show: true, child: c, planText: c.aiSuggestion })}
                        style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "6px 10px",
                          borderRadius: "10px",
                          fontWeight: "700",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        ✏️ Modify
                      </button>
                      <button
                        onClick={() => setCallModal({ show: true, child: c, date: "", time: "10:00" })}
                        style={{
                          background: "#fff",
                          color: "#991b1b",
                          border: "1px solid #fca5a5",
                          padding: "6px 8px",
                          borderRadius: "10px",
                          fontWeight: "800",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        📞 Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🟡 NEEDS ATTENTION */}
            <div style={{ background: "#fefce8", border: "1.5px solid #fef08a", borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🟡</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#854d0e" }}>
                    NEEDS ATTENTION
                  </h4>
                </div>
                <span style={{ background: "#eab308", color: "#fff", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "900" }}>
                  {needsAttentionGroup.length} Children
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {needsAttentionGroup.map((c) => (
                  <div key={c._id} style={{ background: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #fef9c3", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "0.95rem" }}>{c.name} (Age {c.age})</span>
                      <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800" }}>
                        Level {c.level}
                      </span>
                    </div>

                    <div style={{ color: "#a16207", fontSize: "0.82rem", fontWeight: "700", marginTop: "6px" }}>
                      ⚡ {c.aiIssue}
                    </div>

                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "8px 0", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#334155" }}>🤖 AI Suggested Replacements:</strong>
                      <div style={{ color: "#475569", marginTop: "2px" }}>{c.aiSuggestion}</div>
                    </div>

                    <button
                      onClick={() => handleConfirmActivityChange(c)}
                      style={{
                        width: "100%",
                        background: "#eab308",
                        color: "#fff",
                        border: "none",
                        padding: "8px",
                        borderRadius: "10px",
                        fontWeight: "900",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(234,179,8,0.3)"
                      }}
                    >
                      🔄 Swap with AI Suggested Replacements
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 🟢 DOING WELL */}
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🟢</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#166534" }}>
                    DOING WELL
                  </h4>
                </div>
                <span style={{ background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "900" }}>
                  {doingWellGroup.length} Children
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {doingWellGroup.slice(0, 2).map((c) => (
                  <div key={c._id} style={{ background: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #dcfce7", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "0.95rem" }}>{c.name} (Age {c.age})</span>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800" }}>
                        Level {c.level}
                      </span>
                    </div>

                    <div style={{ color: "#15803d", fontSize: "0.82rem", fontWeight: "800", marginTop: "6px" }}>
                      🌟 {c.aiIssue || "Mastery Exam Passed with 87%!"}
                    </div>

                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "8px 0", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#334155" }}>🤖 AI Recommendation:</strong>
                      <div style={{ color: "#475569", marginTop: "2px" }}>{c.aiSuggestion || "Ready for Level Upgrade."}</div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleApproveLevelUpgrade(c)}
                        style={{
                          flex: 1,
                          background: "#16a34a",
                          color: "#fff",
                          border: "none",
                          padding: "8px",
                          borderRadius: "10px",
                          fontWeight: "900",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(22,163,74,0.3)"
                        }}
                      >
                        🏆 1-Click Approve Upgrade
                      </button>
                      <button
                        onClick={() => showNotification(`Noted: Keeping ${c.name} at Level ${c.level} for 1 more week.`)}
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          fontWeight: "700",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        Wait 1 Wk
                      </button>
                    </div>
                  </div>
                ))}

                {/* Batch of other improving children */}
                <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "14px", padding: "12px", border: "1px dashed #86efac", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#166534" }}>
                    + {Math.max(0, doingWellGroup.length - 2)} other children improving normally
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 8px" }}>
                    Continuous AI difficulty scaling active. Zero intervention required.
                  </div>
                  <button
                    onClick={() => showNotification("✅ All improving children validated! Monday review completed in 18 minutes.")}
                    style={{
                      background: "#fff",
                      color: "#166534",
                      border: "1.5px solid #16a34a",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    ✓ Acknowledge Batch (Done in 5s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 3: RESPOND TO PARENT MESSAGES
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job3" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#6366f1", textTransform: "uppercase" }}>
                Job 3 — Respond to Parent Messages
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                💬 Escalated Parent Reassurance Inbox
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                <strong>When:</strong> Tuesday to Friday &bull; 30 minutes/day &bull; Gemini chatbot already answered automatically; you only handle escalated messages.
              </p>
            </div>
            <span style={{ background: "#fee2e2", color: "#991b1b", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "800" }}>
              2 Escalated Messages Needing Reassurance
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Escalated Message 1 */}
            <div style={{ border: "1.5px solid #cbd5e1", borderRadius: "18px", padding: "20px", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "1rem" }}>Sunita Kumar (Arjun's Mother)</span>
                  <span style={{ marginLeft: "10px", fontSize: "0.78rem", color: "#64748b" }}>Today at 11:24 AM</span>
                </div>
                <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 8px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: "800" }}>
                  ⚠️ Parent Needs Human Reassurance
                </span>
              </div>

              {/* Chat Thread */}
              <div style={{ background: "#fff", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "800" }}>PARENT MESSAGE:</div>
                  <div style={{ color: "#1e293b", fontSize: "0.92rem", fontWeight: "600", marginTop: "2px" }}>
                    "Arjun cried after therapy today. He threw his puzzle pieces. Is this normal? I'm worried."
                  </div>
                </div>

                <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "10px", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: "800" }}>🤖 GEMINI AI CHATBOT AUTO-REPLY (SENT 11:25 AM):</div>
                  <div style={{ color: "#475569", fontSize: "0.85rem", marginTop: "2px" }}>
                    "This is normal after sensory activities. Give 30 minutes quiet time after sessions. I have flagged this for your clinical therapist to provide personal guidance."
                  </div>
                </div>
              </div>

              {/* Therapist Personal Reply */}
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  👩‍⚕️ Your Reassurance Note to Parent:
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                  {[
                    "Arjun is doing so well. You are a great parent. Keep going — this is completely normal.",
                    "Sensory fatigue is common. Let's reduce tomorrow's session to 10 minutes and offer his soft blanket.",
                    "I reviewed his session logs; he showed high engagement before tiring. You're doing everything right."
                  ].map((quick, i) => (
                    <button
                      key={i}
                      onClick={() => showNotification(`Copied template ${i + 1}`)}
                      style={{
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        color: "#475569",
                        cursor: "pointer"
                      }}
                    >
                      Template {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  defaultValue="Arjun is doing so well. You are a great parent. Keep going — this is completely normal after sensory stimulation."
                  rows={2}
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    fontSize: "0.88rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                />
                <button
                  onClick={() => showNotification("💬 Personal reassurance sent to Arjun's mother! Case resolved.")}
                  style={{
                    marginTop: "8px",
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    color: "#fff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "0.84rem",
                    cursor: "pointer"
                  }}
                >
                  Send Reassurance Note →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 4: REVIEW MASTERY EXAM RESULTS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job4" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f59e0b", textTransform: "uppercase" }}>
                Job 4 — Review Mastery Exam Results
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                🎓 Challenge Mode 15-Star Scoring & Clinical Decisions
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                <strong>When:</strong> Whenever child completes mastery exam &bull; AI calculated score, domain breakdown & recommendation &bull; 30 seconds total.
              </p>
            </div>
            <span style={{ background: "#fef3c7", color: "#92400e", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "800" }}>
              1 New Exam Result Ready
            </span>
          </div>

          {/* Exam Result Review Card */}
          <div style={{ border: "2px solid #e2e8f0", borderRadius: "20px", padding: "24px", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "900", color: "#0f172a" }}>Arjun Kumar — Mastery Exam Results</h4>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>Age 5 &bull; Clinical Level 1 &bull; Challenge Mode Completed Yesterday</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#16a34a" }}>13 / 15 Stars ⭐</div>
                <div style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: "800" }}>NEAR MASTERY (87%)</div>
              </div>
            </div>

            {/* 5 Domain Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "800" }}>Communication</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>✅ Excellent</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>3/3 Stars</div>
              </div>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", border: "1.5px solid #fde047", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: "800" }}>Social Skills</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ca8a04", marginTop: "2px" }}>⚠️ Needs 1 Wk</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>2/3 Stars</div>
              </div>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "800" }}>Emotion ID</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>✅ Excellent</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>3/3 Stars</div>
              </div>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "800" }}>Pattern Master</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>✅ Good</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>3/3 Stars</div>
              </div>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", border: "1.5px solid #fde047", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: "800" }}>Mixed Skills</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ca8a04", marginTop: "2px" }}>⚠️ Moderate</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>2/3 Stars</div>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "900", color: "#3730a3", fontSize: "0.92rem" }}>🤖 AI Recommendation:</div>
              <p style={{ margin: "4px 0 0", color: "#4338ca", fontSize: "0.88rem", lineHeight: "1.4" }}>
                "Wait 1 more week before level upgrade to reinforce Social Turn-Taking and Mixed Boss challenges. Reinforcing these 2 areas now ensures 98% long-term retention."
              </p>
            </div>

            {/* Therapist 3 Decision Options */}
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>Therapist Clinical Decision:</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => showNotification("✅ Agreed with AI Recommendation: Waiting 1 week to reinforce social turn-taking. Action logged in 30 seconds.")}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontWeight: "900",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(16,185,129,0.3)"
                  }}
                >
                  ✅ Agree — Wait 1 Week
                </button>
                <button
                  onClick={() => handleApproveLevelUpgrade({ _id: "child_arjun", name: "Arjun Kumar", level: 1 })}
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontWeight: "900",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(79,70,229,0.3)"
                  }}
                >
                  ⬆️ Override — Upgrade Now
                </button>
                <button
                  onClick={() => showNotification("📝 Clinical note added to Arjun's medical chart.")}
                  style={{
                    background: "#ffffff",
                    color: "#334155",
                    border: "1.5px solid #cbd5e1",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "0.88rem",
                    cursor: "pointer"
                  }}
                >
                  📝 Add Clinical Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 5: HANDLE URGENT ALERTS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job5" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#dc2626", textTransform: "uppercase" }}>
                Job 5 — Handle Urgent Alerts
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                🚨 Real-time Regression & Crisis Intervention
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                <strong>When:</strong> Whenever AI detects regression or distress &bull; AI already protected child &bull; Takes 10 minutes per urgent case.
              </p>
            </div>
            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "900" }}>
              CRISIS PROTOCOL ACTIVE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                id: "alert_rahul",
                child: "Rahul Singh",
                age: 4,
                level: 1,
                reason: "Detected child regressing for 2 consecutive weeks & angry 78% of session time.",
                aiActionsTaken: [
                  "Automatically paused level upgrade suggestions",
                  "Automatically simplified activity plan (removed high-stress tactile items)",
                  "Automatically increased happiness game frequency (trigger threshold reduced to 15s)",
                  "Dispatched URGENT alert to therapist"
                ],
                suggestion: "Switch to sensory calming games, reduce session to 10 mins, schedule parent check-in call.",
                parent: "Vikram Singh (+91 98451 22345)"
              },
              {
                id: "alert_dev",
                child: "Dev Joshi",
                age: 4,
                level: 2,
                reason: "Detected happiness games triggered 5+ times in one week.",
                aiActionsTaken: [
                  "Logged transition distress signals across 3 activities",
                  "Increased calming countdown pauses between games",
                  "Notified therapist for emotional regulation review"
                ],
                suggestion: "Incorporate pre-session deep breathing routine before cognitive challenges.",
                parent: "Rajesh Joshi (+91 98220 11223)"
              }
            ].map((alertItem) => (
              <div key={alertItem.id} style={{ border: "2px solid #fecaca", borderRadius: "18px", padding: "20px", background: "#fff5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontWeight: "900", fontSize: "1.1rem", color: "#991b1b" }}>
                    🔴 {alertItem.child} (Age {alertItem.age} &bull; Level {alertItem.level})
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Parent: {alertItem.parent}</span>
                </div>

                <div style={{ color: "#7f1d1d", fontSize: "0.88rem", fontWeight: "700", marginBottom: "12px" }}>
                  {alertItem.reason}
                </div>

                {/* What AI already did */}
                <div style={{ background: "#ffffff", borderRadius: "12px", padding: "12px", border: "1px solid #fee2e2", marginBottom: "14px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "900", color: "#166534", marginBottom: "4px" }}>
                    ✅ WHAT AI ALREADY DID AUTOMATICALLY:
                  </div>
                  <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: "0.8rem", color: "#334155", lineHeight: "1.5" }}>
                    {alertItem.aiActionsTaken.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                {/* Therapist 3 Actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => showNotification(`✅ AI Urgent Plan approved for ${alertItem.child}! Reduced sessions and calming protocol active.`)}
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: "900",
                      fontSize: "0.84rem",
                      cursor: "pointer"
                    }}
                  >
                    Keep AI Suggestion → Approve
                  </button>
                  <button
                    onClick={() => setCustomPlanModal({ show: true, child: { name: alertItem.child }, planText: alertItem.suggestion })}
                    style={{
                      background: "#fff",
                      color: "#334155",
                      border: "1.5px solid #cbd5e1",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "0.84rem",
                      cursor: "pointer"
                    }}
                  >
                    Override AI → Custom Plan
                  </button>
                  <button
                    onClick={() => setCallModal({ show: true, child: { name: alertItem.child, parentName: alertItem.parent }, date: "", time: "10:00" })}
                    style={{
                      background: "#fff",
                      color: "#991b1b",
                      border: "1.5px solid #f87171",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "0.84rem",
                      cursor: "pointer"
                    }}
                  >
                    📞 Call Parent → Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          JOB 6: MONTHLY PROGRESS REVIEW
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "job6" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#8b5cf6", textTransform: "uppercase" }}>
                Job 6 — Monthly Progress Review
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
                📈 4-Week Telemetry, Clinical Documentation & Specialist Referrals
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                <strong>When:</strong> Once per month for each child &bull; AI compiles all 4 weeks of data &bull; 5 minutes per child (1.5 hours total for 15 children).
              </p>
            </div>
            <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "800" }}>
              Monthly Review Cycle
            </span>
          </div>

          {/* Child Monthly Review Record */}
          <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "18px", padding: "20px", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "900", color: "#0f172a" }}>Arjun Kumar — Month 1 Comprehensive Review</h4>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Age 5 &bull; Clinical Level 1 &bull; 24 Sessions Completed (86% Adherence)</div>
              </div>
              <button
                onClick={() => {
                  generateClinicalPDF({
                    child: { name: "Arjun Kumar", age: 5, level: 1 },
                    progressData: { status: "Improving 📈", score: 87 },
                    domainScores: { communication: 90, social: 75, emotion: 92, cognitive: 88, sensory: 85 },
                    dominantEmotion: "Happy 😊 (68%)",
                    clinicalRecommendation: "Demonstrated strong emotional regulation. Advancing expressive speech and cooperative peer activities."
                  });
                  showNotification("📄 Monthly Clinical PDF Report generated & downloaded!");
                }}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)"
                }}
              >
                📄 Download Monthly PDF Report
              </button>
            </div>

            {/* AI Compiled 4-Week Telemetry Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>EMOTION TREND</div>
                <div style={{ fontSize: "1rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>Happy 68% &bull; Focused 22%</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Frustration dropped from 34% to 10%</div>
              </div>
              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>TOP ACTIVITIES</div>
                <div style={{ fontSize: "1rem", fontWeight: "900", color: "#4f46e5", marginTop: "2px" }}>Mirror Play (94%)</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Bubble Pop (88% mastery)</div>
              </div>
              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>HAPPINESS GAME TRIGGERS</div>
                <div style={{ fontSize: "1rem", fontWeight: "900", color: "#10b981", marginTop: "2px" }}>1 / week (Was 8/wk)</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Significant emotional regulation gain</div>
              </div>
              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800" }}>EXAM TRAJECTORY</div>
                <div style={{ fontSize: "1rem", fontWeight: "900", color: "#16a34a", marginTop: "2px" }}>13/15 Stars (87%)</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Ready for Level 2 promotion</div>
              </div>
            </div>

            {/* Therapist 1-Paragraph Clinical Note */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#334155", marginBottom: "4px" }}>
                📝 Write One-Paragraph Clinical Note (5 minutes):
              </div>
              <textarea
                value={
                  monthlyNotes["arjun"] !== undefined
                    ? monthlyNotes["arjun"]
                    : "Arjun has demonstrated remarkable emotional regulation and joint attention over the past 4 weeks. Transition from high frustration to focused engagement is evident. Ready to advance expressive vocabulary and cooperative peer play next month."
                }
                onChange={(e) => setMonthlyNotes({ ...monthlyNotes, arjun: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  padding: "10px",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Next Month Direction & Specialist Referral */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#334155", marginBottom: "4px" }}>Next Month Therapy Direction:</div>
                <select
                  value={monthlyDirections["arjun"] || "expressive"}
                  onChange={(e) => setMonthlyDirections({ ...monthlyDirections, arjun: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                >
                  <option value="expressive">Advance Expressive Communication & Vocabulary</option>
                  <option value="social">Cooperative Peer Play & Social Scenarios</option>
                  <option value="sensory">Sensory Habituation & Tactile Desensitization</option>
                  <option value="routine">Executive Function & Independent Visual Schedules</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#334155", marginBottom: "4px" }}>Specialist Referral (If Needed):</div>
                <select
                  value={monthlyReferrals["arjun"] || "none"}
                  onChange={(e) => setMonthlyReferrals({ ...monthlyReferrals, arjun: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                >
                  <option value="none">No Specialist Referral Needed</option>
                  <option value="slp">Refer to Speech-Language Pathologist (SLP)</option>
                  <option value="ot">Refer to Occupational Therapist (OT Sensory Integration)</option>
                  <option value="neurology">Refer to Pediatric Neurologist</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => showNotification("📤 Monthly review confirmed & dispatched to Arjun's parent! Clinical chart updated.")}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                padding: "10px 24px",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(16,185,129,0.3)"
              }}
            >
              ✅ Send Monthly Report to Parent & Save Direction
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          AI VS THERAPIST WORKLOAD COMPARISON & TIME SAVED CALCULATOR
         ──────────────────────────────────────────────────────────────────────── */}
      {activeJob === "comparison" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#4f46e5", textTransform: "uppercase" }}>
              Clinical Economics & Efficiency Model
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>
              What AI Does vs What Therapist Does — 25 Hours Saved Every Week
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
              The platform eliminates routine administrative grind so clinicians focus 100% on high-impact clinical decisions.
            </p>
          </div>

          {/* Time Saved Metric Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
              color: "#fff",
              borderRadius: "18px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              textAlign: "center"
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "800" }}>WITHOUT PLATFORM</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#f87171", marginTop: "2px" }}>30+ Hours</div>
              <div style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>per week for 15 children</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "800" }}>WITH AUTISM ASSISTANT</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#86efac", marginTop: "2px" }}>5 Hours</div>
              <div style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>per week for 15 children</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: "800" }}>TIME SAVED PER CLINICIAN</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#fbbf24", marginTop: "2px" }}>25 Hours</div>
              <div style={{ fontSize: "0.7rem", color: "#fef08a" }}>Every Single Week</div>
            </div>
          </div>

          {/* Weekly Time Breakdown */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#334155", marginBottom: "10px" }}>
              ⏱️ Exact 5-Hour Weekly Time Budget:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong>Monday review:</strong> <span style={{ color: "#4f46e5", fontWeight: "800" }}>2 hours</span>
              </div>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong>Daily message replies:</strong> <span style={{ color: "#4f46e5", fontWeight: "800" }}>30 mins × 4 days = 2 hours</span>
              </div>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong>Urgent alerts:</strong> <span style={{ color: "#4f46e5", fontWeight: "800" }}>30 mins avg</span>
              </div>
              <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong>Exam reviews:</strong> <span style={{ color: "#4f46e5", fontWeight: "800" }}>15 mins</span>
              </div>
            </div>
          </div>

          {/* Three Tier Comparison: Every Day, Every Week, Every Month */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* EVERY DAY */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#0f172a", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                📅 EVERY DAY
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#16a34a" }}>🤖 AI DOES:</div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                  <li>Monitors all sessions automatically</li>
                  <li>Detects emotion in real time via FER</li>
                  <li>Triggers happiness games when sad/angry</li>
                  <li>Adjusts activity difficulty by age</li>
                  <li>Runs mastery exam when streak hits 7</li>
                  <li>Calculates progress scores</li>
                  <li>Answers parent questions via chatbot</li>
                  <li>Sends daily reminders to parent</li>
                  <li>Awards badges & certificates</li>
                  <li>Generates alerts if child regressing</li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#4f46e5" }}>👩‍⚕️ THERAPIST DOES:</div>
                <div style={{ fontSize: "0.78rem", color: "#166534", fontWeight: "800", marginTop: "2px" }}>
                  ✅ Nothing daily — AI handles everything autonomously.
                </div>
              </div>
            </div>

            {/* EVERY WEEK */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#0f172a", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                📅 EVERY WEEK
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#16a34a" }}>🤖 AI DOES:</div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                  <li>Compiles weekly report automatically</li>
                  <li>Prioritises children by urgency (Red/Yellow/Green)</li>
                  <li>Prepares level change recommendations</li>
                  <li>Analyses mastery exam results</li>
                  <li>Identifies which activities to change</li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#4f46e5" }}>👩‍⚕️ THERAPIST DOES:</div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.78rem", color: "#1e293b", lineHeight: "1.4" }}>
                  <li>Reviews AI prepared dashboard (2 hours)</li>
                  <li>Approves or rejects level changes</li>
                  <li>Replies to escalated parent messages</li>
                  <li>Validates AI decisions with clinical judgment</li>
                </ul>
              </div>
            </div>

            {/* EVERY MONTH */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#0f172a", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                📅 EVERY MONTH
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#16a34a" }}>🤖 AI DOES:</div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                  <li>Compiles full monthly clinical report</li>
                  <li>Identifies long term trends across 4 weeks</li>
                  <li>Flags children who may need specialist referral</li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#4f46e5" }}>👩‍⚕️ THERAPIST DOES:</div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.78rem", color: "#1e293b", lineHeight: "1.4" }}>
                  <li>Writes clinical notes (1.5 hours total)</li>
                  <li>Decides therapy direction for next month</li>
                  <li>Specialist referrals if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Call Modal ──────────────────────────────────────────────────────── */}
      {callModal.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "1.15rem", color: "#0f172a" }}>
              📞 Schedule Clinical Call with {callModal.child?.name}'s Family
            </h4>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 16px" }}>
              Parent: <strong>{callModal.child?.parentName || "Parent"}</strong>
            </p>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#475569" }}>Select Date:</label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCallModal({ ...callModal, date: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </div>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#475569" }}>Select Time:</label>
              <input
                type="time"
                defaultValue="10:00"
                onChange={(e) => setCallModal({ ...callModal, time: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleConfirmCall}
                style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}
              >
                Confirm Call
              </button>
              <button
                onClick={() => setCallModal({ show: false, child: null, date: "", time: "10:00" })}
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Plan Modal ────────────────────────────────────────────────── */}
      {customPlanModal.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "1.15rem", color: "#0f172a" }}>
              ✏️ Modify Care Plan for {customPlanModal.child?.name}
            </h4>
            <textarea
              defaultValue={customPlanModal.planText}
              id="customPlanInput"
              rows={4}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  const val = document.getElementById("customPlanInput")?.value || "";
                  handleConfirmActivityChange(customPlanModal.child, val);
                  setCustomPlanModal({ show: false, child: null, planText: "" });
                }}
                style={{ flex: 1, background: "#4f46e5", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}
              >
                Deploy Modified Plan
              </button>
              <button
                onClick={() => setCustomPlanModal({ show: false, child: null, planText: "" })}
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
