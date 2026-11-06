const DAY = 24 * 3600 * 1000;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const FEELS = ["Enteng", "Pas", "Berat", "Hancur"];
export const RECORD_DISTANCES = [
  { km: 5, label: "5K" },
  { km: 10, label: "10K" },
  { km: 21.1, label: "21K" },
  { km: 42.2, label: "42K" },
];
export const SHOE_LIMIT_KM = 800;
export const SHOE_WARN_KM = 600;

export const RANGES = [
  { id: "30", label: "30 hari" },
  { id: "90", label: "90 hari" },
  { id: "year", label: "Tahun ini" },
  { id: "all", label: "Semua" },
];

function toMs(key) {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function localDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(key, days) {
  return toKey(toMs(key) + days * DAY);
}

export function mondayOf(key) {
  const weekday = (new Date(toMs(key)).getUTCDay() + 6) % 7;
  return addDays(key, -weekday);
}

export function shortDate(key) {
  const [, month, day] = key.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

export function fullDate(key) {
  const [year] = key.split("-");
  return `${shortDate(key)} ${year}`;
}

export function formatClock(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  if (hours === 0) return `${minutes}:${rest}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`;
}

export function formatHours(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}j ${minutes}m` : `${minutes}m`;
}

export function formatDistance(km) {
  return (Math.round(km * 10) / 10).toFixed(1).replace(".", ",");
}

export const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const GEAR_KINDS = ["Sepatu", "Jam", "Vest", "Lainnya"];

export function isRunEntry(entry) {
  return entry.type !== "rest";
}

export function hasDetail(entry) {
  return entry.km > 0;
}

export function entryForDate(entries, date) {
  const matches = entries.filter((entry) => entry.date === date);
  return matches.find(isRunEntry) ?? matches[0] ?? null;
}

export function weekDays(entries, today) {
  const monday = mondayOf(today);
  return DAY_NAMES.map((name, index) => {
    const date = addDays(monday, index);
    return { name, date, entry: entryForDate(entries, date), isToday: date === today };
  });
}

export function detailSummary(entries) {
  const runs = entries.filter((entry) => isRunEntry(entry) && hasDetail(entry));
  const timed = runs.filter((entry) => entry.seconds > 0);
  const km = runs.reduce((sum, entry) => sum + entry.km, 0);
  const timedKm = timed.reduce((sum, entry) => sum + entry.km, 0);
  const seconds = timed.reduce((sum, entry) => sum + entry.seconds, 0);
  return { km, pace: timedKm ? seconds / timedKm : 0 };
}

export function monthCells(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  return {
    leading,
    days: Array.from({ length: lastDay }, (_, index) => addDays(first, index)),
  };
}

export function lastGearId(entries, gear) {
  const active = new Set(gear.filter((item) => !item.retired).map((item) => item.id));
  const latest = entries
    .filter((entry) => active.has(entry.gearId))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest?.gearId ?? (gear.length === 1 && active.size ? gear[0].id : undefined);
}

export function gearMileage(item, entries) {
  const logged = entries
    .filter((entry) => entry.gearId === item.id && isRunEntry(entry))
    .reduce((sum, entry) => sum + (entry.km || 0), 0);
  return logged + (item.startKm || 0);
}

// Reads 7:30 as minutes and seconds, and 1:05:00 as hours, minutes and seconds.
export function parseClock(value) {
  const parts = value.trim().split(":").map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function paceOf(run) {
  return run.seconds / run.km;
}

export function summarize(runs) {
  const km = runs.reduce((sum, run) => sum + run.km, 0);
  const seconds = runs.reduce((sum, run) => sum + run.seconds, 0);
  return { km, seconds, count: runs.length, pace: km ? seconds / km : 0 };
}

function rangeStart(range, today) {
  if (range === "30") return addDays(today, -29);
  if (range === "90") return addDays(today, -89);
  if (range === "year") return `${today.slice(0, 4)}-01-01`;
  return "0000-01-01";
}

export function inRange(runs, range, today) {
  const start = rangeStart(range, today);
  return runs.filter((run) => run.date >= start && run.date <= today);
}

// The same number of days just before the chosen range, for the comparison on the tiles.
export function previousRange(runs, range, today) {
  if (range !== "30" && range !== "90") return null;
  const days = Number(range);
  const end = addDays(today, -days);
  const start = addDays(end, -(days - 1));
  return runs.filter((run) => run.date >= start && run.date <= end);
}

export function monthProgress(runs, today, goalKm) {
  const month = today.slice(0, 7);
  const km = runs
    .filter((run) => run.date.startsWith(month))
    .reduce((sum, run) => sum + run.km, 0);
  const [year, monthNumber, day] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const daysLeft = lastDay - day + 1;
  const remaining = Math.max(goalKm - km, 0);
  return {
    km,
    remaining,
    daysLeft,
    perDay: remaining / daysLeft,
    percent: goalKm ? Math.min((km / goalKm) * 100, 100) : 0,
    monthLabel: MONTHS[monthNumber - 1],
  };
}

export function weeklyTotals(runs, today, weeks = 12) {
  const current = mondayOf(today);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(current, (index - weeks + 1) * 7);
    const end = addDays(start, 6);
    const list = runs.filter((run) => run.date >= start && run.date <= end);
    return { start, end, ...summarize(list), isCurrent: start === current };
  });
}

export function heatmapDays(runs, today, weeks = 26) {
  const totals = new Map();
  for (const run of runs) totals.set(run.date, (totals.get(run.date) ?? 0) + run.km);
  const start = addDays(mondayOf(today), -(weeks - 1) * 7);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      km: totals.get(date) ?? 0,
      future: date > today,
      week: Math.floor(index / 7),
    };
  });
}

export function heatLevel(km) {
  if (km <= 0) return 0;
  if (km < 5) return 1;
  if (km < 10) return 2;
  if (km < 16) return 3;
  return 4;
}

export function weekStreak(runs, today) {
  const active = new Set(runs.filter(isRunEntry).map((run) => mondayOf(run.date)));
  let week = mondayOf(today);
  if (!active.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (active.has(week)) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

export function personalBests(runs) {
  return RECORD_DISTANCES.map((distance) => {
    const eligible = runs.filter((run) => run.km >= distance.km);
    if (!eligible.length) return { ...distance, best: null };
    const best = eligible.reduce((top, run) => (paceOf(run) < paceOf(top) ? run : top));
    return {
      ...distance,
      best: {
        time: paceOf(best) * distance.km,
        pace: paceOf(best),
        date: best.date,
      },
    };
  });
}

export function shoeTotals(runs) {
  const shoes = new Map();
  for (const run of runs) {
    if (!run.shoe) continue;
    const entry = shoes.get(run.shoe) ?? { name: run.shoe, km: 0, count: 0 };
    entry.km += run.km;
    entry.count += 1;
    shoes.set(run.shoe, entry);
  }
  return [...shoes.values()].sort((a, b) => b.km - a.km);
}

export function uniqueValues(runs, field) {
  return [...new Set(runs.map((run) => run[field]).filter(Boolean))];
}

export function sampleRuns(today) {
  const routes = ["Ring Road GBK", "Sudirman–Thamrin", "Banjir Kanal Timur", "Green Office Park"];
  const shoes = ["Sepatu harian", "Sepatu race"];
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const runs = [];
  for (let week = 0; week < 20; week += 1) {
    const start = addDays(mondayOf(today), -week * 7);
    for (const offset of [1, 3, 6]) {
      const date = addDays(start, offset);
      if (date > today || random() < 0.18) continue;
      const long = offset === 6;
      const km = Math.round((long ? 10 + random() * 8 : 3 + random() * 5) * 10) / 10;
      const pace = 400 + week * 3 + random() * 45 + (long ? 25 : 0);
      runs.push({
        id: `sample-${date}`,
        date,
        km,
        seconds: Math.round(km * pace),
        route: routes[Math.floor(random() * routes.length)],
        shoe: long ? shoes[1] : shoes[0],
        feel: Math.floor(random() * 3),
        note: "",
        sample: true,
      });
    }
  }
  return runs;
}
