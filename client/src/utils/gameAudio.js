/**
 * gameAudio.js — Complete Audio System for Autism Therapy Games
 * Uses Web Speech API (SpeechSynthesis) — works in all modern browsers
 * Supports English (en-IN) and Kannada (kn-IN)
 */

export const speak = (text, lang = "en") => {
  if (!text) return;
  if (localStorage.getItem("game_audio_enabled") === "false") return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate   = 0.85;
  u.pitch  = 1.1;
  u.volume = 1.0;
  u.lang   = lang === "kn" ? "kn-IN" : "en-IN";
  window.speechSynthesis.speak(u);
};

export const stopSpeech = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const AUDIO_TEXTS = {
  en: {
    bubblePop:    { start:"Pop all the bubbles! Tap each one before it floats away!", correct:"Pop! Amazing!", end:(s)=>`Wonderful! You popped ${s} bubbles!` },
    memoryMatch:  { start:"Find the matching pairs! Tap two cards to flip them!", match:"Great match! Well done!", end:(m)=>`Brilliant! All pairs found in ${m} moves!` },
    colorSort:    { start:"Sort the colors! Put each item in the right colored bucket!", correct:"Perfect sort!", wrong:"Try a different bucket!", end:(s)=>`Amazing! You sorted ${s} items!` },
    simonSays:    { start:"Watch the pattern then copy it in the same order!", yourTurn:"Your turn now!", correct:"You remembered it!", end:(r)=>`Wow! You reached round ${r}!` },
    emotionMatch: { start:"Look at the face! How is this person feeling?", correct:"Yes! That is right!", wrong:"Look at the eyes and mouth carefully!", end:(s)=>`Great! You got ${s} emotions right!` },
    yesNo:        { start:"Listen to the question! Press YES or NO!", correct:"Correct!", wrong:"Try again!", end:(s)=>`You got ${s} right!` },
    turntaking:   { start:"Wait for your turn then click when it says YOUR TURN!", wait:"Wait...", go:"Your turn! Go!", correct:"Great waiting!" },
    peekaboo:     { start:"Click the curtain to play peek a boo!", reveal:"Peek a boo! I see you!" },
    carRamp:      { start:"Press PUSH to send the car down the ramp!", push:"Wheee! Watch it go!" },
    storyBuilder: { start:"Arrange the pictures to tell a story!", correct:"Right! Good thinking!", end:"Perfect story arrangement!" },
    wordBuilder:  { start:"Spell the word using the letters! Look at the picture for a clue!", correct:"Excellent spelling!", end:"Amazing! All words spelled!" },
    encouragements: ["You are doing great!","Keep going! You can do it!","Wonderful effort!","Super star!","I am so proud of you!","Brilliant!","You are amazing!"],
    celebrations:   ["Hooray! You did it!","Fantastic job!","You are a champion!","What a superstar!","Your hard work paid off!"],
  },
  kn: {
    bubblePop:    { start:"ಗುಳ್ಳೆಗಳನ್ನು ಒಡೆಯಿರಿ! ಪ್ರತಿ ಗುಳ್ಳೆ ತಟ್ಟಿ!", correct:"ಪಾಪ್! ಭಲೇ!", end:(s)=>`ಅದ್ಭುತ! ${s} ಗುಳ್ಳೆ ಒಡೆದಿರಿ!` },
    memoryMatch:  { start:"ಹೊಂದಾಣಿಕೆ ಜೋಡಿ ಹುಡುಕಿ! ಎರಡು ಕಾರ್ಡ್ ತಟ್ಟಿ!", match:"ಭಲೇ ಹೊಂದಾಣಿಕೆ!", end:(m)=>`ಶಾಬಾಷ್! ${m} ಚಲನೆಯಲ್ಲಿ ಮುಗಿದಿದೆ!` },
    colorSort:    { start:"ಬಣ್ಣಗಳನ್ನು ವಿಂಗಡಿಸಿ!", correct:"ಅತ್ಯುತ್ತಮ!", wrong:"ಮತ್ತೊಂದು ಬಕೆಟ್ ಪ್ರಯತ್ನಿಸಿ!", end:(s)=>`ಅದ್ಭುತ! ${s} ವಸ್ತುಗಳನ್ನು ವಿಂಗಡಿಸಿದಿರಿ!` },
    emotionMatch: { start:"ಮುಖವನ್ನು ನೋಡಿ! ಈ ವ್ಯಕ್ತಿ ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದಾರೆ?", correct:"ಹೌದು! ಸರಿಯಾಗಿದೆ!", wrong:"ಕಣ್ಣುಗಳು ಮತ್ತು ಬಾಯಿಯನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ನೋಡಿ!", end:(s)=>`ಭಲೇ! ${s} ಭಾವನೆಗಳು ಸರಿ!` },
    encouragements: ["ನೀವು ಚೆನ್ನಾಗಿ ಮಾಡುತ್ತಿದ್ದೀರಿ!","ಮುಂದುವರಿಯಿರಿ!","ಅದ್ಭುತ ಪ್ರಯತ್ನ!","ಸೂಪರ್ ಸ್ಟಾರ್!","ಶಾಬಾಷ್!"],
    celebrations:   ["ಹುರ್ರೇ! ಮಾಡಿದಿರಿ!","ಅದ್ಭುತ ಕೆಲಸ!","ನೀವು ಚಾಂಪಿಯನ್!"],
  },
};

export const getGameAudio = (gameId, lang = "en") =>
  AUDIO_TEXTS[lang]?.[gameId] || AUDIO_TEXTS.en[gameId];

export const speakEncouragement = (lang = "en") => {
  const list = AUDIO_TEXTS[lang]?.encouragements || AUDIO_TEXTS.en.encouragements;
  speak(list[Math.floor(Math.random() * list.length)], lang);
};

export const speakCelebration = (lang = "en") => {
  const list = AUDIO_TEXTS[lang]?.celebrations || AUDIO_TEXTS.en.celebrations;
  speak(list[Math.floor(Math.random() * list.length)], lang);
};

export const startAutoEncouragement = (lang = "en") =>
  setInterval(() => speakEncouragement(lang), 30000);

export const stopAutoEncouragement = (id) => clearInterval(id);

export const toggleGameAudio = () => {
  const current = localStorage.getItem("game_audio_enabled") !== "false";
  const next = !current;
  localStorage.setItem("game_audio_enabled", next ? "true" : "false");
  if (!next) stopSpeech();
  return next;
};

export const isGameAudioEnabled = () =>
  localStorage.getItem("game_audio_enabled") !== "false";
