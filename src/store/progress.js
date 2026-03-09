import { LEVELS, ACHIEVEMENTS, STAGES } from '../data/hangul';

const STORAGE_KEY = 'hangulr_progress';
const DAY_MS = 86400000; // 24 * 60 * 60 * 1000

const defaultProgress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  drawCount: 0,
  achievements: [],
  // Per-letter mastery: { [char]: { seen, correct, stars, easinessFactor, interval, repetitions, nextReview, lastQuality } }
  mastery: {},
  // Per-stage completion (computed from lessonProgress)
  stageProgress: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  // Per-lesson completion: { "stageId-lessonIdx": percentage }
  lessonProgress: {},
  // Per-lesson milestones: { "stageId-lessonIdx": { learned: bool, quizScore: num, drawn: bool } }
  lessonMilestones: {},
  // Which stages are unlocked
  stagesUnlocked: [1],
  // Spaced repetition data for words
  srs: {},
  lastSession: null,
  // Session tracking: array of 'YYYY-MM-DD' date strings
  sessionDates: [],
  // Timed challenge personal bests: { [mode]: { score, date } }
  timedBests: {},
  // Daily challenge tracking
  dailyChallengeDate: null,
  // User settings
  settings: {
    audioEnabled: true,
    drawGuideDefault: true,
  },
};

// --- SM-2 Spaced Repetition Algorithm ---

const DEFAULT_EASINESS = 2.5;
const MIN_EASINESS = 1.3;

/**
 * Quality scoring for SM-2:
 *   0 = complete blackout
 *   1 = wrong but recognized after seeing answer
 *   2 = wrong answer
 *   3 = correct with serious difficulty
 *   4 = correct with minor hesitation
 *   5 = perfect instant recall
 */

/**
 * Map app events to SM-2 quality scores.
 *   wrong  => 2
 *   correct => 4
 *   correct with streak >= 3 => 5
 */
export function mapQuality(correct, currentStreak) {
  if (!correct) return 2;
  if (currentStreak >= 3) return 5;
  return 4;
}

/**
 * Default SRS fields for a card. Merged into existing mastery entries
 * to maintain backward compatibility with seen/correct/stars.
 */
function defaultSrsFields() {
  return {
    easinessFactor: DEFAULT_EASINESS,
    interval: 0,      // days; 0 means never reviewed via SRS yet
    repetitions: 0,
    nextReview: 0,     // timestamp; 0 means immediately due
    lastQuality: null, // 0-5 or null
  };
}

/**
 * Ensure a mastery entry has all SRS fields (backward compat).
 */
function ensureSrsFields(m) {
  const defaults = defaultSrsFields();
  return {
    ...defaults,
    ...m,
  };
}

/**
 * Core SM-2 calculation. Given current card state and a quality grade (0-5),
 * returns the updated SRS fields.
 */
export function sm2(card, quality) {
  let { easinessFactor, interval, repetitions } = card;

  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  if (quality < 3) {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall — advance
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions++;
  }

  // Update easiness factor (applied for all quality values)
  easinessFactor =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < MIN_EASINESS) {
    easinessFactor = MIN_EASINESS;
  }

  const nextReview = Date.now() + interval * DAY_MS;

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReview,
    lastQuality: quality,
  };
}

/**
 * Returns items from mastery that are due for review, sorted by most overdue first.
 *
 * @param {Object} mastery - The progress.mastery object
 * @param {number} count   - Max number of items to return (0 = all due items)
 * @returns {Array<{ char: string, mastery: Object, overdueDays: number }>}
 */
export function getNextReviewItems(mastery, count = 0) {
  const now = Date.now();
  const due = [];

  for (const [char, rawEntry] of Object.entries(mastery)) {
    const entry = ensureSrsFields(rawEntry);

    // Items with nextReview === 0 have never been SRS-scheduled;
    // treat them as immediately due so legacy data gets picked up.
    if (entry.nextReview <= now) {
      const overdueDays =
        entry.nextReview === 0
          ? Infinity // never-scheduled items are maximally overdue
          : (now - entry.nextReview) / DAY_MS;
      due.push({ char, mastery: entry, overdueDays });
    }
  }

  // Sort: most overdue first
  due.sort((a, b) => b.overdueDays - a.overdueDays);

  if (count > 0) {
    return due.slice(0, count);
  }
  return due;
}

// --- Existing helpers (unchanged API) ---

export function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultProgress, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load progress:', e);
  }
  return { ...defaultProgress };
}

export function saveProgress(progress) {
  try {
    progress.lastSession = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

export function getLevel(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.minXp > xp);
  const xpForNext = nextLevel ? nextLevel.minXp - xp : 0;
  const xpInLevel = nextLevel ? xp - current.minXp : 0;
  const xpNeeded = nextLevel ? nextLevel.minXp - current.minXp : 1;
  return { ...current, xpForNext, progress: xpInLevel / xpNeeded };
}

export function getStars(mastery) {
  if (!mastery || mastery.seen === 0) return 0;
  const ratio = mastery.correct / mastery.seen;
  if (mastery.seen >= 5 && ratio >= 0.9) return 3;
  if (mastery.seen >= 3 && ratio >= 0.7) return 2;
  if (mastery.seen >= 1 && ratio >= 0.5) return 1;
  return 0;
}

export function recordAnswer(progress, char, correct) {
  const raw = progress.mastery[char] || { seen: 0, correct: 0, stars: 0 };
  const m = ensureSrsFields(raw);

  // Update legacy fields
  m.seen++;
  if (correct) {
    m.correct++;
    progress.totalCorrect++;
    progress.streak++;
    progress.xp += 3 + Math.min(progress.streak, 5); // small streak bonus
    if (progress.streak > progress.bestStreak) {
      progress.bestStreak = progress.streak;
    }
  } else {
    progress.streak = 0;
  }
  m.stars = getStars(m);
  progress.totalAttempts++;

  // Update SRS fields via SM-2
  const quality = mapQuality(correct, progress.streak);
  const srsUpdate = sm2(m, quality);
  m.easinessFactor = srsUpdate.easinessFactor;
  m.interval = srsUpdate.interval;
  m.repetitions = srsUpdate.repetitions;
  m.nextReview = srsUpdate.nextReview;
  m.lastQuality = srsUpdate.lastQuality;

  progress.mastery[char] = m;
  // Auto-record session on any answer
  recordSession(progress);
  return progress;
}

export function addXp(progress, amount) {
  progress.xp += amount;
  return progress;
}

export function checkAchievements(progress) {
  const newAchievements = [];
  const earned = new Set(progress.achievements);

  const checks = {
    first_letter: () => Object.keys(progress.mastery).length >= 1,
    all_vowels: () => {
      const vowels = 'ㅏㅓㅗㅜㅡㅣㅑㅕㅛㅠ'.split('');
      return vowels.every(v => progress.mastery[v]?.stars >= 1);
    },
    all_consonants: () => {
      const cons = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'.split('');
      return cons.every(c => progress.mastery[c]?.stars >= 1);
    },
    first_syllable: () => progress.stageProgress[3] > 0,
    first_word: () => progress.stageProgress[5] > 0,
    perfect_quiz: () => progress.streak >= 5,
    streak_3: () => progress.bestStreak >= 3,
    streak_10: () => progress.bestStreak >= 10,
    draw_10: () => progress.drawCount >= 10,
    daily_3: () => getDailyStreak(progress.sessionDates) >= 3,
    daily_7: () => getDailyStreak(progress.sessionDates) >= 7,
    blitz_20: () => progress.timedBests?.blitz30?.score >= 20,
    all_stages: () => STAGES.every(s => (progress.stageProgress[s.id] || 0) >= 80),
  };

  for (const [id, check] of Object.entries(checks)) {
    if (!earned.has(id) && check()) {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        progress.achievements.push(id);
        progress.xp += achievement.xp;
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}

export function unlockNextStage(progress, stageId) {
  if (!progress.stagesUnlocked.includes(stageId + 1) && stageId < 6) {
    progress.stagesUnlocked.push(stageId + 1);
  }
  return progress;
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...defaultProgress };
}

// --- Session tracking & daily streaks ---

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record that a session happened today.
 * Call this when the user completes a quiz, review, or learning session.
 */
export function recordSession(progress) {
  const today = todayStr();
  if (!progress.sessionDates) progress.sessionDates = [];
  if (!progress.sessionDates.includes(today)) {
    progress.sessionDates = [...progress.sessionDates, today];
  }
  return progress;
}

/**
 * Calculate the current daily streak from session dates.
 * A streak is consecutive days ending at today (or yesterday if no session today yet).
 */
export function getDailyStreak(sessionDates = []) {
  if (sessionDates.length === 0) return 0;
  const sorted = [...new Set(sessionDates)].sort().reverse();
  const today = todayStr();
  const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);

  // Must have studied today or yesterday to have an active streak
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (prev - curr) / DAY_MS;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get session dates for the last N days (for calendar heatmap).
 */
export function getSessionHeatmap(sessionDates = [], days = 90) {
  const result = [];
  const dateSet = new Set(sessionDates);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const str = d.toISOString().slice(0, 10);
    result.push({ date: str, active: dateSet.has(str), day: d.getDay() });
  }
  return result;
}

/**
 * Update timed challenge personal best.
 */
export function updateTimedBest(progress, mode, score) {
  if (!progress.timedBests) progress.timedBests = {};
  const current = progress.timedBests[mode];
  if (!current || score > current.score) {
    progress.timedBests[mode] = { score, date: todayStr() };
  }
  return progress;
}

/**
 * Update a setting value.
 */
export function updateSetting(progress, key, value) {
  if (!progress.settings) progress.settings = { audioEnabled: true, drawGuideDefault: true };
  progress.settings = { ...progress.settings, [key]: value };
  return progress;
}
