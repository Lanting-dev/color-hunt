import paintings from './data/paintings.json';
import { pickDaily, dateFromDayNumber } from './daily.js';
import { rgbToLab } from './color/convert.js';
import { paletteFromFile } from './color/extract.js';
import { scoreColor } from './color/score.js';
import { getEntry, saveEntry, clearEntry, allEntries } from './state.js';
import { scoreBucket, track } from './analytics.js';

const app = document.getElementById('app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed.', err);
    });
  });
}

// ---- today's painting + today's ONE color -----------------------------------
const params = new URLSearchParams(location.search);
// ?date=YYYY-MM-DD time-travels to preview any day's pick (no waiting/clock change)
const dateParam = params.get('date');
const viewDate = dateParam ? new Date(dateParam + 'T12:00:00Z') : new Date();
const { painting, day, weekday } = pickDaily(paintings, viewDate);
// allow ?p=<id> to preview a specific painting
const forced = params.get('p');
const active = (forced && paintings.find((p) => p.id === forced)) || painting;
const imgSrc = '/' + active.image;

const palette = active.palette;
// this week's palette, ordered by chroma (most iconic first) so a day never
// lands on a dull near-neutral; today's ONE color = this weekday's entry.
const byChroma = [...palette].sort(
  (A, B) => Math.hypot(B.lab[1], B.lab[2]) - Math.hypot(A.lab[1], A.lab[2])
);
const todayColor = byChroma[((weekday % byChroma.length) + byChroma.length) % byChroma.length];
const { r, g, b } = hexToRgb(todayColor.hex);

// UI accent stays the locked Vermeer blue (design system); content carries color.
const dateStr = viewDate.toLocaleDateString('en-US', dateParam
  ? { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }
  : { weekday: 'long', month: 'long', day: 'numeric' });

// last name of today's master, for the warmest caption ("…as Vermeer")
const artistLast = (active.artist || '').trim().split(/\s+/).pop() || 'the master';

const baseAnalyticsProps = {
  day,
  painting_id: active.id,
  color_hex: todayColor.hex,
};

// Warm, never-punishing copy that scales with the score (PRD §5.5).
function matchCaption(score) {
  if (score >= 90) return `Uncanny — the same light as ${artistLast}.`;
  if (score >= 75) return 'So close. The masters would nod.';
  if (score >= 60) return 'A clear echo. Nicely seen.';
  if (score >= 40) return 'A quiet rhyme. Keep looking.';
  if (score >= 20) return "A distant cousin of today's color.";
  return 'A world apart — but it still counts.';
}

// ---- tiny helpers -----------------------------------------------------------
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}
function icon(name) {
  const p = {
    collection: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    profile: '<path d="M15 13a3 3 0 1 0-6 0"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="12" cy="8" r="2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    art: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    chev: '<path d="m15 18-6-6 6-6"/>',
  }[name];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}
function nav(active = 'home') {
  const item = (tab, label, ic) =>
    `<button class="item${tab === active ? ' active' : ''}" data-tab="${tab}"><span>${icon(ic)}</span>${label}</button>`;
  return `<nav class="nav">
    ${item('collection', 'Collection', 'collection')}
    ${item('home', 'Home', 'home')}
    ${item('profile', 'Profile', 'profile')}
  </nav>`;
}

// wire the bottom nav for the current screen. Home returns to today's screen
// (chip if not found yet, else Your Color); the rest are stubbed for now.
function wireNav() {
  app.querySelectorAll('.nav .item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === 'home') showToday();
      else if (tab === 'collection') renderCollection();
      else toast('Profile — coming soon');
    });
  });
}

// small transient message for not-yet-built tabs
let toastTimer;
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = el('<div class="toast"></div>'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

// hidden file input (Capture your color)
const fileInput = el('<input type="file" accept="image/*" capture="environment" hidden>');
document.body.appendChild(fileInput);
fileInput.addEventListener('change', onPhoto);

// Where does today's color actually live in the painting? Computed from the real
// image as the densest concentration of the color (not the cluster centroid), so
// the pin + zoom land on a spot that truly IS that color. Runs once on load.
let pin = null;
function placePin() {
  const px = pin ? pin.x : 0.5, py = pin ? pin.y : 0.5;
  const artEl = app.querySelector('#card .art');
  if (artEl) artEl.style.transformOrigin = `${px * 100}% ${py * 100}%`;
  const pinEl = app.querySelector('#pin');
  if (pinEl) {
    pinEl.style.left = px * 100 + '%';
    pinEl.style.top = py * 100 + '%';
    pinEl.style.borderColor = todayColor.hex;
    pinEl.style.visibility = pin ? '' : 'hidden'; // hide until we've located it
  }
}
locateColor((res) => { pin = res || { x: 0.5, y: 0.5 }; placePin(); });

// ---- screen: HOME (chip <-> reveal) -----------------------------------------
function renderHome() {
  track('hunt_opened', baseAnalyticsProps);
  app.className = 'screen-home';
  app.innerHTML = '';

  const wrap = el(`<div style="display:contents"></div>`);
  wrap.innerHTML = `
    <div class="title"><div class="date">${dateStr}</div><h1>Today's Color</h1></div>
    <div class="card" id="card">
      <div class="fill" style="background:${todayColor.hex}"></div>
      <div class="art" style="background-image:url('${imgSrc}')"></div>
      <div class="pill" id="pill">Tap to see its source</div>
      <div class="pin" id="pin"></div>
      <div class="strip" style="background:${todayColor.hex}">
        <div class="vals" style="color:var(--ink)">HEX ${todayColor.hex.toUpperCase()}<br>RGB ${r}, ${g}, ${b}</div>
      </div>
    </div>
    <button class="cta" id="cta">Capture your color</button>
    ${nav()}
  `;
  app.append(...wrap.childNodes);

  // chip strip = light with dark text; overwrite the shared strip styles for chip
  const strip = app.querySelector('.strip');
  strip.style.background = 'var(--ink)';
  strip.querySelector('.vals').style.color = todayColor.hex;

  const card = app.querySelector('#card');
  const pill = app.querySelector('#pill');
  // the reveal zooms the painting into the exact spot the color lives; the pin
  // and zoom origin both come from placePin() (updates when located).
  placePin();

  let revealed = false;
  card.addEventListener('click', () => {
    revealed = !revealed;
    card.classList.toggle('revealed', revealed);
    pill.textContent = revealed ? 'Back to the color' : 'Tap to see its source';
    if (revealed) track('source_revealed', baseAnalyticsProps);
  });

  app.querySelector('#cta').addEventListener('click', () => fileInput.click());
  wireNav();
}

// ---- screen: YOUR COLOR -----------------------------------------------------
// score: 0–100 match of the photo's dominant color vs today's color.
// animate: count up from 0 (fresh find) vs show the final number (on reload).
function renderYour(photoUrl, score = null, animate = false) {
  app.className = 'screen-your';
  app.innerHTML = '';
  const hasScore = Number.isFinite(score);
  const wrap = el(`<div style="display:contents"></div>`);
  wrap.innerHTML = `
    <div class="title"><div class="date">${dateStr}</div><h1>Your Color</h1></div>
    <div class="card">
      <div class="art" style="opacity:1;background-image:url('${photoUrl}')"></div>
      <div class="strip" style="background:${todayColor.hex}">
        <div class="vals" style="color:var(--ink)">HEX ${todayColor.hex.toUpperCase()}<br>RGB ${r}, ${g}, ${b}</div>
      </div>
    </div>
    ${hasScore ? `
    <div class="match" id="match">
      <div class="num"><span id="scoreVal">${animate ? 0 : score}</span><span class="pct">% match</span></div>
      <div class="caption">${matchCaption(score)}</div>
    </div>` : ''}
    <button class="restart" id="restart">↺ Start over</button>
    <div class="actions">
      <button class="btn btn-primary" id="toCollection">See it in your collection</button>
      <button class="btn btn-ghost" id="retry">Try another</button>
    </div>
    ${nav()}
  `;
  app.append(...wrap.childNodes);
  app.querySelector('#retry').addEventListener('click', () => fileInput.click());
  app.querySelector('#toCollection').addEventListener('click', () => renderCollection());
  app.querySelector('#restart').addEventListener('click', () => {
    clearEntry(day);      // forget today's find so the full flow can run again
    renderHome();
  });
  wireNav();
  if (hasScore && animate) countUp(app.querySelector('#scoreVal'), score);
}

// today's screen: the chip until a photo is found, then Your Color.
function showToday() {
  const s = getEntry(day);
  if (s && s.photo && s.paintingId === active.id) {
    renderYour(s.photo, Number.isFinite(s.score) ? s.score : null, false);
  } else {
    renderHome();
  }
}

// ---- screen: COLLECTION — Calendar view (Figma 209:1133) --------------------
// the daily hunt, accumulated. Empty days recede; found days show the photo with
// a date pill tinted in that day's color. Never a goal to fill (PRD §6).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

let calView = null; // { year, month } currently shown; null → today's month
let collectionView = 'calendar';

// map an entry list to { 'YYYY-M-D' (UTC) : entry } for fast calendar lookup
function entriesByDate(entries) {
  const map = {};
  for (const e of entries) {
    if (e.day == null) continue;
    const d = dateFromDayNumber(e.day);
    map[`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`] = e;
  }
  return map;
}

// positive-only recap counts (PRD §5): streak never punishes a break.
function recap(entries, year, month) {
  const inMonth = entries.filter((e) => {
    const d = dateFromDayNumber(e.day);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month;
  });
  const newArt = new Set(inMonth.map((e) => e.paintingId)).size;
  const newColor = new Set(inMonth.map((e) => e.colorHex)).size;
  // day streak: consecutive days with a find, counting back from the latest find
  const days = new Set(entries.map((e) => e.day)).size ? [...new Set(entries.map((e) => e.day))].sort((a, b) => b - a) : [];
  let streak = 0;
  if (days.length) {
    streak = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i] === days[i - 1] - 1) streak++;
      else break;
    }
  }
  return { streak, newArt, newColor };
}

function collectionSwitcher(active) {
  const tab = (view, label) =>
    `<button class="seg${view === active ? ' active' : ''}" data-view="${view}">${label}</button>`;
  return `<div class="view-switcher">${tab('calendar', 'Calendar')}${tab('year', 'Year')}</div>`;
}

function wireCollectionSwitcher() {
  app.querySelectorAll('.view-switcher .seg').forEach((btn) => {
    btn.addEventListener('click', () => renderCollection({ view: btn.dataset.view }));
  });
}

function yearEntries(entries, year) {
  const map = {};
  for (const entry of entries) {
    const d = dateFromDayNumber(entry.day);
    if (d.getUTCFullYear() !== year) continue;
    map[`${d.getUTCMonth()}-${d.getUTCDate()}`] = entry;
  }
  return map;
}

function renderYearCollection(entries, year) {
  const byDate = yearEntries(entries, year);
  const count = Object.keys(byDate).length;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const cells = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthCells = [];
    for (let dom = 1; dom <= 31; dom++) {
      const exists = dom <= daysInMonth;
      const entry = exists ? byDate[`${month}-${dom}`] : null;
      const future = exists && Date.UTC(year, month, dom) > todayUtc;
      const style = entry ? ` style="background:${entry.colorHex}"` : '';
      const cls = `year-pixel${entry ? ' found' : ''}${!exists || future ? ' blank' : ''}`;
      monthCells.push(`<button class="${cls}" data-month="${month}" data-day="${dom}" ${entry ? '' : 'tabindex="-1"'}${style}></button>`);
    }
    cells.push(`
      <div class="year-month">
        <div class="year-label">${MONTHS[month].slice(0, 3)}</div>
        <div class="year-stack">${monthCells.join('')}</div>
      </div>`);
  }

  const wrap = el(`<div style="display:contents"></div>`);
  wrap.innerHTML = `
    <h1 class="page-title">Collection</h1>
    ${collectionSwitcher('year')}
    <div class="year-head">
      <button class="chev" id="prevY" aria-label="Previous year">${icon('chev')}</button>
      <span>${year} · ${count} colors found</span>
      <button class="chev next" id="nextY" aria-label="Next year">${icon('chev')}</button>
    </div>
    <div class="year-card">
      <div class="year-grid">${cells.join('')}</div>
    </div>
    ${nav('collection')}
  `;
  app.append(...wrap.childNodes);
  wireCollectionSwitcher();
  app.querySelector('#prevY').addEventListener('click', () => renderCollection({ view: 'year', year: year - 1 }));
  app.querySelector('#nextY').addEventListener('click', () => renderCollection({ view: 'year', year: year + 1 }));
  app.querySelectorAll('.year-pixel.found').forEach((btn) => {
    const entry = byDate[`${btn.dataset.month}-${btn.dataset.day}`];
    btn.addEventListener('click', () => renderDayDetail(entry));
  });
  wireNav();
}

function renderCollection(opts = {}) {
  collectionView = opts.view || collectionView || 'calendar';
  const entries = opts.entries || allEntries().filter((e) => e.photo && e.day != null);
  const now = new Date();
  const year = opts.year ?? calView?.year ?? now.getFullYear();

  track('collection_opened', {
    view: collectionView,
    year,
    month: opts.month ?? calView?.month ?? now.getMonth(),
  });
  app.className = 'screen-collection';
  app.innerHTML = '';

  if (collectionView === 'year') {
    renderYearCollection(entries, year);
    return;
  }

  const month = opts.month ?? calView?.month ?? now.getMonth();
  calView = { year, month };

  const byDate = entriesByDate(entries);
  const { streak, newArt, newColor } = recap(entries, year, month);

  // build the calendar grid (Sunday-first), including leading/trailing days
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const total = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < total; i++) {
    const dom = i - firstDow + 1; // day-of-month (can be <1 or >daysInMonth)
    const inMonth = dom >= 1 && dom <= daysInMonth;
    const cellDate = new Date(Date.UTC(year, month, dom));
    const label = cellDate.getUTCDate();
    const entry = inMonth ? byDate[`${year}-${month}-${dom}`] : null;
    cells.push({ label, inMonth, entry });
  }

  const stat = (ic, num, lab) =>
    `<div class="stat"><div class="stat-top">${icon(ic)}<span class="stat-num">${num}</span></div><div class="stat-lab">${lab}</div></div>`;

  const wrap = el(`<div style="display:contents"></div>`);
  wrap.innerHTML = `
    <h1 class="page-title">Collection</h1>
    ${collectionSwitcher('calendar')}
    <div class="recap">
      <div class="recap-label">Monthly Recap</div>
      <div class="recap-stats">
        ${stat('flame', streak, 'day streak')}
        ${stat('art', newArt, 'new art')}
        ${stat('palette', newColor, 'new color')}
      </div>
    </div>
    <div class="monthnav">
      <button class="chev" id="prevM" aria-label="Previous month">${icon('chev')}</button>
      <span>${MONTHS[month]} ${year}</span>
      <button class="chev next" id="nextM" aria-label="Next month">${icon('chev')}</button>
    </div>
    <div class="cal-card">
      <div class="cal-weekdays">${WEEKDAYS.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal-grid">
        ${cells.map((c, i) => {
          const cls = `cal-cell${c.entry ? ' found' : c.inMonth ? ' in' : ' out'}`;
          const sq = c.entry
            ? `<div class="cal-sq" style="background-image:url('${c.entry.photo}')"></div>`
            : `<div class="cal-sq"></div>`;
          const pill = c.entry
            ? `<div class="cal-date" style="background:${c.entry.colorHex}">${c.label}</div>`
            : `<div class="cal-date">${c.label}</div>`;
          return `<button class="${cls}" data-cell="${i}" ${c.entry ? '' : 'tabindex="-1"'}>${sq}${pill}</button>`;
        }).join('')}
      </div>
    </div>
    ${nav('collection')}
  `;
  app.append(...wrap.childNodes);
  wireCollectionSwitcher();

  app.querySelector('#prevM').addEventListener('click', () => {
    const m = month - 1; renderCollection({ entries: opts.entries, view: 'calendar', year: m < 0 ? year - 1 : year, month: (m + 12) % 12 });
  });
  app.querySelector('#nextM').addEventListener('click', () => {
    const m = month + 1; renderCollection({ entries: opts.entries, view: 'calendar', year: m > 11 ? year + 1 : year, month: m % 12 });
  });
  app.querySelectorAll('.cal-cell.found').forEach((btn) => {
    btn.addEventListener('click', () => renderDayDetail(cells[+btn.dataset.cell].entry));
  });
  wireNav();
}

// the source-painting card (Figma 181:493): thumbnail · title · artist·year · link
function artCard(p) {
  if (!p) return '';
  const meta = [p.artist, p.year ? `c. ${p.year}` : null].filter(Boolean).join(' · ');
  return `
    <div class="artcard"${p.objectUrl ? ` data-url="${p.objectUrl}"` : ''}>
      <div class="art-thumb" style="background-image:url('/${p.image}')"></div>
      <div class="art-info">
        <div class="art-cap">
          <div class="art-title">${p.title}</div>
          <div class="art-sub">${meta}</div>
        </div>
        <button class="art-more">MORE DETAILS</button>
      </div>
    </div>`;
}

// ---- screen: DAY DETAIL (tap a found day) — re-opens that day's Your Color --
function renderDayDetail(entry) {
  app.className = 'screen-your';
  app.innerHTML = '';
  const p = paintings.find((x) => x.id === entry.paintingId);
  const c = hexToRgb(entry.colorHex);
  const d = dateFromDayNumber(entry.day);
  const dstr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const wrap = el(`<div style="display:contents"></div>`);
  wrap.innerHTML = `
    <button class="back" id="back">‹ Collection</button>
    <div class="title"><div class="date">${dstr}</div><h1>Your Color</h1></div>
    <div class="card">
      <div class="art" style="opacity:1;background-image:url('${entry.photo}')"></div>
      <div class="strip" style="background:${entry.colorHex}">
        <div class="vals" style="color:var(--ink)">HEX ${entry.colorHex.toUpperCase()}<br>RGB ${c.r}, ${c.g}, ${c.b}</div>
      </div>
    </div>
    ${Number.isFinite(entry.score) ? `
    <div class="match">
      <div class="num"><span>${entry.score}</span><span class="pct">% match</span></div>
    </div>` : ''}
    ${artCard(p)}
    ${nav('collection')}
  `;
  app.append(...wrap.childNodes);
  app.querySelector('#back').addEventListener('click', () => renderCollection());
  const more = app.querySelector('.art-more');
  if (more) more.addEventListener('click', () => {
    const url = more.closest('.artcard')?.dataset.url;
    if (url) window.open(url, '_blank', 'noopener');
    else toast('More details — coming soon');
  });
  wireNav();
}

// count 0 → target with an ease-out, ~1s (the payoff of the hunt, PRD §5.5)
function countUp(node, target, ms = 1100) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---- upload flow ------------------------------------------------------------
async function onPhoto(e) {
  const file = e.target.files && e.target.files[0];
  fileInput.value = '';
  if (!file) return;
  try {
    const bitmap = await createImageBitmap(file);
    const url = makeThumb(bitmap, 720);
    bitmap.close?.();
    // score the photo's dominant color against today's ONE color (LAB distance)
    let score = null;
    try {
      const palette = await paletteFromFile(file, 5);
      score = scoreColor(palette, todayColor.lab).score;
    } catch (err) {
      console.warn('Scoring failed; saving the find anyway.', err);
    }
    // every find is saved regardless of the score (penalty-free, PRD §5)
    saveEntry(day, { photo: url, colorHex: todayColor.hex, paintingId: active.id, score, ts: Date.now() });
    track('photo_uploaded', baseAnalyticsProps);
    if (Number.isFinite(score)) {
      track('match_scored', { ...baseAnalyticsProps, score_bucket: scoreBucket(score) });
    }
    renderYour(url, score, true);
  } catch (err) {
    console.error(err);
    alert('Could not read that image — try another photo.');
  }
}

function makeThumb(bitmap, max = 720) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.85);
}

// Find where today's color is most *concentrated* in the painting — the spot the
// eyedropper would actually land on. Each pixel is weighted by similarity to the
// target color; a summed-area table then finds the small window with the highest
// average weight. That's a real patch of the color, not the scattered average.
function locateColor(onDone) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = 200, H = Math.max(1, Math.round((200 * img.height) / img.width));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    let d;
    try { d = ctx.getImageData(0, 0, W, H).data; } catch { onDone(null); return; }
    const tl = rgbToLab(r, g, b);
    const wgt = new Float64Array(W * H); // similarity weight per pixel
    for (let y = 0, p = 0; y < H; y++) for (let x = 0; x < W; x++, p++) {
      const i = p * 4;
      const lab = rgbToLab(d[i], d[i + 1], d[i + 2]);
      const dd = (lab[0] - tl[0]) ** 2 + (lab[1] - tl[1]) ** 2 + (lab[2] - tl[2]) ** 2;
      wgt[p] = Math.exp(-dd / 60); // ΔE≈8 → ~0.35, ΔE≈15 → ~0.02
    }
    // summed-area table for O(1) window sums
    const SW = W + 1;
    const S = new Float64Array(SW * (H + 1));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      S[(y + 1) * SW + (x + 1)] = wgt[y * W + x] + S[y * SW + (x + 1)] + S[(y + 1) * SW + x] - S[y * SW + x];
    }
    const rect = (x0, y0, x1, y1) => S[y1 * SW + x1] - S[y0 * SW + x1] - S[y1 * SW + x0] + S[y0 * SW + x0];
    const R = Math.max(4, Math.round(W * 0.05)); // ~5% smoothing radius
    let best = -1, bx = W >> 1, by = H >> 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R);
      const x1 = Math.min(W, x + R + 1), y1 = Math.min(H, y + R + 1);
      const avg = rect(x0, y0, x1, y1) / ((x1 - x0) * (y1 - y0));
      if (avg > best) { best = avg; bx = x; by = y; }
    }
    // keep it just inside the edges so the pin ring + zoom stay well-framed
    const clamp = (v) => Math.max(0.09, Math.min(0.91, v));
    onDone({ x: clamp((bx + 0.5) / W), y: clamp((by + 0.5) / H) });
  };
  img.onerror = () => onDone(null);
  img.src = imgSrc;
}

// ---- boot -------------------------------------------------------------------
// ---- dev preview: ?demo=chip|source|your (no camera needed) ---------------
// Synchronous so it renders reliably for headless screenshots. `your` uses the
// painting image as a stand-in photo and scores its stored palette vs today's
// color — a real number, no image decode required.
const demo = new URLSearchParams(location.search).get('demo');
function runDemo(mode) {
  renderHome();
  if (mode === 'source') { app.querySelector('#card')?.click(); return; }
  if (mode === 'your') {
    const score = scoreColor(active.palette, todayColor.lab).score;
    renderYour(imgSrc, score, true);
  }
  if (mode === 'collection') {
    // July 2026: finds on the 8th and 10th (day 188 / 190 from the 2026 epoch)
    const sample = [
      { day: 188, photo: '/' + paintings[0].image, colorHex: '#504631', score: 92, paintingId: paintings[0].id },
      { day: 190, photo: '/' + (paintings[1] || paintings[0]).image, colorHex: '#97a9b3', score: 64, paintingId: (paintings[1] || paintings[0]).id },
    ];
    renderCollection({ entries: sample, year: 2026, month: 6 });
  }
  if (mode === 'year') {
    const sample = [
      { day: 12, photo: '/' + paintings[0].image, colorHex: '#504631', score: 92, paintingId: paintings[0].id },
      { day: 48, photo: '/' + paintings[1].image, colorHex: '#97a9b3', score: 64, paintingId: paintings[1].id },
      { day: 101, photo: '/' + paintings[2].image, colorHex: '#af7648', score: 81, paintingId: paintings[2].id },
      { day: 188, photo: '/' + paintings[3].image, colorHex: '#76a8bf', score: 88, paintingId: paintings[3].id },
    ];
    renderCollection({ entries: sample, view: 'year', year: 2026 });
  }
  if (mode === 'day') {
    renderDayDetail({ day: 188, photo: '/' + paintings[0].image, colorHex: '#504631', score: 92, paintingId: paintings[0].id });
  }
}

if (demo) runDemo(demo);
else showToday();
