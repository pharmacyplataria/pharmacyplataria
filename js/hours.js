// Single source of truth for opening hours.
// Loads /hours.json, validates, then repaints the visible table,
// footer summary, and schema.org JSON-LD. On any failure, leaves
// the hardcoded HTML in place — site never shows an error.

const HOURS_URL = '/hours.json';

const DAY_INDEX = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SCHEMA_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Mon-first walk order for table & footer rendering
const RENDER_ORDER = [1, 2, 3, 4, 5, 6, 0];

const SHIFT_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;

function parseShift(str) {
  const m = str.trim().match(SHIFT_RE);
  if (!m) return null;
  const oh = +m[1], om = +m[2], ch = +m[3], cm = +m[4];
  if (oh > 23 || om > 59 || ch > 23 || cm > 59) return null;
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  if (close <= open) return null;
  return [open, close];
}

function parseDayValue(val) {
  if (typeof val !== 'string' || !val.trim()) return [];
  const parts = val.split(',').map(s => s.trim()).filter(Boolean);
  const shifts = [];
  for (const part of parts) {
    const shift = parseShift(part);
    if (shift) shifts.push(shift);
    else console.warn(`[hours.json] ignoring invalid shift "${part}"`);
  }
  return shifts;
}

export async function loadHours() {
  let raw;
  try {
    const res = await fetch(HOURS_URL, { cache: 'no-cache' });
    if (!res.ok) {
      console.warn(`[hours.json] fetch failed: ${res.status}`);
      return null;
    }
    raw = await res.json();
  } catch (err) {
    console.warn('[hours.json] load error:', err);
    return null;
  }
  if (!raw || typeof raw !== 'object') {
    console.warn('[hours.json] root is not an object');
    return null;
  }
  const schedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const [name, idx] of Object.entries(DAY_INDEX)) {
    if (raw[name] === undefined) continue;
    schedule[idx] = parseDayValue(raw[name]);
  }
  return schedule;
}

function formatHM(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shiftSig(shifts) {
  return shifts.map(s => `${s[0]}-${s[1]}`).join(',');
}

function buildGroups(schedule) {
  const groups = [];
  let current = null;
  for (const day of RENDER_ORDER) {
    const shifts = schedule[day] || [];
    const sig = shiftSig(shifts);
    if (current && current.sig === sig) {
      current.end = day;
    } else {
      current = { start: day, end: day, sig, shifts };
      groups.push(current);
    }
  }
  return groups;
}

export function renderHoursTable(schedule, dict) {
  const dl = document.querySelector('[data-hours-table]');
  if (!dl) return;
  const longDays = dict?.status?.days ?? {};
  const h = dict?.hours ?? {};
  const dayRangeSep = h.day_range_sep ?? ' – ';
  const timeRangeSep = h.time_range_sep ?? ' – ';
  const closedText = h.closed ?? 'Closed';

  const groups = buildGroups(schedule);
  const frag = document.createDocumentFragment();
  for (const g of groups) {
    const dt = document.createElement('dt');
    const startLabel = longDays[DAY_KEYS[g.start]] ?? DAY_KEYS[g.start];
    if (g.start === g.end) {
      dt.textContent = startLabel;
    } else {
      const endLabel = longDays[DAY_KEYS[g.end]] ?? DAY_KEYS[g.end];
      dt.textContent = `${startLabel}${dayRangeSep}${endLabel}`;
    }
    frag.appendChild(dt);

    const dd = document.createElement('dd');
    if (g.shifts.length === 0) {
      dd.classList.add('hours__closed');
      dd.textContent = closedText;
    } else if (g.shifts.length === 1) {
      const [o, c] = g.shifts[0];
      dd.textContent = `${formatHM(o)}${timeRangeSep}${formatHM(c)}`;
    } else {
      for (const [o, c] of g.shifts) {
        const span = document.createElement('span');
        span.textContent = `${formatHM(o)}${timeRangeSep}${formatHM(c)}`;
        dd.appendChild(span);
      }
    }
    frag.appendChild(dd);
  }
  dl.replaceChildren(frag);
}

export function renderFooterHours(schedule, dict) {
  const wrap = document.querySelector('[data-hours-footer]');
  if (!wrap) return;
  const h = dict?.hours ?? {};
  const shortDays = h.days_short ?? {};
  const dayRangeSep = h.day_range_sep_short ?? '–';
  const timeRangeSep = h.time_range_sep_short ?? '–';
  const shiftSep = h.shift_sep_footer ?? ' · ';
  const closedShort = h.closed_short ?? 'closed';

  const groups = buildGroups(schedule);
  const frag = document.createDocumentFragment();
  for (const g of groups) {
    const p = document.createElement('p');
    p.className = 'muted';
    const startLabel = shortDays[DAY_KEYS[g.start]] ?? DAY_KEYS[g.start];
    const dayLabel = g.start === g.end
      ? startLabel
      : `${startLabel}${dayRangeSep}${shortDays[DAY_KEYS[g.end]] ?? DAY_KEYS[g.end]}`;
    const value = g.shifts.length === 0
      ? closedShort
      : g.shifts.map(([o, c]) => `${formatHM(o)}${timeRangeSep}${formatHM(c)}`).join(shiftSep);
    p.textContent = `${dayLabel}: ${value}`;
    frag.appendChild(p);
  }
  wrap.replaceChildren(frag);
}

export function renderSchemaHours(schedule) {
  const script = document.querySelector('script[data-hours-jsonld]');
  if (!script) return;
  let data;
  try {
    data = JSON.parse(script.textContent);
  } catch {
    console.warn('[hours.json] failed to parse JSON-LD');
    return;
  }
  const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : null;
  if (!graph) return;
  const pharmacy = graph.find(e => e?.['@type'] === 'Pharmacy')
    ?? graph.find(e => typeof e?.['@id'] === 'string' && e['@id'].endsWith('#pharmacy'));
  if (!pharmacy) return;

  const buckets = new Map();
  for (let day = 0; day < 7; day++) {
    for (const [openMin, closeMin] of (schedule[day] || [])) {
      const open = formatHM(openMin), close = formatHM(closeMin);
      const sig = `${open}-${close}`;
      if (!buckets.has(sig)) buckets.set(sig, { open, close, days: [] });
      buckets.get(sig).days.push(day);
    }
  }

  const spec = [];
  for (const { open, close, days } of buckets.values()) {
    spec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days.length === 1 ? SCHEMA_DAY_NAMES[days[0]] : days.map(d => SCHEMA_DAY_NAMES[d]),
      opens: open,
      closes: close
    });
  }
  pharmacy.openingHoursSpecification = spec;
  script.textContent = JSON.stringify(data, null, 2);
}

export async function initHours() {
  const schedule = await loadHours();
  if (!schedule) return null;
  const dict = window.PP_I18N ?? {};
  renderHoursTable(schedule, dict);
  renderFooterHours(schedule, dict);
  renderSchemaHours(schedule);
  return schedule;
}
