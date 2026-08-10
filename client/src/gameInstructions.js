const gameInstructions = {
  a1: {
    title: "Mirror Play",
    en: "Make faces in front of a mirror. Parent names each emotion and child copies.",
    kn: "ಕಾಣpiegel: ಮುಖಭಾವಗಳನ್ನು ಮಾಡಿ. ಪಾಲಕರು ಪ್ರತಿ ಭಾವನೆಯನ್ನು ಹೆಸರಿಸುತ್ತದೆ ಮತ್ತು ಮಗುವು ನಂತರ ನಕಲಿಸುತ್ತದೆ.",
  },
  a6: {
    title: "Story Builder",
    en: "Drag the 4 picture cards into the correct story order, then press Play Story to watch the narration.",
    kn: "4 ಚಿತ್ರ ಕಾರ್ಡ್‌ಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಎಳೆಯಿರಿ ಮತ್ತು 'ಕಥೆ ಪ್ಲೇ' ಒತ್ತಿ.",
  },
  a7: {
    title: "Describe and Find",
    en: "Listen to the audio clue and tap the picture that matches the description.",
    kn: "ಧ್ವನಿ ಸೂಚನೆಯನ್ನು ಕೇಳಿ ಮತ್ತು ವಿವರಣೆಗೆ ತಕ್ಕ ಚಿತ್ರವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.",
  },
  b1: {
    title: "Emotion Flashcards",
    en: "Pick the emotion that matches the face. There is 1 question per card and 4 options. Answer all to complete.",
    kn: "ಮುಗುವಿನೊಂದಿಗೆ ಹೊಂದುವ ಭಾವನೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ಪ್ರತಿ ಕಾರ್ಡ್‌ಗಾಗಿ 1 ಪ್ರಶ್ನೆ ಮತ್ತು 4 ಆಯ್ಕೆಗಳು ಇವೆ. ಎಲ್ಲವನ್ನೂ ಉತ್ತರಿಸಿದರೆ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ.",
    flashcards: [
      { id: 1, prompt: "Which emotion is shown?", options: ["Happy", "Sad", "Angry", "Surprised"], correctIndex: 0 },
      { id: 2, prompt: "Which emotion is shown?", options: ["Sad", "Happy", "Scared", "Disgusted"], correctIndex: 1 },
      { id: 3, prompt: "Which emotion is shown?", options: ["Surprised", "Angry", "Happy", "Sad"], correctIndex: 0 },
    ],
  },
  b6: {
    title: "Memory Match Cards",
    en: "Flip two cards to find matching pairs. Find all pairs to finish the game.",
    kn: "ಎರಡು ಕಾರ್ಡ್‌ಗಳನ್ನು ತಿರುಗಿಸಿ ಮತ್ತು ಹೊಂದಾಣಿಕೆ ಜೋಡಿಗಳನ್ನು ಹುಡುಕಿ. ಎಲ್ಲ ಜೋಡಿಗಳನ್ನೂ ಕಂಡುಹಿಡಿದರೆ ಆಟ ಮುಗಿಯುತ್ತದೆ.",
  },
  // fallback descriptions for other activities
};

export default gameInstructions;
