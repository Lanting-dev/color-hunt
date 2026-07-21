// Single-player persistence (localStorage). Phase 1 diary/streak build on this.

const KEY = 'colorhunt.v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { entries: {} };
  } catch {
    return { entries: {} };
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save (storage full?)', e);
  }
}

export function getEntry(day) {
  return load().entries[day] || null;
}

export function saveEntry(day, entry) {
  const s = load();
  s.entries[day] = entry;
  save(s);
}

export function mergeEntries(entries) {
  const s = load();
  for (const entry of entries) {
    if (entry?.day == null) continue;
    s.entries[entry.day] = { ...(s.entries[entry.day] || {}), ...entry };
  }
  save(s);
}

export function clearEntry(day) {
  const s = load();
  delete s.entries[day];
  save(s);
}

export function allEntries() {
  const s = load();
  return Object.entries(s.entries)
    .map(([day, e]) => ({ day: +day, ...e }))
    .sort((a, b) => b.day - a.day);
}
