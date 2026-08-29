const Session = require("../models/Session");
const ActivityLog = require("../models/ActivityLog");
const Activity = require("../models/Activity");

// Helper to get ISO week number
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

// ── 1. Calculate Real Dynamic Streak & Monthly Activity ────────────────────────
const calculateStreakAndMonthlyActivity = async (childId) => {
  try {
    const sessions = await Session.find({ child: childId }).sort({ completedAt: 1 }).lean();
    const logs = await ActivityLog.find({ child: childId }).sort({ completedAt: 1 }).lean();

    const dateMap = {}; // "YYYY-MM-DD" -> count of activities

    const recordDate = (d) => {
      if (!d) return;
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return;
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      dateMap[key] = (dateMap[key] || 0) + 1;
    };

    sessions.forEach((s) => recordDate(s.completedAt || s.createdAt));
    logs.forEach((l) => recordDate(l.completedAt || l.createdAt));

    const sortedDates = Object.keys(dateMap).sort();
    const totalActiveDays = sortedDates.length;

    // Calculate current streak
    const today = new Date();
    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatYMD(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatYMD(yesterday);

    let currentStreak = 0;
    let checkDate = new Date(today);

    // If active today, start from today. If not active today but active yesterday, start from yesterday.
    if (dateMap[todayStr]) {
      checkDate = new Date(today);
    } else if (dateMap[yesterdayStr]) {
      checkDate = new Date(yesterday);
    } else {
      checkDate = null;
    }

    if (checkDate) {
      while (true) {
        const key = formatYMD(checkDate);
        if (dateMap[key]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak calculation
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDateObj = null;

    sortedDates.forEach((dStr) => {
      const curDateObj = new Date(dStr);
      if (prevDateObj) {
        const diffDays = Math.round((curDateObj - prevDateObj) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDateObj = curDateObj;
    });

    // Current month calendar metadata
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthName = today.toLocaleString("default", { month: "long" });

    const currentMonthDays = [];
    let activeDaysThisMonthCount = 0;

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = dateMap[dayStr] || 0;
      if (count > 0) activeDaysThisMonthCount++;
      currentMonthDays.push({
        day,
        date: dayStr,
        isActive: count > 0,
        activityCount: count,
        isToday: dayStr === todayStr,
      });
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalActiveDays,
      activeDates: sortedDates,
      monthCalendar: {
        year: currentYear,
        monthName,
        monthNumber: currentMonth + 1,
        totalDays: daysInCurrentMonth,
        activeDaysCount: activeDaysThisMonthCount,
        days: currentMonthDays,
      },
    };
  } catch (err) {
    console.error("calculateStreakAndMonthlyActivity error:", err);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      activeDates: [],
      monthCalendar: {
        year: new Date().getFullYear(),
        monthName: new Date().toLocaleString("default", { month: "long" }),
        monthNumber: new Date().getMonth() + 1,
        totalDays: 30,
        activeDaysCount: 0,
        days: [],
      },
    };
  }
};

// ── 2. Progress Tracking Calculations (Dynamic with NO Hardcoded Dummy Scores) ─
const calculateProgressStatus = async (childId) => {
  try {
    const sessions = await Session.find({ child: childId })
      .sort({ completedAt: -1 })
      .limit(100)
      .lean();

    const logs = await ActivityLog.find({ child: childId })
      .sort({ completedAt: -1 })
      .limit(100)
      .lean();

    const allRecords = [
      ...sessions.map((s) => ({
        score: s.score <= 5 ? s.score * 20 : s.score,
        completedAt: s.completedAt || s.createdAt,
      })),
      ...logs.map((l) => ({
        score: l.performanceScore,
        completedAt: l.completedAt || l.createdAt,
      })),
    ];

    if (allRecords.length === 0) {
      return {
        status: "Collecting Data",
        weeksStable: 0,
        weeksRegressing: 0,
        latestAvg: null,
        previousAvg: null,
        diff: 0,
        totalSessions: 0,
        hasData: false,
        weekAverages: [
          { week: "Week 1", score: null, hasData: false, sessionsCount: 0 },
          { week: "Week 2", score: null, hasData: false, sessionsCount: 0 },
          { week: "Week 3", score: null, hasData: false, sessionsCount: 0 },
          { week: "Current", score: null, hasData: false, sessionsCount: 0 },
        ],
      };
    }

    // Group into 4 weekly buckets
    const now = new Date().getTime();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const weekScores = { 0: [], 1: [], 2: [], 3: [] };

    allRecords.forEach((r) => {
      const diffMs = now - new Date(r.completedAt).getTime();
      const weekIndex = Math.floor(diffMs / oneWeekMs);
      if (weekIndex >= 0 && weekIndex <= 3) {
        weekScores[weekIndex].push(r.score);
      }
    });

    const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    const w0Avg = avg(weekScores[0]);
    const w1Avg = avg(weekScores[1]);
    const w2Avg = avg(weekScores[2]);
    const w3Avg = avg(weekScores[3]);

    // Find the latest available week average
    const latest = w0Avg !== null ? w0Avg : (w1Avg !== null ? w1Avg : (w2Avg !== null ? w2Avg : w3Avg));
    // Find the previous available week average
    const previous = w0Avg !== null ? w1Avg : (w1Avg !== null ? w2Avg : w3Avg);

    let status = "Stable";
    let diff = 0;
    if (latest !== null && previous !== null) {
      diff = latest - previous;
      if (diff >= 5) status = "Improving";
      else if (diff <= -5) status = "Regressing";
    } else if (latest !== null) {
      status = "Stable";
    } else {
      status = "Collecting Data";
    }

    let weeksRegressing = 0;
    if (w0Avg !== null && w1Avg !== null && w0Avg < w1Avg) weeksRegressing++;
    if (w1Avg !== null && w2Avg !== null && w1Avg < w2Avg) weeksRegressing++;
    if (w2Avg !== null && w3Avg !== null && w2Avg < w3Avg) weeksRegressing++;

    let weeksStable = 1;
    if (w0Avg !== null && w1Avg !== null && Math.abs(w0Avg - w1Avg) < 5) weeksStable++;
    if (w1Avg !== null && w2Avg !== null && Math.abs(w1Avg - w2Avg) < 5) weeksStable++;

    return {
      status,
      latestAvg: latest,
      previousAvg: previous,
      diff: Math.round(diff * 10) / 10,
      weeksRegressing,
      weeksStable,
      totalSessions: allRecords.length,
      hasData: true,
      weekAverages: [
        { week: "Week 1", score: w3Avg, hasData: w3Avg !== null, sessionsCount: weekScores[3].length },
        { week: "Week 2", score: w2Avg, hasData: w2Avg !== null, sessionsCount: weekScores[2].length },
        { week: "Week 3", score: w1Avg, hasData: w1Avg !== null, sessionsCount: weekScores[1].length },
        { week: "Current", score: w0Avg !== null ? w0Avg : latest, hasData: w0Avg !== null || latest !== null, sessionsCount: weekScores[0].length },
      ],
    };
  } catch (err) {
    console.error("calculateProgressStatus error:", err);
    return {
      status: "Collecting Data",
      weeksStable: 0,
      weeksRegressing: 0,
      latestAvg: null,
      previousAvg: null,
      diff: 0,
      totalSessions: 0,
      hasData: false,
      weekAverages: [
        { week: "Week 1", score: null, hasData: false, sessionsCount: 0 },
        { week: "Week 2", score: null, hasData: false, sessionsCount: 0 },
        { week: "Week 3", score: null, hasData: false, sessionsCount: 0 },
        { week: "Current", score: null, hasData: false, sessionsCount: 0 },
      ],
    };
  }
};

// ── 3. Calculate Real Dynamic Domain Scores ────────────────────────────────────
const calculateDomainScores = async (childId) => {
  try {
    const sessions = await Session.find({ child: childId })
      .populate("activity")
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    const logs = await ActivityLog.find({ child: childId })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    const domains = {
      communication: [],
      social: [],
      sensory: [],
      motor: [],
      cognitive: [],
    };

    sessions.forEach((s) => {
      const category = s.activity?.category?.toLowerCase() || "";
      const score = s.score <= 5 ? s.score * 20 : s.score;
      if (category.includes("communication") || category.includes("talk") || category.includes("speech")) domains.communication.push(score);
      else if (category.includes("social") || category.includes("friend")) domains.social.push(score);
      else if (category.includes("sensory")) domains.sensory.push(score);
      else if (category.includes("motor") || category.includes("move")) domains.motor.push(score);
      else if (category.includes("cognitive") || category.includes("think")) domains.cognitive.push(score);
      else domains.communication.push(score);
    });

    logs.forEach((l) => {
      const actStr = String(l.activity).toLowerCase();
      const score = l.performanceScore;
      if (actStr.includes("comm") || actStr.includes("talk") || actStr.includes("speech")) domains.communication.push(score);
      else if (actStr.includes("soc") || actStr.includes("friend")) domains.social.push(score);
      else if (actStr.includes("sens")) domains.sensory.push(score);
      else if (actStr.includes("mot") || actStr.includes("move")) domains.motor.push(score);
      else if (actStr.includes("cogn") || actStr.includes("think")) domains.cognitive.push(score);
      else domains.cognitive.push(score);
    });

    const avg = (arr) => {
      if (!arr || arr.length === 0) return { score: null, hasData: false, count: 0 };
      return {
        score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        hasData: true,
        count: arr.length,
      };
    };

    return {
      communication: avg(domains.communication),
      social: avg(domains.social),
      sensory: avg(domains.sensory),
      motor: avg(domains.motor),
      cognitive: avg(domains.cognitive),
    };
  } catch (err) {
    console.error("calculateDomainScores error:", err);
    return {
      communication: { score: null, hasData: false, count: 0 },
      social: { score: null, hasData: false, count: 0 },
      sensory: { score: null, hasData: false, count: 0 },
      motor: { score: null, hasData: false, count: 0 },
      cognitive: { score: null, hasData: false, count: 0 },
    };
  }
};

// ── 4. Calculate Real Dynamic Emotion Distribution ───────────────────────────
const calculateEmotionData = async (childId) => {
  try {
    const sessions = await Session.find({
      child: childId,
      emotion: { $exists: true, $ne: null },
    })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    if (sessions.length === 0) {
      return {
        hasData: false,
        dominant: "No data yet",
        distribution: [],
        totalRecorded: 0,
      };
    }

    const emotions = { happy: 0, neutral: 0, curious: 0, sad: 0, frustrated: 0, anxious: 0 };

    sessions.forEach((s) => {
      const e = (s.emotion || "").toLowerCase();
      if (e.includes("happy") || e.includes("joy") || e.includes("smile")) emotions.happy++;
      else if (e.includes("neutral") || e.includes("calm") || e.includes("focus")) emotions.neutral++;
      else if (e.includes("surprise") || e.includes("curious")) emotions.curious++;
      else if (e.includes("sad") || e.includes("down") || e.includes("cry")) emotions.sad++;
      else if (e.includes("frustrat") || e.includes("angry")) emotions.frustrated++;
      else if (e.includes("fear") || e.includes("anxious") || e.includes("worry")) emotions.anxious++;
      else emotions.neutral++;
    });

    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return {
        hasData: false,
        dominant: "No data yet",
        distribution: [],
        totalRecorded: 0,
      };
    }

    const data = [
      { emotion: "Happy 😊", count: emotions.happy, percentage: Math.round((emotions.happy / total) * 100), color: "#22c55e" },
      { emotion: "Neutral 😐", count: emotions.neutral, percentage: Math.round((emotions.neutral / total) * 100), color: "#3b82f6" },
      { emotion: "Curious 😲", count: emotions.curious, percentage: Math.round((emotions.curious / total) * 100), color: "#eab308" },
      { emotion: "Sad 😢", count: emotions.sad, percentage: Math.round((emotions.sad / total) * 100), color: "#64748b" },
      { emotion: "Frustrated 😠", count: emotions.frustrated, percentage: Math.round((emotions.frustrated / total) * 100), color: "#ef4444" },
      { emotion: "Anxious 😨", count: emotions.anxious, percentage: Math.round((emotions.anxious / total) * 100), color: "#8b5cf6" },
    ]
      .filter((item) => item.count > 0)
      .sort((a, b) => b.percentage - a.percentage);

    const dominant = data.length > 0 ? data[0].emotion : "Neutral 😐";

    return {
      hasData: true,
      distribution: data,
      dominant,
      totalRecorded: total,
    };
  } catch (err) {
    console.error("calculateEmotionData error:", err);
    return {
      hasData: false,
      dominant: "No data yet",
      distribution: [],
      totalRecorded: 0,
    };
  }
};

module.exports = {
  getWeekNumber,
  calculateStreakAndMonthlyActivity,
  calculateProgressStatus,
  calculateDomainScores,
  calculateEmotionData,
};
