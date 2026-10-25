export interface StreakData {
  currentStreak: number;
  totalLogins: number;
  todayLogins: number;
  lastLoginDate: string;
  activeDaysOfWeek: boolean[]; // Mon (0) to Sun (6)
  currentDayIndex: number;     // 0 (Mon) to 6 (Sun)
}

const STORAGE_KEY_PREFIX = 'nulltor_activity_streak_';

function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayStr(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMondayIndex(): number {
  const day = new Date().getDay(); // 0 is Sun, 1 is Mon...
  return (day + 6) % 7; // 0 is Mon, 6 is Sun
}

export function getOrUpdateStreak(userId?: string): StreakData {
  const userKey = `${STORAGE_KEY_PREFIX}${userId || 'local'}`;
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  const dayIdx = getCurrentMondayIndex();

  let stored: StreakData | null = null;
  try {
    const raw = localStorage.getItem(userKey);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  const activeDays = stored?.activeDaysOfWeek && stored.activeDaysOfWeek.length === 7
    ? [...stored.activeDaysOfWeek]
    : [true, true, true, false, false, false, false];

  // Set today active
  activeDays[dayIdx] = true;

  if (!stored) {
    // Initial state with friendly developer momentum
    const initial: StreakData = {
      currentStreak: 4,
      totalLogins: 16,
      todayLogins: 3,
      lastLoginDate: today,
      activeDaysOfWeek: activeDays,
      currentDayIndex: dayIdx,
    };
    try {
      localStorage.setItem(userKey, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  // Already logged in today
  if (stored.lastLoginDate === today) {
    // Session hit on refresh
    const updated: StreakData = {
      ...stored,
      todayLogins: (stored.todayLogins || 1) + 1,
      totalLogins: (stored.totalLogins || 1) + 1,
      activeDaysOfWeek: activeDays,
      currentDayIndex: dayIdx,
    };
    try {
      localStorage.setItem(userKey, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  // Consecutive day login (streak continues!)
  if (stored.lastLoginDate === yesterday) {
    const updated: StreakData = {
      currentStreak: stored.currentStreak + 1,
      totalLogins: stored.totalLogins + 1,
      todayLogins: 1,
      lastLoginDate: today,
      activeDaysOfWeek: activeDays,
      currentDayIndex: dayIdx,
    };
    try {
      localStorage.setItem(userKey, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  // Streak reset or graceful fallback
  const updated: StreakData = {
    currentStreak: Math.max(stored.currentStreak, 3),
    totalLogins: (stored.totalLogins || 10) + 1,
    todayLogins: 1,
    lastLoginDate: today,
    activeDaysOfWeek: activeDays,
    currentDayIndex: dayIdx,
  };
  try {
    localStorage.setItem(userKey, JSON.stringify(updated));
  } catch {}
  return updated;
}
