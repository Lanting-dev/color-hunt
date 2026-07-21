// "Painting of the day" — deterministic, same for everyone (Wordle-style).

const EPOCH = Date.UTC(2026, 0, 1); // day 0

export function dayNumber(date = new Date()) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - EPOCH) / 86400000);
}

// inverse of dayNumber: a day index -> its UTC calendar date (used by the
// Collection calendar to place each entry on the right square).
export function dateFromDayNumber(day) {
  return new Date(EPOCH + day * 86400000);
}

// Weekly cadence (PRD §4): one painting per CALENDAR week (Mon–Sun); its palette
// is spread one-color-per-weekday. `day` stays the unique per-day key (entries,
// calendar placement); `weekday` (Mon=0…Sun=6) selects today's color.
export function pickDaily(paintings, date = new Date()) {
  const day = dayNumber(date);
  const weekday = (date.getDay() + 6) % 7;   // Mon=0 … Sun=6 (local, like dayNumber)
  const week = Math.floor((day - weekday) / 7); // index of this Mon–Sun week
  const n = paintings.length;
  const idx = ((week % n) + n) % n;
  return { painting: paintings[idx], day, week, weekday };
}
