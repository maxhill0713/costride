// Week swap state persisted in localStorage
// Tracks when a user trains on a rest day, granting them one future rest-day swap credit
// Also tracks "move today's workout to a future rest day" (rest swap)

function getWeekKey() {
  const now = new Date();
  const monday = new Date(now);
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

const LS_KEY = 'weekSwaps';

export function getWeekSwaps() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Reset if it's a new week
    if (data.week !== getWeekKey()) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...data, week: getWeekKey() }));
  } catch {}
}

// Call when user logs a workout on a day that is NOT in their training_days
export function recordTrainedOnRestDay(restDayNum) {
  const current = getWeekSwaps();
  // Only record once per week (first swap wins)
  if (current?.trainedOnRestDay) return;
  save({ trainedOnRestDay: restDayNum, usedRestDayCredit: false, swappedRestDay: null });
}

// Call when user picks a future rest day to swap (use up their credit)
export function useRestDayCredit(targetRestDay) {
  const current = getWeekSwaps();
  if (!current) return;
  save({ ...current, usedRestDayCredit: true, swappedRestDay: targetRestDay });
}

// Returns which rest day was swapped to a training day this week (or null)
export function getSwappedRestDay() {
  const data = getWeekSwaps();
  if (!data?.usedRestDayCredit) return null;
  return data.swappedRestDay ?? null;
}

// Returns true if user has an unused rest-day swap credit
export function hasRestDayCredit() {
  const data = getWeekSwaps();
  return !!(data?.trainedOnRestDay && !data.usedRestDayCredit);
}

// ── Rest Swap: move today's workout to a future rest day ──────────────────────
// Key stored separately so it doesn't interfere with the rest-day credit system
const RS_KEY = 'restSwap';

function getRSWeekKey() {
  return getWeekKey();
}

export function getRestSwap() {
  try {
    const raw = localStorage.getItem(RS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.week !== getRSWeekKey()) {
      localStorage.removeItem(RS_KEY);
      return null;
    }
    return data; // { week, fromDay, toDay }
  } catch {
    return null;
  }
}

// Call when user swaps today's workout to a future rest day.
// fromDay = today's dayNum (1-7), toDay = the future rest day number
export function recordRestSwap(fromDay, toDay) {
  try {
    localStorage.setItem(RS_KEY, JSON.stringify({ week: getRSWeekKey(), fromDay, toDay }));
  } catch {}
}

export function clearRestSwap() {
  try { localStorage.removeItem(RS_KEY); } catch {}
}