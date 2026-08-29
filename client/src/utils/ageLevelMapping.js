// ─────────────────────────────────────────────────────────────
// Age-Based Level Mapping Utility
// ─────────────────────────────────────────────────────────────
// Maps (childAge, currentLevel) → descriptive difficulty tier.
// The numeric level (1/2/3) is preserved everywhere internally;
// this module only provides display labels, colors, and emojis.
// ─────────────────────────────────────────────────────────────

/**
 * Difficulty tier definitions with colors, emojis, and Kannada labels.
 */
export const DIFFICULTY_TIERS = {
  Beginner:     { label: "Beginner",     labelKn: "ಆರಂಭಿಕ",       emoji: "🌱", color: "#22c55e", bgColor: "#dcfce7", textColor: "#166534" },
  Elementary:   { label: "Elementary",   labelKn: "ಪ್ರಾಥಮಿಕ",     emoji: "🌿", color: "#3b82f6", bgColor: "#dbeafe", textColor: "#1e40af" },
  Intermediate: { label: "Intermediate", labelKn: "ಮಧ್ಯಮ",        emoji: "🌳", color: "#f59e0b", bgColor: "#fef9c3", textColor: "#854d0e" },
  Advanced:     { label: "Advanced",     labelKn: "ಮುಂದುವರಿದ",   emoji: "🚀", color: "#8b5cf6", bgColor: "#ede9fe", textColor: "#5b21b6" },
  Expert:       { label: "Expert",       labelKn: "ಪರಿಣಿತ",       emoji: "👑", color: "#ef4444", bgColor: "#fee2e2", textColor: "#991b1b" },
};

/**
 * The core mapping table.
 * Key = age group string, Value = array of tier keys for levels [1, 2, 3].
 */
const AGE_LEVEL_MAP = {
  "2-5":  ["Beginner",     "Elementary",   "Intermediate"],
  "5-8":  ["Elementary",   "Intermediate", "Advanced"],
  "9-12": ["Intermediate", "Advanced",     "Expert"],
};

/**
 * Returns the age group string for a given age.
 * @param {number} age - Child's age in years.
 * @returns {"2-5" | "5-8" | "9-12"}
 */
export function getAgeGroup(age) {
  const numAge = Number(age) || 6;
  if (numAge <= 5) return "2-5";
  if (numAge <= 8) return "5-8";
  return "9-12";
}

/**
 * Returns the full difficulty tier config for a given age and level.
 *
 * @param {number} age   - Child's age in years (2–12).
 * @param {number} level - Current level (1, 2, or 3).
 * @returns {{ label: string, labelKn: string, emoji: string, color: string,
 *             bgColor: string, textColor: string, ageGroup: string, level: number }}
 */
export function getAgeLevelConfig(age, level) {
  const ageGroup = getAgeGroup(age);
  const clampedLevel = Math.max(1, Math.min(3, Number(level) || 1));
  const tierKey = AGE_LEVEL_MAP[ageGroup][clampedLevel - 1];
  const tier = DIFFICULTY_TIERS[tierKey];

  return {
    ...tier,
    ageGroup,
    level: clampedLevel,
  };
}

/**
 * Returns all three tier configs for a given age (levels 1, 2, 3).
 * Useful for rendering tab labels.
 *
 * @param {number} age - Child's age in years.
 * @returns {Array<{ label: string, labelKn: string, emoji: string, color: string,
 *                    bgColor: string, textColor: string, ageGroup: string, level: number }>}
 */
export function getAllLevelConfigs(age) {
  return [1, 2, 3].map((lvl) => getAgeLevelConfig(age, lvl));
}
