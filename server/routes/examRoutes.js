const express = require("express");
const router = express.Router();
const Child = require("../models/Child");
const ExamResult = require("../models/ExamResult");
const { verifyToken } = require("../middleware/auth");

// Helper: Calculate age group (1: 2-5 yrs, 2: 5-8 yrs, 3: 9-12 yrs)
const getAgeGroupNum = (age) => {
  const numAge = Number(age) || 6;
  if (numAge <= 5) return 1;
  if (numAge <= 8) return 2;
  return 3;
};

// Helper: Helper for most frequent item
const getMostFrequent = (arr) => {
  if (!arr || arr.length === 0) return "Neutral";
  const counts = {};
  let maxCount = 0;
  let maxItem = arr[0];
  arr.forEach((item) => {
    if (!item) return;
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] > maxCount) {
      maxCount = counts[item];
      maxItem = item;
    }
  });
  return maxItem;
};

// Analyse Exam Result & Recommendation Generator
const analyseExamResult = (answers, child) => {
  const totalQuestions = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const score = Math.round((correct / (totalQuestions || 1)) * 100);

  // Domain breakdown calculation
  const domains = {
    communication: { correct: 0, total: 0 },
    social: { correct: 0, total: 0 },
    emotion: { correct: 0, total: 0 },
    cognitive: { correct: 0, total: 0 },
    sensory: { correct: 0, total: 0 },
  };

  answers.forEach((a) => {
    const domKey = (a.domain || "communication").toLowerCase();
    if (!domains[domKey]) {
      domains[domKey] = { correct: 0, total: 0 };
    }
    domains[domKey].total++;
    if (a.isCorrect) domains[domKey].correct++;
  });

  // Exam result decision
  let result, recommendation;
  const childName = child?.name || "Child";
  const currentLevel = Number(child?.level) || 2;

  if (score >= 80) {
    result = "PASSED";
    recommendation =
      currentLevel > 1
        ? `Excellent! ${childName} scored ${score}% and is ready to move to Level ${currentLevel - 1}. Therapist will review and confirm.`
        : `Outstanding! ${childName} scored ${score}% and is mastering Level 1 activities!`;
  } else if (score >= 60) {
    result = "PARTIAL";
    // Find weakest domain
    const sortedDomains = Object.entries(domains)
      .filter(([_, d]) => d.total > 0)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total);
    const weakDomainName = sortedDomains[0] ? sortedDomains[0][0] : "social skills";
    const formattedDomain = weakDomainName.charAt(0).toUpperCase() + weakDomainName.slice(1);
    recommendation = `Good effort! ${childName} scored ${score}% and needs more practice in ${formattedDomain}. Continue Level ${currentLevel} with extra focus on this area.`;
  } else {
    result = "NEEDS_WORK";
    recommendation = `Keep practicing! ${childName} scored ${score}% and is still building core skills. Continue current activities and try the exam again next week.`;
  }

  const emotionsList = answers.map((a) => a.emotionDuringQuestion).filter(Boolean);
  const dominantEmotion = getMostFrequent(emotionsList);

  return {
    score,
    correct,
    total: totalQuestions,
    result,
    recommendation,
    domains,
    dominantEmotion,
    passedExam: score >= 80,
    examDate: new Date(),
    nextExamDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION POOL  –  organised by domain, with ageGroup variants where needed.
// Each call to generateExamQuestions() randomly samples 7 unique questions so
// every exam is different.  All question objects keep the same shape already
// consumed by the frontend.
// ─────────────────────────────────────────────────────────────────────────────

/** Shuffle an array in-place using Fisher-Yates and return it. */
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ── EMOTION QUESTIONS (EmotionIdentifyQuestion / EmotionCausePairQuestion) ───

const EMOTION_POOL = {
  1: [
    // ageGroup 1 – ages 2-5 (simple emoji, 2 options)
    {
      id: "em1_ag1",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Look at the face and pick the correct feeling.",
      promptKn: "ಮುಖ ನೋಡಿ ಸರಿಯಾದ ಭಾವನೆ ಆಯ್ಕೆ ಮಾಡಿ.",
      currentEmotion: { emoji: "😊", name: "happy" },
      options: [
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: true },
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: false },
      ],
    },
    {
      id: "em2_ag1",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "What feeling does this face show?",
      promptKn: "ಈ ಮುಖ ಯಾವ ಭಾವನೆ ತೋರಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😢", name: "sad" },
      options: [
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em3_ag1",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You got a yummy birthday cake 🎂. How do you feel?",
      promptKn: "ನಿಮಗೆ ಜನ್ಮದಿನದ ಕೇಕ್ ಸಿಕ್ಕಿದೆ 🎂. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: true },
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: false },
      ],
    },
    {
      id: "em4_ag1",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Your balloon flew away 🎈. How do you feel?",
      promptKn: "ನಿಮ್ಮ ಬಲೂನ್ ಹಾರಿ ಹೋಯಿತು 🎈. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em5_ag1",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "What feeling does this face show?",
      promptKn: "ಈ ಮುಖ ಯಾವ ಭಾವನೆ ತೋರಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😡", name: "angry" },
      options: [
        { id: "angry", textEn: "Angry 😡", textKn: "ಕೋಪ 😡", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em6_ag1",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "A big dog barked loudly at you 🐕. How do you feel?",
      promptKn: "ದೊಡ್ಡ ನಾಯಿ ನಿಮ್ಮ ಮೇಲೆ ಜೋರಾಗಿ ಬೊಗಳಿತು 🐕. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em7_ag1",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Which face shows a happy child?",
      promptKn: "ಯಾವ ಮುಖ ಸಂತೋಷದ ಮಗುವನ್ನು ತೋರಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😀", name: "happy" },
      options: [
        { id: "happy", textEn: "This one 😀", textKn: "ಇದು 😀", correct: true },
        { id: "sad", textEn: "This one 😭", textKn: "ಇದು 😭", correct: false },
      ],
    },
    {
      id: "em8_ag1",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Your friend shared their snack with you 🍪. How do you feel?",
      promptKn: "ನಿಮ್ಮ ಸ್ನೇಹಿತ ಅವರ ತಿಂಡಿ ಹಂಚಿಕೊಂಡರು 🍪. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: true },
        { id: "angry", textEn: "Angry 😡", textKn: "ಕೋಪ 😡", correct: false },
      ],
    },
    {
      id: "em9_ag1",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "This child is scared. Which emoji matches?",
      promptKn: "ಈ ಮಗು ಭಯಗೊಂಡಿದೆ. ಯಾವ ಎಮೋಜಿ ಹೊಂದುತ್ತದೆ?",
      currentEmotion: { emoji: "😨", name: "scared" },
      options: [
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: true },
        { id: "angry", textEn: "Angry 😡", textKn: "ಕೋಪ 😡", correct: false },
      ],
    },
    {
      id: "em10_ag1",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You fell down and hurt your knee 🤕. How do you feel?",
      promptKn: "ನೀವು ಬಿದ್ದು ಮೊಣಕಾಲಿಗೆ ಪೆಟ್ಟಾಯಿತು 🤕. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "sad", textEn: "Sad / in pain 😢", textKn: "ದುಃಖ / ನೋವು 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
  ],
  2: [
    // ageGroup 2 – ages 5-8 (moderate, 3-4 options)
    {
      id: "em1_ag2",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Look at the facial expression. What emotion does this person feel?",
      promptKn: "ಮುಖದ ಅಭಿವ್ಯಕ್ತಿ ನೋಡಿ. ಈ ವ್ಯಕ್ತಿಗೆ ಯಾವ ಭಾವನೆ ಅನ್ನಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😲", name: "surprised" },
      options: [
        { id: "surprised", textEn: "Surprised 😲", textKn: "ಅಚ್ಚರಿ 😲", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: false },
      ],
    },
    {
      id: "em2_ag2",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Which emotion does this face show?",
      promptKn: "ಈ ಮುಖ ಯಾವ ಭಾವನೆ ತೋರಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😠", name: "angry" },
      options: [
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: false },
      ],
    },
    {
      id: "em3_ag2",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Your favorite toy broke 💔. How do you feel?",
      promptKn: "ನಿಮ್ಮ ನೆಚ್ಚಿನ ಆಟಿಕೆ ಮುರಿದುಹೋಯಿತು 💔. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: false },
      ],
    },
    {
      id: "em4_ag2",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Someone said something mean to you at school 😞. How do you feel?",
      promptKn: "ಶಾಲೆಯಲ್ಲಿ ಯಾರೋ ನಿಮ್ಮನ್ನು ಕೆಟ್ಟದಾಗಿ ಮಾತನಾಡಿಸಿದರು 😞. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "hurt", textEn: "Hurt / sad 😢", textKn: "ನೋವು / ದುಃಖ 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "proud", textEn: "Proud 🌟", textKn: "ಹೆಮ್ಮೆ 🌟", correct: false },
      ],
    },
    {
      id: "em5_ag2",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "What emotion is this child showing?",
      promptKn: "ಈ ಮಗು ಯಾವ ಭಾವನೆ ತೋರಿಸುತ್ತಿದೆ?",
      currentEmotion: { emoji: "😄", name: "excited" },
      options: [
        { id: "excited", textEn: "Excited 😄", textKn: "ಉತ್ಸಾಹ 😄", correct: true },
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: false },
        { id: "bored", textEn: "Bored 😑", textKn: "ಬೋರ್ 😑", correct: false },
      ],
    },
    {
      id: "em6_ag2",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You won first prize in a race 🏆. How do you feel?",
      promptKn: "ನೀವು ಓಟದಲ್ಲಿ ಮೊದಲ ಬಹುಮಾನ ಗೆದ್ದಿರಿ 🏆. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "proud", textEn: "Proud and happy 🌟😊", textKn: "ಹೆಮ್ಮೆ ಮತ್ತು ಸಂತೋಷ 🌟😊", correct: true },
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: false },
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: false },
      ],
    },
    {
      id: "em7_ag2",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Your best friend is moving away to a different city 🚚. How do you feel?",
      promptKn: "ನಿಮ್ಮ ಆತ್ಮೀಯ ಸ್ನೇಹಿತ ಬೇರೆ ನಗರಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದಾನೆ 🚚. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "sad", textEn: "Sad 😢", textKn: "ದುಃಖ 😢", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
      ],
    },
    {
      id: "em8_ag2",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "What does this face express?",
      promptKn: "ಈ ಮುಖ ಏನನ್ನು ವ್ಯಕ್ತಪಡಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😔", name: "disappointed" },
      options: [
        { id: "disappointed", textEn: "Disappointed 😔", textKn: "ನಿರಾಶ 😔", correct: true },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
        { id: "excited", textEn: "Excited 😄", textKn: "ಉತ್ಸಾಹ 😄", correct: false },
      ],
    },
    {
      id: "em9_ag2",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You accidentally knocked over someone's drink ☕. You feel …",
      promptKn: "ನೀವು ಆಕಸ್ಮಿಕವಾಗಿ ಯಾರದ್ದಾದರೂ ಪಾನೀಯ ಚೆಲ್ಲಿಸಿದಿರಿ ☕. ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ …",
      options: [
        { id: "sorry", textEn: "Sorry / guilty 😟", textKn: "ಕ್ಷಮೆ / ತಪ್ಪಿತ 😟", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "proud", textEn: "Proud 🌟", textKn: "ಹೆಮ್ಮೆ 🌟", correct: false },
      ],
    },
    {
      id: "em10_ag2",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Facial Emotion",
      titleKn: "ಮುಖದ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "This person just heard very surprising news. What do they feel?",
      promptKn: "ಈ ವ್ಯಕ್ತಿಗೆ ತುಂಬಾ ಆಶ್ಚರ್ಯದ ಸುದ್ದಿ ತಿಳಿಯಿತು. ಅವರಿಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      currentEmotion: { emoji: "😮", name: "surprised" },
      options: [
        { id: "surprised", textEn: "Surprised 😮", textKn: "ಅಚ್ಚರಿ 😮", correct: true },
        { id: "bored", textEn: "Bored 😑", textKn: "ಬೋರ್ 😑", correct: false },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
      ],
    },
  ],
  3: [
    // ageGroup 3 – ages 9-12 (complex scenarios)
    {
      id: "em1_ag3",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Complex Emotion",
      titleKn: "ಸಂಕೀರ್ಣ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Look at the facial expression and choose the correct emotion.",
      promptKn: "ಮುಖದ ಅಭಿವ್ಯಕ್ತಿ ನೋಡಿ ಸರಿಯಾದ ಭಾವನೆ ಆಯ್ಕೆ ಮಾಡಿ.",
      currentEmotion: { emoji: "😏", name: "proud" },
      options: [
        { id: "proud", textEn: "Proud 😏", textKn: "ಹೆಮ್ಮೆ 😏", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "smug", textEn: "Smug 😒", textKn: "ಆತ್ಮ-ತೃಪ್ತಿ 😒", correct: false },
      ],
    },
    {
      id: "em2_ag3",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Complex Emotion",
      titleKn: "ಸಂಕೀರ್ಣ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Identify the emotion shown:",
      promptKn: "ತೋರಿಸಲಾದ ಭಾವನೆಯನ್ನು ಗುರುತಿಸಿ:",
      currentEmotion: { emoji: "😳", name: "embarrassed" },
      options: [
        { id: "embarrassed", textEn: "Embarrassed 😳", textKn: "ನಾಚಿಕೆ 😳", correct: true },
        { id: "surprised", textEn: "Surprised 😲", textKn: "ಅಚ್ಚರಿ 😲", correct: false },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
      ],
    },
    {
      id: "em3_ag3",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You studied hard 📚 and achieved a great exam score! How would you feel and how would your parent feel?",
      promptKn: "ನೀವು ಕಷ್ಟಪಟ್ಟು ಅಭ್ಯಾಸ ಮಾಡಿ ಉತ್ತಮ ಅಂಕ ಗಳಿಸಿದ್ದೀರಿ! ನಿಮಗೆ ಮತ್ತು ನಿಮ್ಮ ಪೋಷಕರಿಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "proud_parent_proud", textEn: "You: Proud 🌟 / Parent: Proud ❤️", textKn: "ನೀವು: ಹೆಮ್ಮೆ 🌟 / ಪೋಷಕರು: ಹೆಮ್ಮೆ ❤️", correct: true },
        { id: "sad_parent_angry", textEn: "You: Sad / Parent: Angry", textKn: "ನೀವು: ದುಃಖ / ಪೋಷಕರು: ಕೋಪ", correct: false },
        { id: "worried_parent_sad", textEn: "You: Worried / Parent: Sad", textKn: "ನೀವು: ಚಿಂತೆ / ಪೋಷಕರು: ದುಃಖ", correct: false },
      ],
    },
    {
      id: "em4_ag3",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "A friend told a secret you shared with them to the whole class 🗣️. What do you feel?",
      promptKn: "ನಿಮ್ಮ ಸ್ನೇಹಿತ ನೀವು ಹಂಚಿಕೊಂಡ ರಹಸ್ಯವನ್ನು ಇಡೀ ತರಗತಿಗೆ ಹೇಳಿಬಿಟ್ಟ 🗣️. ನಿಮಗೆ ಏನು ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "betrayed", textEn: "Betrayed and hurt 😤", textKn: "ದ್ರೋಹ ಮತ್ತು ನೋವು 😤", correct: true },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
        { id: "proud", textEn: "Proud 🌟", textKn: "ಹೆಮ್ಮೆ 🌟", correct: false },
      ],
    },
    {
      id: "em5_ag3",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Complex Emotion",
      titleKn: "ಸಂಕೀರ್ಣ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Someone achieved something you also wanted. You feel mixed happiness for them but also a little envious. Which emotion fits best?",
      promptKn: "ನಿಮಗೂ ಬೇಕಿದ್ದದ್ದನ್ನು ಯಾರೋ ಸಾಧಿಸಿದರು. ನಿಮಗೆ ಅವರ ಸಂತೋಷ ಮಿಶ್ರಿತ ಅಸೂಯೆ ಅನ್ನಿಸುತ್ತದೆ. ಯಾವ ಭಾವನೆ ಸರಿ?",
      currentEmotion: { emoji: "😒", name: "envious" },
      options: [
        { id: "envious", textEn: "Envious 😒", textKn: "ಅಸೂಯೆ 😒", correct: true },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em6_ag3",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You made a mistake in front of everyone 🙈. Which feelings might you experience together?",
      promptKn: "ನೀವು ಎಲ್ಲರ ಮುಂದೆ ತಪ್ಪು ಮಾಡಿದಿರಿ 🙈. ಒಟ್ಟಾಗಿ ಯಾವ ಭಾವನೆಗಳನ್ನು ಅನುಭವಿಸಬಹುದು?",
      options: [
        { id: "embarrassed_and_sad", textEn: "Embarrassed and sad 😳😢", textKn: "ನಾಚಿಕೆ ಮತ್ತು ದುಃಖ 😳😢", correct: true },
        { id: "happy", textEn: "Only happy 😊", textKn: "ಕೇವಲ ಸಂತೋಷ 😊", correct: false },
        { id: "excited", textEn: "Excited 😄", textKn: "ಉತ್ಸಾಹ 😄", correct: false },
      ],
    },
    {
      id: "em7_ag3",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Complex Emotion",
      titleKn: "ಸಂಕೀರ್ಣ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "A character is worried about something that might happen later. What emotion are they feeling?",
      promptKn: "ಒಬ್ಬ ಪಾತ್ರ ಮುಂದೆ ಏನಾಗಬಹುದು ಎಂದು ಚಿಂತಿಸುತ್ತಿದೆ. ಅವರಿಗೆ ಯಾವ ಭಾವನೆ ಆಗುತ್ತಿದೆ?",
      currentEmotion: { emoji: "😟", name: "anxious" },
      options: [
        { id: "anxious", textEn: "Anxious / worried 😟", textKn: "ಆತಂಕ / ಚಿಂತೆ 😟", correct: true },
        { id: "bored", textEn: "Bored 😑", textKn: "ಬೋರ್ 😑", correct: false },
        { id: "happy", textEn: "Happy 😊", textKn: "ಸಂತೋಷ 😊", correct: false },
      ],
    },
    {
      id: "em8_ag3",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "You helped an elderly neighbour carry their groceries 🛒. How do you feel after?",
      promptKn: "ನೀವು ವೃದ್ಧ ನೆರೆಯವರಿಗೆ ದಿನಸಿ ಸಾಮಗ್ರಿ ಒಯ್ಯಲು ಸಹಾಯ ಮಾಡಿದಿರಿ 🛒. ನಂತರ ನಿಮಗೆ ಹೇಗೆ ಅನ್ನಿಸುತ್ತದೆ?",
      options: [
        { id: "fulfilled", textEn: "Fulfilled and proud 🌟", textKn: "ತೃಪ್ತ ಮತ್ತು ಹೆಮ್ಮೆ 🌟", correct: true },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
        { id: "scared", textEn: "Scared 😨", textKn: "ಭಯ 😨", correct: false },
      ],
    },
    {
      id: "em9_ag3",
      type: "EmotionCausePairQuestion",
      domain: "emotion",
      promptEn: "Your project did not turn out the way you wanted despite working hard on it 😞. What combination of emotions might you feel?",
      promptKn: "ನೀವು ಕಷ್ಟಪಟ್ಟರೂ ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ ನಿಮ್ಮ ನಿರೀಕ್ಷೆಗೆ ತಕ್ಕಂತೆ ಆಗಲಿಲ್ಲ 😞. ನಿಮಗೆ ಯಾವ ಮಿಶ್ರ ಭಾವನೆ ಆಗಬಹುದು?",
      options: [
        { id: "frustrated_and_sad", textEn: "Frustrated and sad 😤😢", textKn: "ಅಸಮಾಧಾನ ಮತ್ತು ದುಃಖ 😤😢", correct: true },
        { id: "happy", textEn: "Very happy 😊", textKn: "ತುಂಬಾ ಸಂತೋಷ 😊", correct: false },
        { id: "proud", textEn: "Proud 🌟", textKn: "ಹೆಮ್ಮೆ 🌟", correct: false },
      ],
    },
    {
      id: "em10_ag3",
      type: "EmotionIdentifyQuestion",
      domain: "emotion",
      titleEn: "Identify Complex Emotion",
      titleKn: "ಸಂಕೀರ್ಣ ಭಾವನೆ ಗುರುತಿಸಿ",
      promptEn: "Someone gave you a gift you already have. You feel politely grateful but a little let-down. What emotion fits?",
      promptKn: "ಯಾರೋ ನಿಮಗೆ ಈಗಾಗಲೇ ಇರುವ ಉಡುಗೊರೆ ಕೊಟ್ಟರು. ನೀವು ಕೃತಜ್ಞರಾಗಿದ್ದರೂ ಸ್ವಲ್ಪ ನಿರಾಶರಾದಿರಿ. ಯಾವ ಭಾವನೆ ಹೊಂದುತ್ತದೆ?",
      currentEmotion: { emoji: "🙂", name: "bittersweet" },
      options: [
        { id: "bittersweet", textEn: "Bittersweet 🙂", textKn: "ಮಿಶ್ರ ಭಾವನೆ 🙂", correct: true },
        { id: "angry", textEn: "Angry 😠", textKn: "ಕೋಪ 😠", correct: false },
        { id: "excited", textEn: "Very excited 😄", textKn: "ತುಂಬಾ ಉತ್ಸಾಹ 😄", correct: false },
      ],
    },
  ],
};

// ── SOCIAL QUESTIONS (SocialScenarioQuestion / TurnTakingQuestion) ────────────

const SOCIAL_POOL = {
  1: [
    {
      id: "so1_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your friend is crying 😢. What do you do?",
      promptKn: "ನಿಮ್ಮ ಸ್ನೇಹಿತ ಅಳುತ್ತಿದ್ದಾನೆ 😢. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Give them a hug 🤗", textKn: "ಅವರನ್ನು ತಬ್ಬಿಕೊಳ್ಳಿ 🤗", correct: true },
        { id: "B", textEn: "Walk away 🚶", textKn: "ದೂರ ಹೋಗಿ 🚶", correct: false },
      ],
    },
    {
      id: "so2_ag1",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "Character A just threw the ball ⚾. Whose turn is it now?",
      promptKn: "ಪಾತ್ರ A ಚೆಂಡನ್ನು ಎಸೆದಿದೆ ⚾. ಈಗ ಯಾರ ಸರದಿ?",
      options: [
        { id: "charB", textEn: "Character B's turn 👧", textKn: "ಪಾತ್ರ B ಯ ಸರದಿ 👧", correct: true },
        { id: "charA", textEn: "Character A again 👦", textKn: "ಮತ್ತೆ ಪಾತ್ರ A 👦", correct: false },
      ],
    },
    {
      id: "so3_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "A new child joins your class 🏫. What should you do?",
      promptKn: "ಹೊಸ ಮಗು ತರಗತಿಗೆ ಬಂದಿದೆ 🏫. ನೀವು ಏನು ಮಾಡಬೇಕು?",
      options: [
        { id: "A", textEn: "Say hello and welcome them 👋", textKn: "ಹಲೋ ಹೇಳಿ ಸ್ವಾಗತಿಸಿ 👋", correct: true },
        { id: "B", textEn: "Ignore them 🙈", textKn: "ಅವರನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ 🙈", correct: false },
      ],
    },
    {
      id: "so4_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You want a cookie 🍪 that your sibling has. What do you say?",
      promptKn: "ನಿಮ್ಮ ಅಣ್ಣ/ತಂಗಿ ಬಳಿ ಇರುವ ಕುಕ್ಕಿ ಬೇಕು 🍪. ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Please can I have one? 🙏", textKn: "ದಯವಿಟ್ಟು ನನಗೊಂದು ಕೊಡುತ್ತೀರಾ? 🙏", correct: true },
        { id: "B", textEn: "Grab it without asking 😤", textKn: "ಕೇಳದೆ ಕಸಿದುಕೊಳ್ಳುವುದು 😤", correct: false },
      ],
    },
    {
      id: "so5_ag1",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "You and your friend are taking turns on the swing 🛝. You just had a turn. What should happen next?",
      promptKn: "ನೀವು ಮತ್ತು ಸ್ನೇಹಿತ ಜೋಕಾಲಿಯಲ್ಲಿ ಸರದಿಯಲ್ಲಿ ಆಡುತ್ತಿದ್ದೀರಿ 🛝. ನಿಮ್ಮ ಸರದಿ ಮುಗಿದಿದೆ. ಮುಂದೇನು?",
      options: [
        { id: "friend_turn", textEn: "Let your friend have a turn 👧", textKn: "ಸ್ನೇಹಿತನಿಗೆ ಸರದಿ ಕೊಡಿ 👧", correct: true },
        { id: "keep_going", textEn: "Keep swinging yourself 😤", textKn: "ನೀವೇ ಮತ್ತೆ ತೂಗಾಡಿ 😤", correct: false },
      ],
    },
    {
      id: "so6_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your friend falls down 🤕. What do you do?",
      promptKn: "ನಿಮ್ಮ ಸ್ನೇಹಿತ ಬಿದ್ದಿದ್ದಾನೆ 🤕. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Help them up and ask if they are okay 🤝", textKn: "ಎಬ್ಬಿಸಿ ಸರಿ ಇದ್ದಾರಾ ಎಂದು ಕೇಳಿ 🤝", correct: true },
        { id: "B", textEn: "Laugh at them 😂", textKn: "ಅವರನ್ನು ನೋಡಿ ನಗುವುದು 😂", correct: false },
      ],
    },
    {
      id: "so7_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Someone shares a toy with you 🧸. What do you say?",
      promptKn: "ಯಾರೋ ಆಟಿಕೆ ಹಂಚಿಕೊಂಡರು 🧸. ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Thank you! 😊", textKn: "ಧನ್ಯವಾದ! 😊", correct: true },
        { id: "B", textEn: "Nothing, just take it", textKn: "ಏನೂ ಹೇಳದೆ ತೆಗೆದುಕೊಳ್ಳುವುದು", correct: false },
      ],
    },
    {
      id: "so8_ag1",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "Mia painted 🎨 then Sai painted. Whose turn is it now?",
      promptKn: "ಮಿಯಾ ಬಣ್ಣ ಹಾಕಿದ ನಂತರ ಸಾಯಿ ಬಣ್ಣ ಹಾಕಿದ. ಈಗ ಯಾರ ಸರದಿ?",
      options: [
        { id: "mia", textEn: "Mia's turn 🎨", textKn: "ಮಿಯಾ ಸರದಿ 🎨", correct: true },
        { id: "sai", textEn: "Sai's turn again", textKn: "ಮತ್ತೆ ಸಾಯಿ", correct: false },
      ],
    },
    {
      id: "so9_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You accidentally bumped into someone 😬. What should you say?",
      promptKn: "ಆಕಸ್ಮಿಕವಾಗಿ ಯಾರಿಗಾದರೂ ಡಿಕ್ಕಿ ಹೊಡೆದಿರಿ 😬. ನೀವು ಏನು ಹೇಳಬೇಕು?",
      options: [
        { id: "A", textEn: "Sorry! 🙏", textKn: "ಕ್ಷಮಿಸಿ! 🙏", correct: true },
        { id: "B", textEn: "Nothing, keep walking", textKn: "ಏನೂ ಹೇಳದೆ ಮುಂದೆ ಹೋಗುವುದು", correct: false },
      ],
    },
    {
      id: "so10_ag1",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your parent asks you to come for dinner 🍽️. What do you do?",
      promptKn: "ಪೋಷಕರು ಊಟಕ್ಕೆ ಬರಲು ಹೇಳಿದ್ದಾರೆ 🍽️. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Come right away 🏃", textKn: "ತಕ್ಷಣ ಬರುವುದು 🏃", correct: true },
        { id: "B", textEn: "Keep playing and ignore them", textKn: "ಆಡುತ್ತಲೇ ನಿರ್ಲಕ್ಷಿಸುವುದು", correct: false },
      ],
    },
  ],
  2: [
    {
      id: "so1_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You want to play with someone's toy 🧸. What do you say?",
      promptKn: "ಯಾರದ್ದಾದರೂ ಆಟಿಕೆಯೊಂದಿಗೆ ಆಡಲು ಬಯಸುತ್ತೀರಿ 🧸. ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Just take it 😤", textKn: "ಬಲವಂತವಾಗಿ ತೆಗೆದುಕೊಳ್ಳುವುದು 😤", correct: false },
        { id: "B", textEn: "Can I please have a turn? 🙏", textKn: "ದಯವಿಟ್ಟು ನಾನು ಒಮ್ಮೆ ಆಡಬಹುದೇ? 🙏", correct: true },
        { id: "C", textEn: "Start crying 😢", textKn: "ಅಳಲು ಪ್ರಾರಂಭಿಸುವುದು 😢", correct: false },
      ],
    },
    {
      id: "so2_ag2",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "Player 2 just finished their turn on the board game 🎲. Who goes next?",
      promptKn: "ಆಟಗಾರ 2 ತಮ್ಮ ಸರದಿ ಮುಗಿಸಿದ್ದಾರೆ 🎲. ಮುಂದಿನವರು ಯಾರು?",
      options: [
        { id: "p3", textEn: "Player 3 👤", textKn: "ಆಟಗಾರ 3 👤", correct: true },
        { id: "p1", textEn: "Player 1 👤", textKn: "ಆಟಗಾರ 1 👤", correct: false },
        { id: "p2", textEn: "Player 2 👤", textKn: "ಆಟಗಾರ 2 👤", correct: false },
      ],
    },
    {
      id: "so3_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Two friends are arguing and you are with them 😤. What should you do?",
      promptKn: "ಇಬ್ಬರು ಸ್ನೇಹಿತರು ಜಗಳವಾಡುತ್ತಿದ್ದಾರೆ 😤. ನೀವು ಏನು ಮಾಡಬೇಕು?",
      options: [
        { id: "A", textEn: "Calmly ask them to stop and sort it out 🕊️", textKn: "ಶಾಂತವಾಗಿ ನಿಲ್ಲಿಸಲು ಹೇಳಿ 🕊️", correct: true },
        { id: "B", textEn: "Join one side and argue more", textKn: "ಒಂದು ಪಕ್ಷ ಸೇರಿ ಮತ್ತಷ್ಟು ಜಗಳ ಮಾಡಿ", correct: false },
        { id: "C", textEn: "Run away and ignore it", textKn: "ಓಡಿ ನಿರ್ಲಕ್ಷಿಸಿ", correct: false },
      ],
    },
    {
      id: "so4_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You finish first in a game 🏆 but your friend is upset they lost. What do you do?",
      promptKn: "ನೀವು ಮೊದಲು ಗೆದ್ದಿರಿ 🏆 ಆದರೆ ಸ್ನೇಹಿತ ಸೋತಿದ್ದಕ್ಕೆ ಬೇಸರ ಪಟ್ಟಿದ್ದಾನೆ. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Say well played and cheer them up 😊", textKn: "ಚೆನ್ನಾಗಿ ಆಡಿದಿ ಎಂದು ಹೇಳಿ ಉತ್ಸಾಹ ತುಂಬಿ 😊", correct: true },
        { id: "B", textEn: "Brag about winning 😤", textKn: "ಗೆಲುವಿನ ಬಗ್ಗೆ ಹೊಗಳಿಕೊಳ್ಳಿ 😤", correct: false },
        { id: "C", textEn: "Ignore your friend", textKn: "ಸ್ನೇಹಿತನನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ", correct: false },
      ],
    },
    {
      id: "so5_ag2",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "During show-and-tell 🗣️ Arjun spoke, then Priya spoke, then the teacher spoke. Who should speak next?",
      promptKn: "ಶೋ-ಅಂಡ್-ಟೆಲ್ 🗣️ ಅರ್ಜುನ್ ಮಾತನಾಡಿದ, ನಂತರ ಪ್ರಿಯಾ, ನಂತರ ಶಿಕ್ಷಕರು. ಮುಂದೆ ಯಾರು ಮಾತನಾಡಬೇಕು?",
      options: [
        { id: "student", textEn: "The next student in line 🧑‍🎓", textKn: "ಸರದಿಯ ಮುಂದಿನ ವಿದ್ಯಾರ್ಥಿ 🧑‍🎓", correct: true },
        { id: "arjun", textEn: "Arjun again", textKn: "ಮತ್ತೆ ಅರ್ಜುನ್", correct: false },
        { id: "nobody", textEn: "Nobody — it is over", textKn: "ಯಾರೂ ಇಲ್ಲ — ಮುಗಿದಿದೆ", correct: false },
      ],
    },
    {
      id: "so6_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your classmate looks lonely at lunch 🍱. What do you do?",
      promptKn: "ಊಟದ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ತರಗತಿ ಸ್ನೇಹಿತ ಒಬ್ಬಂಟಿಯಾಗಿ ಕಾಣುತ್ತಿದ್ದಾನೆ 🍱. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Invite them to sit with you 🤝", textKn: "ಅವರನ್ನು ನಿಮ್ಮ ಜೊತೆ ಕೂರಲು ಆಹ್ವಾನಿಸಿ 🤝", correct: true },
        { id: "B", textEn: "Ignore them", textKn: "ನಿರ್ಲಕ್ಷಿಸಿ", correct: false },
        { id: "C", textEn: "Point at them and laugh 😂", textKn: "ಅವರತ್ತ ಬೊಟ್ಟು ಮಾಡಿ ನಗುವುದು 😂", correct: false },
      ],
    },
    {
      id: "so7_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "A younger child is struggling to open their lunchbox 🥡. What do you do?",
      promptKn: "ಚಿಕ್ಕ ಮಗು ಊಟದ ಡಬ್ಬ ತೆರೆಯಲು ಕಷ್ಟಪಡುತ್ತಿದೆ 🥡. ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
      options: [
        { id: "A", textEn: "Offer to help them 🤝", textKn: "ಸಹಾಯ ಮಾಡಲು ಮುಂದಾಗಿ 🤝", correct: true },
        { id: "B", textEn: "Walk past without helping", textKn: "ಸಹಾಯ ಮಾಡದೆ ಮುಂದೆ ಹೋಗಿ", correct: false },
        { id: "C", textEn: "Take the lunchbox from them 😤", textKn: "ಡಬ್ಬ ಕಸಿದುಕೊಳ್ಳಿ 😤", correct: false },
      ],
    },
    {
      id: "so8_ag2",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "In a card game 🃏 the order is: Ana → Ben → Caro. Ben just played. Who goes next?",
      promptKn: "ಕಾರ್ಡ್ ಆಟ 🃏 ಕ್ರಮ: ಅನಾ → ಬೆನ್ → ಕ್ಯಾರೋ. ಬೆನ್ ಆಡಿದ. ಮುಂದೆ ಯಾರು?",
      options: [
        { id: "caro", textEn: "Caro 🃏", textKn: "ಕ್ಯಾರೋ 🃏", correct: true },
        { id: "ana", textEn: "Ana", textKn: "ಅನಾ", correct: false },
        { id: "ben", textEn: "Ben again", textKn: "ಮತ್ತೆ ಬೆನ್", correct: false },
      ],
    },
    {
      id: "so9_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Someone accidentally spills paint on your drawing 🎨. What is the kindest reaction?",
      promptKn: "ಯಾರೋ ಆಕಸ್ಮಿಕವಾಗಿ ನಿಮ್ಮ ಚಿತ್ರದ ಮೇಲೆ ಬಣ್ಣ ಚೆಲ್ಲಿದರು 🎨. ಅತ್ಯಂತ ದಯಾಪರ ಪ್ರತಿಕ್ರಿಯೆ ಏನು?",
      options: [
        { id: "A", textEn: "Say it is okay and offer to redo it together 🤝", textKn: "ಪರವಾಗಿಲ್ಲ ಎಂದು ಒಟ್ಟಿಗೆ ಮಾಡೋಣ 🤝", correct: true },
        { id: "B", textEn: "Shout at them 😤", textKn: "ಅವರ ಮೇಲೆ ಕಿರುಚುವುದು 😤", correct: false },
        { id: "C", textEn: "Cry and refuse to talk to them", textKn: "ಅಳುತ್ತ ಮಾತಾಡಲು ನಿರಾಕರಿಸುವುದು", correct: false },
      ],
    },
    {
      id: "so10_ag2",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You are in a queue 🚶 and someone cuts in front of you. What should you do?",
      promptKn: "ನೀವು ಸರದಿಯಲ್ಲಿ ನಿಂತಿದ್ದೀರಿ 🚶 ಮತ್ತು ಯಾರೋ ಮುಂದೆ ಬಂದರು. ನೀವು ಏನು ಮಾಡಬೇಕು?",
      options: [
        { id: "A", textEn: "Politely say the queue starts at the back 🙏", textKn: "ಸೌಜನ್ಯದಿಂದ ಸರದಿ ಹಿಂದಿನಿಂದ ಎಂದು ಹೇಳಿ 🙏", correct: true },
        { id: "B", textEn: "Push them out 😤", textKn: "ಅವರನ್ನು ದೂಡಿ 😤", correct: false },
        { id: "C", textEn: "Say nothing and feel angry inside", textKn: "ಏನೂ ಹೇಳದೆ ಒಳಗೇ ಕೋಪ ಪಡುವುದು", correct: false },
      ],
    },
  ],
  3: [
    {
      id: "so1_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your friend is upset because you accidentally broke their pencil ✏️. What is the best thing to do?",
      promptKn: "ನೀವು ಆಕಸ್ಮಿಕವಾಗಿ ಸ್ನೇಹಿತನ ಪೆನ್ಸಿಲ್ ಮುರಿದಿದ್ದೀರಿ ✏️. ಅತ್ಯುತ್ತಮ ಕ್ರಮ ಯಾವುದು?",
      options: [
        { id: "A", textEn: "Say sorry and offer to share yours 🤝", textKn: "ಕ್ಷಮೆ ಕೇಳಿ ನಿಮ್ಮ ಪೆನ್ಸಿಲ್ ಹಂಚಿಕೊಳ್ಳಿ 🤝", correct: true },
        { id: "B", textEn: "Pretend it did not happen 🙈", textKn: "ಏನೂ ಆಗಿಲ್ಲ ಎಂದು ನಟಿಸಿ 🙈", correct: false },
        { id: "C", textEn: "Blame someone else 👈", textKn: "ಇನ್ನೊಬ್ಬರ ಮೇಲೆ ದೂಷಿಸಿ 👈", correct: false },
        { id: "D", textEn: "Run away 🏃", textKn: "ಓಡಿ ಹೋಗಿ 🏃", correct: false },
      ],
    },
    {
      id: "so2_ag3",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "Conversation sequence: Person A spoke 🗣️ -> Person B spoke 🗣️ -> Person A spoke 🗣️. Who speaks next and why?",
      promptKn: "ಸಂಭಾಷಣೆ ಕ್ರಮ: A ಮಾತಾಡಿದ -> B ಮಾತಾಡಿದ -> A ಮಾತಾಡಿದ. ಮುಂದೆ ಯಾರು ಮತ್ತು ಏಕೆ?",
      options: [
        { id: "b_turn", textEn: "Person B – fair turn-taking 🤝", textKn: "ವ್ಯಕ್ತಿ B – ಸಮಾನ ಸರದಿ 🤝", correct: true },
        { id: "a_turn", textEn: "Person A – keep talking", textKn: "ವ್ಯಕ್ತಿ A – ಮಾತನಾಡಲಿ", correct: false },
        { id: "both", textEn: "Both at same time", textKn: "ಇಬ್ಬರೂ ಒಟ್ಟಿಗೆ", correct: false },
      ],
    },
    {
      id: "so3_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Someone is speaking in a group conversation. When is it polite to join in?",
      promptKn: "ಗುಂಪಿನಲ್ಲಿ ಯಾರೋ ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ. ಸೇರಲು ಸೂಕ್ತ ಸಮಯ ಯಾವುದು?",
      options: [
        { id: "A", textEn: "Wait for a natural pause and raise your hand 👋", textKn: "ವಿರಾಮಕ್ಕೆ ಕಾಯ್ದು ಕೈ ಎತ್ತಿ 👋", correct: true },
        { id: "B", textEn: "Shout over them 🗣️", textKn: "ಅಡ್ಡಿ ಪಡಿಸಿ ಕಿರಿಚಿ 🗣️", correct: false },
      ],
    },
    {
      id: "so4_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "A classmate is being teased by others 😢. You are the only one who sees it. What should you do?",
      promptKn: "ತರಗತಿ ಸ್ನೇಹಿತನನ್ನು ಇತರರು ಚುಡಾಯಿಸುತ್ತಿದ್ದಾರೆ 😢. ನೀವು ಒಬ್ಬರೇ ನೋಡುತ್ತಿದ್ದೀರಿ. ನೀವು ಏನು ಮಾಡಬೇಕು?",
      options: [
        { id: "A", textEn: "Tell a trusted adult and support your classmate 🤝", textKn: "ವಿಶ್ವಾಸಾರ್ಹ ವಯಸ್ಕರಿಗೆ ತಿಳಿಸಿ ಸ್ನೇಹಿತನನ್ನು ಬೆಂಬಲಿಸಿ 🤝", correct: true },
        { id: "B", textEn: "Join in the teasing 😤", textKn: "ಚುಡಾಯಿಸುವುದರಲ್ಲಿ ಸೇರಿ 😤", correct: false },
        { id: "C", textEn: "Walk away and do nothing", textKn: "ದೂರ ಹೋಗಿ ಏನೂ ಮಾಡಬೇಡಿ", correct: false },
        { id: "D", textEn: "Video record it", textKn: "ವಿಡಿಯೋ ತೆಗೆಯಿರಿ", correct: false },
      ],
    },
    {
      id: "so5_ag3",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "In a debate 🎤 Team A argued → Team B argued → Team A rebutted. Whose turn is it now?",
      promptKn: "ಚರ್ಚೆ 🎤 ತಂಡ A ವಾದ ಮಾಡಿತು → ತಂಡ B ವಾದ ಮಾಡಿತು → ತಂಡ A ಪ್ರತ್ಯುತ್ತರ ನೀಡಿತು. ಈಗ ಯಾರ ಸರದಿ?",
      options: [
        { id: "b_rebuttal", textEn: "Team B's rebuttal 🎤", textKn: "ತಂಡ B ಯ ಪ್ರತ್ಯುತ್ತರ 🎤", correct: true },
        { id: "a_again", textEn: "Team A again", textKn: "ಮತ್ತೆ ತಂಡ A", correct: false },
        { id: "judge", textEn: "The judge to decide immediately", textKn: "ತಕ್ಷಣ ನ್ಯಾಯಾಧೀಶರ ನಿರ್ಧಾರ", correct: false },
      ],
    },
    {
      id: "so6_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "You disagree with what a friend said 💬. What is the best way to handle it?",
      promptKn: "ಸ್ನೇಹಿತ ಹೇಳಿದ್ದರೊಂದಿಗೆ ನೀವು ಒಪ್ಪದಿದ್ದಾಗ 💬. ಉತ್ತಮ ನಿಭಾಯಿಸುವ ವಿಧಾನ ಯಾವುದು?",
      options: [
        { id: "A", textEn: "Calmly share your view and listen to theirs 🗣️", textKn: "ಶಾಂತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಹಂಚಿ ಮತ್ತು ಅವರದನ್ನು ಕೇಳಿ 🗣️", correct: true },
        { id: "B", textEn: "Shout that you are right 😤", textKn: "ನಾನೇ ಸರಿ ಎಂದು ಕಿರಿಚಿ 😤", correct: false },
        { id: "C", textEn: "Stop talking to them entirely", textKn: "ಅವರೊಂದಿಗೆ ಸಂಪೂರ್ಣ ಮಾತು ನಿಲ್ಲಿಸಿ", correct: false },
      ],
    },
    {
      id: "so7_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Your group project has a member who is not contributing 😑. What should the group do?",
      promptKn: "ನಿಮ್ಮ ಗುಂಪು ಪ್ರಾಜೆಕ್ಟ್ ನಲ್ಲಿ ಒಬ್ಬರು ಕೊಡುಗೆ ನೀಡುತ್ತಿಲ್ಲ 😑. ಗುಂಪು ಏನು ಮಾಡಬೇಕು?",
      options: [
        { id: "A", textEn: "Speak to them kindly to understand and find a role that suits them 🤝", textKn: "ಅವರೊಂದಿಗೆ ಸೌಜನ್ಯದಿಂದ ಮಾತಾಡಿ ಸೂಕ್ತ ಜವಾಬ್ದಾರಿ ನೀಡಿ 🤝", correct: true },
        { id: "B", textEn: "Kick them out of the group 😤", textKn: "ಅವರನ್ನು ಗುಂಪಿನಿಂದ ಹೊರಹಾಕಿ 😤", correct: false },
        { id: "C", textEn: "Do nothing and complain behind their back", textKn: "ಏನೂ ಮಾಡದೆ ಹಿಂದೆ ದೂರಿ", correct: false },
      ],
    },
    {
      id: "so8_ag3",
      type: "TurnTakingQuestion",
      domain: "social",
      promptEn: "In a relay race 🏃 Runner 1 → Runner 2 → Runner 3 → Runner 4. Runner 2 just finished. Who runs next?",
      promptKn: "ರಿಲೇ ಓಟ 🏃 ಓಟಗಾರ 1 → 2 → 3 → 4. ಓಟಗಾರ 2 ಮುಗಿಸಿದ. ಮುಂದೆ ಯಾರು?",
      options: [
        { id: "r3", textEn: "Runner 3 🏃", textKn: "ಓಟಗಾರ 3 🏃", correct: true },
        { id: "r1", textEn: "Runner 1", textKn: "ಓಟಗಾರ 1", correct: false },
        { id: "r4", textEn: "Runner 4", textKn: "ಓಟಗಾರ 4", correct: false },
      ],
    },
    {
      id: "so9_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "Someone online sends you an unkind message 💻. What is the healthiest response?",
      promptKn: "ಯಾರೋ ಆನ್ಲೈನ್ ನಲ್ಲಿ ಕೆಟ್ಟ ಸಂದೇಶ ಕಳಿಸಿದ್ದಾರೆ 💻. ಉತ್ತಮ ಪ್ರತಿಕ್ರಿಯೆ ಯಾವುದು?",
      options: [
        { id: "A", textEn: "Block them and tell a trusted adult 🛡️", textKn: "ಬ್ಲಾಕ್ ಮಾಡಿ ವಿಶ್ವಾಸಾರ್ಹ ವ್ಯಕ್ತಿಗೆ ತಿಳಿಸಿ 🛡️", correct: true },
        { id: "B", textEn: "Reply with meaner messages", textKn: "ಮತ್ತಷ್ಟು ಕೆಟ್ಟ ಸಂದೇಶ ಕಳಿಸಿ", correct: false },
        { id: "C", textEn: "Share it with everyone to embarrass them", textKn: "ಅವರನ್ನು ನಾಚಿಸಲು ಎಲ್ಲರಿಗೂ ಹಂಚಿ", correct: false },
        { id: "D", textEn: "Delete your account immediately", textKn: "ತಕ್ಷಣ ಖಾತೆ ಅಳಿಸಿ", correct: false },
      ],
    },
    {
      id: "so10_ag3",
      type: "SocialScenarioQuestion",
      domain: "social",
      promptEn: "A friend asks you to lie to cover for them 🤔. What is the right choice?",
      promptKn: "ಸ್ನೇಹಿತ ತನ್ನ ಪರವಾಗಿ ಸುಳ್ಳು ಹೇಳಲು ಕೇಳುತ್ತಿದ್ದಾನೆ 🤔. ಸರಿಯಾದ ಆಯ್ಕೆ ಯಾವುದು?",
      options: [
        { id: "A", textEn: "Politely refuse and explain why honesty matters 🤝", textKn: "ಸೌಜನ್ಯದಿಂದ ನಿರಾಕರಿಸಿ ಮತ್ತು ಪ್ರಾಮಾಣಿಕತೆ ಮುಖ್ಯ ಎಂದು ವಿವರಿಸಿ 🤝", correct: true },
        { id: "B", textEn: "Lie to keep the friendship", textKn: "ಸ್ನೇಹ ಉಳಿಸಲು ಸುಳ್ಳು ಹೇಳಿ", correct: false },
        { id: "C", textEn: "Tell others what your friend did", textKn: "ಸ್ನೇಹಿತ ಮಾಡಿದ್ದನ್ನು ಇತರರಿಗೆ ಹೇಳಿ", correct: false },
      ],
    },
  ],
};

// ── COGNITIVE QUESTIONS (PatternCompleteQuestion / SequenceOrderQuestion) ─────

const COGNITIVE_POOL = {
  1: [
    {
      id: "cog1_ag1",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Complete the color pattern: 🔴 🔵 🔴 ❓",
      promptKn: "ಬಣ್ಣದ ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ: 🔴 🔵 🔴 ❓",
      patternDisplay: ["🔴", "🔵", "🔴", "❓"],
      options: [
        { id: "blue", text: "🔵", correct: true },
        { id: "red", text: "🔴", correct: false },
      ],
    },
    {
      id: "cog2_ag1",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What shape comes next? 🔴 🔵 🔴 🔵 ❓",
      promptKn: "ಮುಂದಿನ ಆಕಾರ ಯಾವುದು? 🔴 🔵 🔴 🔵 ❓",
      patternDisplay: ["🔴", "🔵", "🔴", "🔵", "❓"],
      options: [
        { id: "red", text: "🔴", correct: true },
        { id: "blue", text: "🔵", correct: false },
      ],
    },
    {
      id: "cog3_ag1",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange eating steps in correct order 🍽️",
      promptKn: "ಊಟದ ಹಂತಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🍽️",
      items: [
        { id: "s1", titleEn: "1. Food on plate 🍲", titleKn: "1. ತಟ್ಟೆಯಲ್ಲಿ ಊಟ 🍲", order: 1 },
        { id: "s2", titleEn: "2. Eating food 😋", titleKn: "2. ಊಟ ಮಾಡುವುದು 😋", order: 2 },
        { id: "s3", titleEn: "3. Empty clean plate 🧼", titleKn: "3. ಖಾಲಿ ತಟ್ಟೆ 🧼", order: 3 },
      ],
    },
    {
      id: "cog4_ag1",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Complete the animal pattern: 🐱 🐶 🐱 ❓",
      promptKn: "ಪ್ರಾಣಿ ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ: 🐱 🐶 🐱 ❓",
      patternDisplay: ["🐱", "🐶", "🐱", "❓"],
      options: [
        { id: "dog", text: "🐶", correct: true },
        { id: "cat", text: "🐱", correct: false },
      ],
    },
    {
      id: "cog5_ag1",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Put the plant growing steps in order 🌱",
      promptKn: "ಗಿಡ ಬೆಳೆಯುವ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🌱",
      items: [
        { id: "s1", titleEn: "1. Seed 🌰", titleKn: "1. ಬೀಜ 🌰", order: 1 },
        { id: "s2", titleEn: "2. Sprout 🌱", titleKn: "2. ಮೊಳಕೆ 🌱", order: 2 },
        { id: "s3", titleEn: "3. Plant 🌿", titleKn: "3. ಗಿಡ 🌿", order: 3 },
      ],
    },
    {
      id: "cog6_ag1",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What comes next? ⭐ 🌙 ⭐ 🌙 ❓",
      promptKn: "ಮುಂದಿನದು ಯಾವುದು? ⭐ 🌙 ⭐ 🌙 ❓",
      patternDisplay: ["⭐", "🌙", "⭐", "🌙", "❓"],
      options: [
        { id: "star", text: "⭐", correct: true },
        { id: "moon", text: "🌙", correct: false },
      ],
    },
    {
      id: "cog7_ag1",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Put hand-washing steps in order 🧼",
      promptKn: "ಕೈ ತೊಳೆಯುವ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🧼",
      items: [
        { id: "s1", titleEn: "1. Wet hands 💧", titleKn: "1. ಕೈ ತೇವ ಮಾಡಿ 💧", order: 1 },
        { id: "s2", titleEn: "2. Apply soap 🧴", titleKn: "2. ಸಾಬೂನು ಹಚ್ಚಿ 🧴", order: 2 },
        { id: "s3", titleEn: "3. Rinse and dry 🚿", titleKn: "3. ತೊಳೆದು ಒರೆಸಿ 🚿", order: 3 },
      ],
    },
    {
      id: "cog8_ag1",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What fruit is missing? 🍎 🍌 🍎 🍌 ❓",
      promptKn: "ಯಾವ ಹಣ್ಣು ಕಾಣಿಸುತ್ತಿಲ್ಲ? 🍎 🍌 🍎 🍌 ❓",
      patternDisplay: ["🍎", "🍌", "🍎", "🍌", "❓"],
      options: [
        { id: "apple", text: "🍎", correct: true },
        { id: "banana", text: "🍌", correct: false },
      ],
    },
  ],
  2: [
    {
      id: "cog1_ag2",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Complete the pattern: 🔴 🔵 🟡 🔴 🔵 ❓",
      promptKn: "ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ: 🔴 🔵 🟡 🔴 🔵 ❓",
      patternDisplay: ["🔴", "🔵", "🟡", "🔴", "🔵", "❓"],
      options: [
        { id: "yellow", text: "🟡", correct: true },
        { id: "red", text: "🔴", correct: false },
        { id: "green", text: "🟢", correct: false },
      ],
    },
    {
      id: "cog2_ag2",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange morning routine steps in correct order 🌅",
      promptKn: "ಬೆಳಗಿನ ದಿನಚರಿ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🌅",
      items: [
        { id: "s1", titleEn: "1. Wake up ⏰", titleKn: "1. ಏಳುವುದು ⏰", order: 1 },
        { id: "s2", titleEn: "2. Brush teeth 🪥", titleKn: "2. ಹಲ್ಲುಜ್ಜುವುದು 🪥", order: 2 },
        { id: "s3", titleEn: "3. Eat breakfast 🥣", titleKn: "3. ಉಪಾಹಾರ 🥣", order: 3 },
        { id: "s4", titleEn: "4. Go to school 🏫", titleKn: "4. ಶಾಲೆಗೆ ಹೋಗುವುದು 🏫", order: 4 },
      ],
    },
    {
      id: "cog3_ag2",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What number is next? 2, 4, 6, ❓",
      promptKn: "ಮುಂದಿನ ಸಂಖ್ಯೆ ಯಾವುದು? 2, 4, 6, ❓",
      patternDisplay: ["2", "4", "6", "❓"],
      options: [
        { id: "8", text: "8", correct: true },
        { id: "7", text: "7", correct: false },
        { id: "10", text: "10", correct: false },
      ],
    },
    {
      id: "cog4_ag2",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Complete the shape pattern: 🔵 🔶 🔵 🔶 ❓",
      promptKn: "ಆಕಾರ ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ: 🔵 🔶 🔵 🔶 ❓",
      patternDisplay: ["🔵", "🔶", "🔵", "🔶", "❓"],
      options: [
        { id: "circle", text: "🔵", correct: true },
        { id: "diamond", text: "🔶", correct: false },
        { id: "square", text: "🟦", correct: false },
      ],
    },
    {
      id: "cog5_ag2",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange steps to make a sandwich in order 🥪",
      promptKn: "ಸ್ಯಾಂಡ್ವಿಚ್ ತಯಾರಿಸುವ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🥪",
      items: [
        { id: "s1", titleEn: "1. Get bread 🍞", titleKn: "1. ಬ್ರೆಡ್ ತೆಗೆಯಿರಿ 🍞", order: 1 },
        { id: "s2", titleEn: "2. Spread butter 🧈", titleKn: "2. ಬೆಣ್ಣೆ ಹಚ್ಚಿ 🧈", order: 2 },
        { id: "s3", titleEn: "3. Add filling 🥬", titleKn: "3. ತುಂಬಿಸಿ 🥬", order: 3 },
        { id: "s4", titleEn: "4. Close and eat 😋", titleKn: "4. ಮುಚ್ಚಿ ತಿನ್ನಿ 😋", order: 4 },
      ],
    },
    {
      id: "cog6_ag2",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What comes next? 🐮 🐷 🐮 🐷 🐮 ❓",
      promptKn: "ಮುಂದಿನದು ಯಾವುದು? 🐮 🐷 🐮 🐷 🐮 ❓",
      patternDisplay: ["🐮", "🐷", "🐮", "🐷", "🐮", "❓"],
      options: [
        { id: "pig", text: "🐷", correct: true },
        { id: "cow", text: "🐮", correct: false },
        { id: "chicken", text: "🐔", correct: false },
      ],
    },
    {
      id: "cog7_ag2",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange the seasons in order 🍂❄️🌸☀️",
      promptKn: "ಋತುಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🍂❄️🌸☀️",
      items: [
        { id: "s1", titleEn: "1. Autumn 🍂", titleKn: "1. ಶರತ್ಕಾಲ 🍂", order: 1 },
        { id: "s2", titleEn: "2. Winter ❄️", titleKn: "2. ಚಳಿಗಾಲ ❄️", order: 2 },
        { id: "s3", titleEn: "3. Spring 🌸", titleKn: "3. ವಸಂತ ಕಾಲ 🌸", order: 3 },
        { id: "s4", titleEn: "4. Summer ☀️", titleKn: "4. ಬೇಸಿಗೆ ☀️", order: 4 },
      ],
    },
    {
      id: "cog8_ag2",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Find the next number: 5, 10, 15, 20, ❓",
      promptKn: "ಮುಂದಿನ ಸಂಖ್ಯೆ ಹುಡುಕಿ: 5, 10, 15, 20, ❓",
      patternDisplay: ["5", "10", "15", "20", "❓"],
      options: [
        { id: "25", text: "25", correct: true },
        { id: "22", text: "22", correct: false },
        { id: "30", text: "30", correct: false },
      ],
    },
  ],
  3: [
    {
      id: "cog1_ag3",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What comes next in the number pattern: 2, 4, 8, 16, ❓",
      promptKn: "ಸಂಖ್ಯಾ ವಿನ್ಯಾಸದಲ್ಲಿ ಮುಂದಿನ ಸಂಖ್ಯೆ ಯಾವುದು: 2, 4, 8, 16, ❓",
      patternDisplay: ["2", "4", "8", "16", "❓"],
      options: [
        { id: "32", text: "32", correct: true },
        { id: "24", text: "24", correct: false },
        { id: "20", text: "20", correct: false },
        { id: "64", text: "64", correct: false },
      ],
    },
    {
      id: "cog2_ag3",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Find the pattern: 🔴🔴🔵 🔴🔴🔵 🔴🔴❓",
      promptKn: "ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ: 🔴🔴🔵 🔴🔴🔵 🔴🔴❓",
      patternDisplay: ["🔴", "🔴", "🔵", "🔴", "🔴", "🔵", "🔴", "🔴", "❓"],
      options: [
        { id: "blue", text: "🔵", correct: true },
        { id: "red", text: "🔴", correct: false },
      ],
    },
    {
      id: "cog3_ag3",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange friend-making steps in logical order 🤝",
      promptKn: "ಸ್ನೇಹ ಬೆಳೆಸುವ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🤝",
      items: [
        { id: "s1", titleEn: "1. See someone alone 👀", titleKn: "1. ಒಬ್ಬಂಟಿ ವ್ಯಕ್ತಿ ನೋಡಿ 👀", order: 1 },
        { id: "s2", titleEn: "2. Smile & approach 😊", titleKn: "2. ನಗು ಮತ್ತು ಹತ್ತಿರ ಹೋಗಿ 😊", order: 2 },
        { id: "s3", titleEn: "3. Say hello 👋", titleKn: "3. ಹಲೋ ಹೇಳಿ 👋", order: 3 },
        { id: "s4", titleEn: "4. Ask their name ❓", titleKn: "4. ಹೆಸರು ಕೇಳಿ ❓", order: 4 },
        { id: "s5", titleEn: "5. Play together 🎮", titleKn: "5. ಒಟ್ಟಿಗೆ ಆಡಿ 🎮", order: 5 },
      ],
    },
    {
      id: "cog4_ag3",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What is the next term? 1, 1, 2, 3, 5, ❓",
      promptKn: "ಮುಂದಿನ ಪದ ಯಾವುದು? 1, 1, 2, 3, 5, ❓",
      patternDisplay: ["1", "1", "2", "3", "5", "❓"],
      options: [
        { id: "8", text: "8", correct: true },
        { id: "7", text: "7", correct: false },
        { id: "6", text: "6", correct: false },
        { id: "10", text: "10", correct: false },
      ],
    },
    {
      id: "cog5_ag3",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Arrange the scientific method steps in order 🔬",
      promptKn: "ವೈಜ್ಞಾನಿಕ ವಿಧಾನದ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🔬",
      items: [
        { id: "s1", titleEn: "1. Observe 👀", titleKn: "1. ಗಮನಿಸಿ 👀", order: 1 },
        { id: "s2", titleEn: "2. Form a hypothesis 💡", titleKn: "2. ಊಹೆ ಮಾಡಿ 💡", order: 2 },
        { id: "s3", titleEn: "3. Experiment 🧪", titleKn: "3. ಪ್ರಯೋಗ ಮಾಡಿ 🧪", order: 3 },
        { id: "s4", titleEn: "4. Analyse results 📊", titleKn: "4. ಫಲಿತಾಂಶ ವಿಶ್ಲೇಷಿಸಿ 📊", order: 4 },
        { id: "s5", titleEn: "5. Draw conclusion ✅", titleKn: "5. ನಿರ್ಧಾರಕ್ಕೆ ಬನ್ನಿ ✅", order: 5 },
      ],
    },
    {
      id: "cog6_ag3",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "Next term in the pattern: 3, 6, 12, 24, ❓",
      promptKn: "ವಿನ್ಯಾಸದ ಮುಂದಿನ ಪದ: 3, 6, 12, 24, ❓",
      patternDisplay: ["3", "6", "12", "24", "❓"],
      options: [
        { id: "48", text: "48", correct: true },
        { id: "36", text: "36", correct: false },
        { id: "30", text: "30", correct: false },
        { id: "42", text: "42", correct: false },
      ],
    },
    {
      id: "cog7_ag3",
      type: "SequenceOrderQuestion",
      domain: "cognitive",
      promptEn: "Put the steps to solve a problem in order 🧠",
      promptKn: "ಸಮಸ್ಯೆ ಪರಿಹರಿಸುವ ಹಂತಗಳನ್ನು ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ 🧠",
      items: [
        { id: "s1", titleEn: "1. Identify the problem 🔍", titleKn: "1. ಸಮಸ್ಯೆ ಗುರುತಿಸಿ 🔍", order: 1 },
        { id: "s2", titleEn: "2. Think of solutions 💡", titleKn: "2. ಪರಿಹಾರ ಯೋಚಿಸಿ 💡", order: 2 },
        { id: "s3", titleEn: "3. Choose the best one ✅", titleKn: "3. ಉತ್ತಮ ಆಯ್ಕೆ ಮಾಡಿ ✅", order: 3 },
        { id: "s4", titleEn: "4. Apply it and review 🔄", titleKn: "4. ಅನ್ವಯಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ 🔄", order: 4 },
      ],
    },
    {
      id: "cog8_ag3",
      type: "PatternCompleteQuestion",
      domain: "cognitive",
      promptEn: "What comes next? A, C, E, G, ❓",
      promptKn: "ಮುಂದಿನದು ಯಾವುದು? A, C, E, G, ❓",
      patternDisplay: ["A", "C", "E", "G", "❓"],
      options: [
        { id: "I", text: "I", correct: true },
        { id: "H", text: "H", correct: false },
        { id: "J", text: "J", correct: false },
        { id: "K", text: "K", correct: false },
      ],
    },
  ],
};

// ── COMMUNICATION QUESTIONS (InstructionFollowQuestion) ───────────────────────

const COMMUNICATION_POOL = {
  1: [
    {
      id: "comm1_ag1",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the dog 🐕",
      promptKn: "ನಾಯಿಯನ್ನು ಸ್ಪರ್ಶಿಸಿ 🐕",
      requiredStepsCount: 1,
      items: [
        { id: "dog", symbol: "🐕", nameEn: "Dog", nameKn: "ನಾಯಿ", targetOrder: 1 },
        { id: "cat", symbol: "🐱", nameEn: "Cat", nameKn: "ಬೆಕ್ಕು", targetOrder: null },
        { id: "elephant", symbol: "🐘", nameEn: "Elephant", nameKn: "ಆನೆ", targetOrder: null },
      ],
    },
    {
      id: "comm2_ag1",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the apple 🍎",
      promptKn: "ಸೇಬನ್ನು ಸ್ಪರ್ಶಿಸಿ 🍎",
      requiredStepsCount: 1,
      items: [
        { id: "apple", symbol: "🍎", nameEn: "Apple", nameKn: "ಸೇಬು", targetOrder: 1 },
        { id: "banana", symbol: "🍌", nameEn: "Banana", nameKn: "ಬಾಳೆ", targetOrder: null },
        { id: "grapes", symbol: "🍇", nameEn: "Grapes", nameKn: "ದ್ರಾಕ್ಷಿ", targetOrder: null },
      ],
    },
    {
      id: "comm3_ag1",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the red circle 🔴",
      promptKn: "ಕೆಂಪು ವೃತ್ತ ಸ್ಪರ್ಶಿಸಿ 🔴",
      requiredStepsCount: 1,
      items: [
        { id: "red", symbol: "🔴", nameEn: "Red circle", nameKn: "ಕೆಂಪು ವೃತ್ತ", targetOrder: 1 },
        { id: "blue", symbol: "🔵", nameEn: "Blue circle", nameKn: "ನೀಲಿ ವೃತ್ತ", targetOrder: null },
        { id: "green", symbol: "🟢", nameEn: "Green circle", nameKn: "ಹಸಿರು ವೃತ್ತ", targetOrder: null },
      ],
    },
    {
      id: "comm4_ag1",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the sun ☀️",
      promptKn: "ಸೂರ್ಯವನ್ನು ಸ್ಪರ್ಶಿಸಿ ☀️",
      requiredStepsCount: 1,
      items: [
        { id: "sun", symbol: "☀️", nameEn: "Sun", nameKn: "ಸೂರ್ಯ", targetOrder: 1 },
        { id: "moon", symbol: "🌙", nameEn: "Moon", nameKn: "ಚಂದ್ರ", targetOrder: null },
        { id: "star", symbol: "⭐", nameEn: "Star", nameKn: "ನಕ್ಷತ್ರ", targetOrder: null },
      ],
    },
    {
      id: "comm5_ag1",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the flower first 🌸 then the tree 🌳",
      promptKn: "ಮೊದಲು ಹೂವು 🌸 ನಂತರ ಮರ 🌳 ಸ್ಪರ್ಶಿಸಿ",
      requiredStepsCount: 2,
      items: [
        { id: "flower", symbol: "🌸", nameEn: "Flower", nameKn: "ಹೂವು", targetOrder: 1 },
        { id: "tree", symbol: "🌳", nameEn: "Tree", nameKn: "ಮರ", targetOrder: 2 },
        { id: "grass", symbol: "🌿", nameEn: "Grass", nameKn: "ಹುಲ್ಲು", targetOrder: null },
      ],
    },
  ],
  2: [
    {
      id: "comm1_ag2",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "First touch the dog 🐕 then touch the cat 🐱",
      promptKn: "ಮೊದಲು ನಾಯಿ 🐕 ನಂತರ ಬೆಕ್ಕು 🐱 ಸ್ಪರ್ಶಿಸಿ",
      requiredStepsCount: 2,
      items: [
        { id: "dog", symbol: "🐕", nameEn: "Dog", nameKn: "ನಾಯಿ", targetOrder: 1 },
        { id: "cat", symbol: "🐱", nameEn: "Cat", nameKn: "ಬೆಕ್ಕು", targetOrder: 2 },
        { id: "elephant", symbol: "🐘", nameEn: "Elephant", nameKn: "ಆನೆ", targetOrder: null },
        { id: "fish", symbol: "🐟", nameEn: "Fish", nameKn: "ಮೀನು", targetOrder: null },
      ],
    },
    {
      id: "comm2_ag2",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the apple 🍎, then the banana 🍌, then the grapes 🍇",
      promptKn: "ಸೇಬು 🍎, ನಂತರ ಬಾಳೆ 🍌, ನಂತರ ದ್ರಾಕ್ಷಿ 🍇 ಸ್ಪರ್ಶಿಸಿ",
      requiredStepsCount: 3,
      items: [
        { id: "apple", symbol: "🍎", nameEn: "Apple", nameKn: "ಸೇಬು", targetOrder: 1 },
        { id: "banana", symbol: "🍌", nameEn: "Banana", nameKn: "ಬಾಳೆ", targetOrder: 2 },
        { id: "grapes", symbol: "🍇", nameEn: "Grapes", nameKn: "ದ್ರಾಕ್ಷಿ", targetOrder: 3 },
        { id: "mango", symbol: "🥭", nameEn: "Mango", nameKn: "ಮಾವು", targetOrder: null },
      ],
    },
    {
      id: "comm3_ag2",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch only the vehicles: 🚗 🚢",
      promptKn: "ಕೇವಲ ವಾಹನಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ: 🚗 🚢",
      requiredStepsCount: 2,
      items: [
        { id: "car", symbol: "🚗", nameEn: "Car", nameKn: "ಕಾರು", targetOrder: 1 },
        { id: "ship", symbol: "🚢", nameEn: "Ship", nameKn: "ಹಡಗು", targetOrder: 2 },
        { id: "house", symbol: "🏠", nameEn: "House", nameKn: "ಮನೆ", targetOrder: null },
        { id: "tree", symbol: "🌳", nameEn: "Tree", nameKn: "ಮರ", targetOrder: null },
      ],
    },
    {
      id: "comm4_ag2",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the items in alphabetical order: Bird 🐦, Cat 🐱, Dog 🐕",
      promptKn: "ಅಕ್ಷರ ಕ್ರಮದಲ್ಲಿ ಸ್ಪರ್ಶಿಸಿ: Bird 🐦, Cat 🐱, Dog 🐕",
      requiredStepsCount: 3,
      items: [
        { id: "bird", symbol: "🐦", nameEn: "Bird", nameKn: "ಹಕ್ಕಿ", targetOrder: 1 },
        { id: "cat", symbol: "🐱", nameEn: "Cat", nameKn: "ಬೆಕ್ಕು", targetOrder: 2 },
        { id: "dog", symbol: "🐕", nameEn: "Dog", nameKn: "ನಾಯಿ", targetOrder: 3 },
        { id: "elephant", symbol: "🐘", nameEn: "Elephant", nameKn: "ಆನೆ", targetOrder: null },
      ],
    },
    {
      id: "comm5_ag2",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch only fruits: 🍎 🍌 🍇",
      promptKn: "ಕೇವಲ ಹಣ್ಣುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ: 🍎 🍌 🍇",
      requiredStepsCount: 3,
      items: [
        { id: "apple", symbol: "🍎", nameEn: "Apple", nameKn: "ಸೇಬು", targetOrder: 1 },
        { id: "banana", symbol: "🍌", nameEn: "Banana", nameKn: "ಬಾಳೆ", targetOrder: 2 },
        { id: "grapes", symbol: "🍇", nameEn: "Grapes", nameKn: "ದ್ರಾಕ್ಷಿ", targetOrder: 3 },
        { id: "carrot", symbol: "🥕", nameEn: "Carrot (not a fruit)", nameKn: "ಕ್ಯಾರೆಟ್ (ಹಣ್ಣಲ್ಲ)", targetOrder: null },
      ],
    },
  ],
  3: [
    {
      id: "comm1_ag3",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the animals from smallest to largest size 🐜 🐛 🐕 🐘",
      promptKn: "ಚಿಕ್ಕದಿನಿಂದ ದೊಡ್ಡ ಗಾತ್ರದ ಪ್ರಾಣಿಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ 🐜 🐛 🐕 🐘",
      requiredStepsCount: 4,
      items: [
        { id: "ant", symbol: "🐜", nameEn: "Ant", nameKn: "ಇರುವೆ", targetOrder: 1 },
        { id: "caterpillar", symbol: "🐛", nameEn: "Caterpillar", nameKn: "ಕ್ರಿಮಿ", targetOrder: 2 },
        { id: "dog", symbol: "🐕", nameEn: "Dog", nameKn: "ನಾಯಿ", targetOrder: 3 },
        { id: "elephant", symbol: "🐘", nameEn: "Elephant", nameKn: "ಆನೆ", targetOrder: 4 },
      ],
    },
    {
      id: "comm2_ag3",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the animals in reverse alphabetical order: Elephant 🐘 Dog 🐕 Ant 🐜",
      promptKn: "ಉಲ್ಟಾ ಅಕ್ಷರ ಕ್ರಮದಲ್ಲಿ ಪ್ರಾಣಿಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ: Elephant 🐘 Dog 🐕 Ant 🐜",
      requiredStepsCount: 3,
      items: [
        { id: "elephant", symbol: "🐘", nameEn: "Elephant", nameKn: "ಆನೆ", targetOrder: 1 },
        { id: "dog", symbol: "🐕", nameEn: "Dog", nameKn: "ನಾಯಿ", targetOrder: 2 },
        { id: "ant", symbol: "🐜", nameEn: "Ant", nameKn: "ಇರುವೆ", targetOrder: 3 },
      ],
    },
    {
      id: "comm3_ag3",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the planets in order from closest to farthest from the sun: 🌍 ♂️ ♃",
      promptKn: "ಸೂರ್ಯನಿಂದ ಅತ್ಯಂತ ಹತ್ತಿರದಿಂದ ದೂರದ ಕ್ರಮದಲ್ಲಿ ಗ್ರಹಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ: 🌍 ♂️ ♃",
      requiredStepsCount: 3,
      items: [
        { id: "earth", symbol: "🌍", nameEn: "Earth (3rd)", nameKn: "ಭೂಮಿ (3ನೇ)", targetOrder: 1 },
        { id: "mars", symbol: "♂️", nameEn: "Mars (4th)", nameKn: "ಮಂಗಳ (4ನೇ)", targetOrder: 2 },
        { id: "jupiter", symbol: "♃", nameEn: "Jupiter (5th)", nameKn: "ಗುರು (5ನೇ)", targetOrder: 3 },
        { id: "saturn", symbol: "♄", nameEn: "Saturn (6th)", nameKn: "ಶನಿ (6ನೇ)", targetOrder: null },
      ],
    },
    {
      id: "comm4_ag3",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the items that are living things: 🌳 🐕 🪨",
      promptKn: "ಜೀವಂತ ವಸ್ತುಗಳನ್ನು ಮಾತ್ರ ಸ್ಪರ್ಶಿಸಿ: 🌳 🐕 🪨",
      requiredStepsCount: 2,
      items: [
        { id: "tree", symbol: "🌳", nameEn: "Tree (living)", nameKn: "ಮರ (ಜೀವಂತ)", targetOrder: 1 },
        { id: "dog", symbol: "🐕", nameEn: "Dog (living)", nameKn: "ನಾಯಿ (ಜೀವಂತ)", targetOrder: 2 },
        { id: "rock", symbol: "🪨", nameEn: "Rock (not living)", nameKn: "ಕಲ್ಲು (ಜೀವಂತವಲ್ಲ)", targetOrder: null },
        { id: "chair", symbol: "🪑", nameEn: "Chair (not living)", nameKn: "ಕುರ್ಚಿ (ಜೀವಂತವಲ್ಲ)", targetOrder: null },
      ],
    },
    {
      id: "comm5_ag3",
      type: "InstructionFollowQuestion",
      domain: "communication",
      promptEn: "Touch the countries' flags in order of the world cup year they first won: 🇧🇷 🇩🇪 🇮🇹",
      promptKn: "ವಿಶ್ವಕಪ್ ಮೊದಲ ಗೆಲುವಿನ ಕ್ರಮದಲ್ಲಿ ಧ್ವಜಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ: 🇮🇹 🇧🇷 🇩🇪",
      requiredStepsCount: 3,
      items: [
        { id: "italy", symbol: "🇮🇹", nameEn: "Italy (1934)", nameKn: "ಇಟಲಿ (1934)", targetOrder: 1 },
        { id: "brazil", symbol: "🇧🇷", nameEn: "Brazil (1958)", nameKn: "ಬ್ರೆಜಿಲ್ (1958)", targetOrder: 2 },
        { id: "germany", symbol: "🇩🇪", nameEn: "Germany (1954)", nameKn: "ಜರ್ಮನಿ (1954)", targetOrder: null },
        { id: "france", symbol: "🇫🇷", nameEn: "France (1998)", nameKn: "ಫ್ರಾನ್ಸ್ (1998)", targetOrder: null },
      ],
    },
  ],
};

// ── MAIN GENERATOR ─────────────────────────────────────────────────────────────
// Generate adaptive questions based on Level (1,2,3) & Age Group (1,2,3).
// Builds a large pool from all domains, shuffles it, and returns 7 questions.
const generateExamQuestions = (level, ageGroup) => {
  const ag = ageGroup || 2;

  // Pick the matching age-group sub-pool for each domain (fall back to ag 2 if not found)
  const emotionPool = (EMOTION_POOL[ag] || EMOTION_POOL[2]).slice();
  const socialPool  = (SOCIAL_POOL[ag]  || SOCIAL_POOL[2]).slice();
  const cogPool     = (COGNITIVE_POOL[ag] || COGNITIVE_POOL[2]).slice();
  const commPool    = (COMMUNICATION_POOL[ag] || COMMUNICATION_POOL[2]).slice();

  // Combine all pools and shuffle
  const fullPool = [
    ...emotionPool,
    ...socialPool,
    ...cogPool,
    ...commPool,
  ];
  shuffleArray(fullPool);

  // Guarantee at least one question per domain by picking one from each first
  const selected = [];
  const usedIds = new Set();

  const pickOne = (pool) => {
    for (const q of pool) {
      if (!usedIds.has(q.id)) {
        usedIds.add(q.id);
        selected.push(q);
        return;
      }
    }
  };

  // Shuffle each domain pool individually so "first pick" is random
  pickOne(shuffleArray(emotionPool));
  pickOne(shuffleArray(socialPool));
  pickOne(shuffleArray(cogPool));
  pickOne(shuffleArray(commPool));

  // Fill remaining slots (up to 7) from the already-shuffled fullPool
  for (const q of fullPool) {
    if (selected.length >= 7) break;
    if (!usedIds.has(q.id)) {
      usedIds.add(q.id);
      selected.push(q);
    }
  }

  // Assign stable positional IDs so the frontend always sees q1…q7
  return selected.slice(0, 7).map((q, idx) => ({
    ...q,
    id: `q${idx + 1}_${q.domain}`,
    level,
    ageGroup: ag,
  }));
};

// GET /api/exam/questions/:childId
router.get("/questions/:childId", verifyToken, async (req, res) => {
  try {
    let child = null;
    if (req.params.childId && req.params.childId !== "undefined") {
      child = await Child.findById(req.params.childId).catch(() => null);
    }
    const age = child?.age || 6;
    const level = Number(child?.level) || 2;
    const ageGroupNum = getAgeGroupNum(age);

    const questionCount = ageGroupNum === 1 ? 5 : ageGroupNum === 2 ? 8 : 12;
    const timeLimit = ageGroupNum === 1 ? 180 : ageGroupNum === 2 ? 360 : 600;
    const questions = generateExamQuestions(level, ageGroupNum);

    res.json({
      childName: child?.name || "Child",
      childId: child?._id || req.params.childId,
      level,
      age,
      ageGroup: ageGroupNum,
      questions,
      timeLimit,
      totalQuestions: questions.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exam/submit/:childId
router.post("/submit/:childId", verifyToken, async (req, res) => {
  try {
    const { answers, emotionData, timeTaken } = req.body;
    let child = null;
    if (req.params.childId && req.params.childId !== "undefined") {
      child = await Child.findById(req.params.childId).catch(() => null);
    }

    const result = analyseExamResult(answers || [], child);
    const ageGroupNum = getAgeGroupNum(child?.age || 6);

    let examDoc = null;
    if (child && child._id) {
      examDoc = await ExamResult.create({
        child: child._id,
        level: child.level || 2,
        ageGroup: ageGroupNum,
        score: result.score,
        result: result.result,
        correct: result.correct,
        total: result.total,
        domains: result.domains,
        emotionData: emotionData || {},
        timeTaken: timeTaken || 0,
        recommendation: result.recommendation,
        answers: answers || [],
        examDate: new Date(),
        nextExamDate: result.nextExamDate,
      });

      // Update child record
      await Child.findByIdAndUpdate(child._id, {
        lastExamScore: result.score,
        lastExamDate: new Date(),
        lastExamDomains: result.domains,
        examTakenThisWeek: true,
        examTriggeredByTherapist: false,
        $push: { examHistory: examDoc._id },
      });
    }

    res.json({
      success: true,
      result,
      examId: examDoc ? examDoc._id : "mock_exam_123",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exam/submit-challenge/:childId
router.post("/submit-challenge/:childId", verifyToken, async (req, res) => {
  try {
    const {
      gameResults,
      totalStars,
      timeTaken,
      emotionData,
      childLevel,
      childAge
    } = req.body;

    let child = null;
    if (req.params.childId && req.params.childId !== "undefined") {
      child = await Child.findById(req.params.childId).catch(() => null);
    }

    const calculatedStars = totalStars !== undefined
      ? totalStars
      : (gameResults || []).reduce((sum, g) => sum + (g.stars || 0), 0);

    let result = "NEEDS_PRACTICE";
    let recommendation = "";
    let levelUpgradeRecommended = false;
    const childName = child?.name || "Child";
    const currentLvl = child?.level || childLevel || 2;

    if (calculatedStars === 15) {
      result = "MASTERY_ACHIEVED";
      levelUpgradeRecommended = true;
      recommendation = `Outstanding! ${childName} achieved 15/15 stars across all 5 challenge games! Full mastery achieved. Level advancement recommended.`;
    } else if (calculatedStars >= 12) {
      result = "NEAR_MASTERY";
      recommendation = `Great performance! ${childName} earned ${calculatedStars}/15 stars (Near Mastery). Continue Level ${currentLvl} and retake challenge in 3 days.`;
    } else if (calculatedStars >= 8) {
      result = "PROGRESSING";
      recommendation = `Good effort! ${childName} scored ${calculatedStars}/15 stars (Progressing). Continue current daily activities and retake next week.`;
    } else {
      result = "NEEDS_PRACTICE";
      recommendation = `${childName} scored ${calculatedStars}/15 stars (Needs Practice). Extra foundational activities have been assigned automatically to build core mastery.`;
    }

    const percentageScore = Math.round((calculatedStars / 15) * 100);

    let examDoc = null;
    if (child && child._id) {
      examDoc = await ExamResult.create({
        child: child._id,
        level: currentLvl,
        ageGroup: getAgeGroupNum(child.age || childAge || 6),
        score: percentageScore,
        totalStars: calculatedStars,
        result,
        correct: calculatedStars,
        total: 15,
        timeTaken: timeTaken || 0,
        challengeMode: true,
        gameResults: gameResults || [],
        emotionData: emotionData || {},
        recommendation,
        levelUpgradeRecommended,
        therapistNotified: true,
        examDate: new Date(),
        nextExamDate: new Date(Date.now() + (calculatedStars >= 12 ? 3 : 7) * 24 * 60 * 60 * 1000)
      });

      await Child.findByIdAndUpdate(child._id, {
        lastExamScore: percentageScore,
        lastExamDate: new Date(),
        examTakenThisWeek: true,
        examTriggeredByTherapist: false,
        $push: { examHistory: examDoc._id }
      });
    }

    res.json({
      success: true,
      result: {
        stars: calculatedStars,
        maxStars: 15,
        percentage: percentageScore,
        status: result,
        recommendation,
        levelUpgradeRecommended,
        therapistNotified: true,
        gameResults: gameResults || []
      },
      examId: examDoc ? examDoc._id : "mock_challenge_123"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exam/history/:childId
router.get("/history/:childId", verifyToken, async (req, res) => {
  try {
    const exams = await ExamResult.find({ child: req.params.childId }).sort({ examDate: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exam/trigger/:childId
router.post("/trigger/:childId", verifyToken, async (req, res) => {
  try {
    await Child.findByIdAndUpdate(req.params.childId, {
      examTriggeredByTherapist: true,
      examTakenThisWeek: false,
    });
    res.json({ success: true, message: "Weekly progress exam triggered for child" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exam/approve-upgrade/:childId
router.post("/approve-upgrade/:childId", verifyToken, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const newLevel = Math.max(1, (child.level || 2) - 1);
    await Child.findByIdAndUpdate(req.params.childId, {
      level: newLevel,
      examTriggeredByTherapist: false,
    });
    res.json({ success: true, message: `Child upgraded to Level ${newLevel}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
