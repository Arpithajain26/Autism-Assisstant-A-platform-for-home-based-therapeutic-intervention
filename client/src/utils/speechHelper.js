/**
 * speechHelper.js — Therapeutic Voice Audio Companion for Autism Assistant
 * 
 * Provides calming, gentle, and enthusiastic audio narration at every game phase:
 *  1. Game Start: Audio automatically reads instructions
 *  2. In-Game: Random periodic encouragement
 *  3. Correct Move: Enthusiastic celebration audio
 *  4. Mistake / Wrong Move: Gentle, supportive guidance
 *  5. Game Completion: Summary and score praise
 */

let isMuted = false;

export const setVoiceMuted = (muted) => {
  isMuted = muted;
  if (muted && typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const getVoiceMuted = () => isMuted;

export const speak = (text, lang = "en", options = {}) => {
  if (isMuted || !text || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "kn" ? "kn-IN" : "en-US";
    utterance.rate = options.rate || 0.88; // Gentle, clear pacing for neurodivergent kids
    utterance.pitch = options.pitch || 1.15; // Friendly, warm pitch
    utterance.volume = options.volume || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find((v) => 
        lang === "kn" ? v.lang.includes("kn") : (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.lang.includes("en"))
      );
      if (match) utterance.voice = match;
    }

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
};

// 1. Game Start Instructions
export const speakInstruction = (text, lang = "en") => {
  speak(text, lang, { rate: 0.85, pitch: 1.1 });
};

// 2. Mid-Game Encouragements
const ENCOURAGEMENTS_EN = [
  "Great job! Keep going!",
  "You are doing awesome!",
  "Super focus! Keep it up!",
  "You're doing fantastic!",
  "Look at you go! Wonderful!"
];

const ENCOURAGEMENTS_KN = [
  "ತುಂಬಾ ಒಳ್ಳೆಯದು! ಮುಂದುವರಿಸಿ!",
  "ನೀವು ಅದ್ಭುತವಾಗಿ ಮಾಡುತ್ತಿದ್ದೀರಿ!",
  "ಉತ್ತಮ ಪ್ರಯತ್ನ! ಹೀಗೆ ಮುಂದುವರಿಸಿ!"
];

export const speakEncouragement = (lang = "en") => {
  const list = lang === "kn" ? ENCOURAGEMENTS_KN : ENCOURAGEMENTS_EN;
  const pick = list[Math.floor(Math.random() * list.length)];
  speak(pick, lang, { rate: 0.9, pitch: 1.2 });
};

// 3. Correct Answer Celebrations
const CELEBRATIONS_EN = [
  "Excellent! Well done!",
  "Spot on! Fantastic!",
  "Yay! You got it right!",
  "Super star! That's correct!",
  "Brilliant work!"
];

const CELEBRATIONS_KN = [
  "ಅತ್ಯುತ್ತಮ! ಸರಿ ಉತ್ತರ!",
  "ಶಾಬಾಷ್! ಅದ್ಭುತ ಕೆಲಸ!",
  "ಹೌದು! ಸರಿಯಾಗಿದೆ!"
];

export const speakCelebration = (lang = "en") => {
  const list = lang === "kn" ? CELEBRATIONS_KN : CELEBRATIONS_EN;
  const pick = list[Math.floor(Math.random() * list.length)];
  speak(pick, lang, { rate: 0.92, pitch: 1.25 });
};

// 4. Wrong Answer Gentle Guidance
const GUIDANCE_EN = [
  "Try again! You can do it!",
  "Almost there! Give it another try!",
  "Take your time, let's try once more!",
  "Good try! Let's pick again!"
];

const GUIDANCE_KN = [
  "ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ! ನೀವು ಮಾಡಬಹುದು!",
  "ಸನಿಹದಲ್ಲಿದ್ದೀರಿ! ಇನ್ನೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ!"
];

export const speakGentleGuidance = (lang = "en") => {
  const list = lang === "kn" ? GUIDANCE_KN : GUIDANCE_EN;
  const pick = list[Math.floor(Math.random() * list.length)];
  speak(pick, lang, { rate: 0.82, pitch: 1.05 });
};

// 5. Game Summary Praise
export const speakGameSummary = (score, summaryText, lang = "en") => {
  let message = "";
  if (lang === "kn") {
    message = `ಅದ್ಭುತ! ನೀವು ಆಟವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿದ್ದೀರಿ! ${summaryText || ""}`;
  } else {
    message = `Amazing! You finished the game with a great score! ${summaryText || "Well done champion!"}`;
  }
  speak(message, lang, { rate: 0.88, pitch: 1.2 });
};
