import { RUN_TYPES } from "./runTypes";
import {
  MONTH_NAMES,
  addDays,
  detailSummary,
  entryForDate,
  hasDetail,
  isRunEntry,
  mondayOf,
  personalBests,
  shortDate,
  weekDays,
  weekStreak,
} from "./stats";

const RUN_HOURS = [5, 6, 7, 8, 16, 17, 18, 19];

function hourScore(hour) {
  return hour.feels + hour.rain * 0.05 + Math.max(hour.aqi - 50, 0) * 0.05;
}

// The most comfortable usual running hour in the next 24 hours.
export function bestRunHour(hours, nowKey) {
  const upcoming = hours
    .filter((hour) => hour.time >= nowKey)
    .slice(0, 24)
    .filter((hour) => RUN_HOURS.includes(Number(hour.time.slice(11, 13))));
  if (!upcoming.length) return null;
  return upcoming.reduce((best, hour) => (hourScore(hour) < hourScore(best) ? hour : best));
}

export function runVerdict(hour) {
  if (hour.aqi > 150) return "Udara buruk. Lebih baik rest atau lari di dalam ruangan.";
  if (hour.aqi > 100) return "Udara kurang sehat. Kurangi intensitas larinya.";
  if (hour.rain >= 70) return "Hujan mungkin turun. Siapkan rencana cadangan.";
  if (hour.feels >= 35) return "Panas sekali. Pilih jam yang lebih pagi dan minum cukup.";
  return "Kondisi cukup enak buat lari.";
}

export function planDays(plan, entries, today) {
  return weekDays(entries, today).map((day, index) => {
    const planned = plan[index] ?? null;
    const past = day.date < today;
    let result = "open";
    if (day.entry) result = isRunEntry(day.entry) ? "ran" : "rested";
    else if (past && planned) result = "missed";
    return { ...day, planned, past, result };
  });
}

export function planScore(days) {
  const planned = days.filter((day) => day.planned);
  const kept = planned.filter(
    (day) =>
      (day.planned === "run" && day.result === "ran") ||
      (day.planned === "rest" && day.result === "rested"),
  );
  return { planned: planned.length, kept: kept.length };
}

function capped(current, target) {
  return Math.min(current, target);
}

export function weeklyQuests(entries, plan, today) {
  const week = weekDays(entries, today);
  const entered = week.map((day) => day.entry).filter(Boolean);
  const runs = entered.filter(isRunEntry);
  const days = planDays(plan, entries, today);
  const score = planScore(days);
  const quests = [
    { id: "tiga-lari", title: "Lari tiga kali", current: capped(runs.length, 3), target: 3, unit: "lari" },
    {
      id: "lima-belas-km",
      title: "Tembus 15 km",
      current: capped(Math.round(detailSummary(entered).km * 10) / 10, 15),
      target: 15,
      unit: "km",
    },
    {
      id: "detail-lengkap",
      title: "Isi semua detail lari",
      current: runs.filter(hasDetail).length,
      target: Math.max(runs.length, 1),
      unit: "lari",
    },
    {
      id: "hari-rest",
      title: "Ambil satu hari rest",
      current: capped(entered.length - runs.length, 1),
      target: 1,
      unit: "hari",
    },
  ];
  if (score.planned) {
    quests.push({
      id: "ikut-rencana",
      title: "Ikuti rencana minggu ini",
      current: score.kept,
      target: score.planned,
      unit: "hari",
    });
  }
  return quests;
}

export const BADGE_TITLES = {
  "lari-pertama": "Lari pertama",
  "lari-10k": "Sekali lari 10K",
  "lari-21k": "Sekali lari 21K",
  "total-100": "Total 100 km",
  "total-500": "Total 500 km",
  "streak-4": "Streak 4 minggu",
  "streak-12": "Streak 12 minggu",
  "absen-30": "30 kali lari",
};

export function lifetimeBadges(entries, today) {
  const details = entries.filter((entry) => isRunEntry(entry) && hasDetail(entry));
  const totalKm = details.reduce((sum, entry) => sum + entry.km, 0);
  const longest = details.reduce((top, entry) => Math.max(top, entry.km), 0);
  const runCount = entries.filter(isRunEntry).length;
  const streak = weekStreak(entries, today);
  const earned = {
    "lari-pertama": runCount >= 1,
    "lari-10k": longest >= 10,
    "lari-21k": longest >= 21.1,
    "total-100": totalKm >= 100,
    "total-500": totalKm >= 500,
    "streak-4": streak >= 4,
    "streak-12": streak >= 12,
    "absen-30": runCount >= 30,
  };
  return Object.entries(BADGE_TITLES).map(([id, title]) => ({ id, title, done: earned[id] }));
}

export function raceStatus(race, entries, today) {
  const dayMs = 24 * 3600 * 1000;
  const daysLeft = Math.round((Date.parse(race.date) - Date.parse(today)) / dayMs);
  const start = addDays(today, -29);
  const recent = entries.filter((entry) => entry.date >= start && entry.date <= today);
  const details = entries.filter((entry) => isRunEntry(entry) && hasDetail(entry));
  return {
    daysLeft,
    weeksLeft: Math.ceil(Math.max(daysLeft, 0) / 7),
    targetPace: race.targetSeconds ? race.targetSeconds / race.km : 0,
    recentPace: detailSummary(recent).pace,
    longest: details.reduce((top, entry) => Math.max(top, entry.km), 0),
  };
}

export function recapFor(entries, gear, prefix) {
  const period = entries.filter((entry) => entry.date.startsWith(prefix));
  const runs = period.filter(isRunEntry);
  const details = runs.filter(hasDetail);
  const summary = detailSummary(period);
  const seconds = details.reduce((sum, entry) => sum + (entry.seconds || 0), 0);
  const longest = details.reduce((top, entry) => (entry.km > (top?.km ?? 0) ? entry : top), null);

  const weeks = new Map();
  const gearKm = new Map();
  for (const entry of details) {
    const week = mondayOf(entry.date);
    weeks.set(week, (weeks.get(week) ?? 0) + entry.km);
    if (entry.gearId) gearKm.set(entry.gearId, (gearKm.get(entry.gearId) ?? 0) + entry.km);
  }
  const bestWeek = [...weeks].sort((a, b) => b[1] - a[1])[0] ?? null;
  const topGear = [...gearKm].sort((a, b) => b[1] - a[1])[0] ?? null;

  return {
    km: summary.km,
    pace: summary.pace,
    seconds,
    runs: runs.length,
    rests: period.length - runs.length,
    longest,
    bestWeek: bestWeek ? { label: shortDate(bestWeek[0]), km: bestWeek[1] } : null,
    topGear: topGear
      ? { name: gear.find((item) => item.id === topGear[0])?.name ?? "Gear terhapus", km: topGear[1] }
      : null,
  };
}

export function periodLabel(prefix) {
  if (prefix.length === 4) return prefix;
  return `${MONTH_NAMES[Number(prefix.slice(5, 7)) - 1]} ${prefix.slice(0, 4)}`;
}

// The summary friends can see. Routes, notes and single runs never leave the private table.
export function buildStats(entries, today) {
  const own = entries.filter((entry) => !entry.sample);
  const entered = weekDays(own, today)
    .map((day) => day.entry)
    .filter(Boolean);
  const summary = detailSummary(entered);
  const entry = entryForDate(own, today);
  return {
    date: today,
    weekStart: mondayOf(today),
    weekKm: Math.round(summary.km * 10) / 10,
    weekRuns: entered.filter(isRunEntry).length,
    pace: Math.round(summary.pace),
    streak: weekStreak(own, today),
    status: entry ? (isRunEntry(entry) ? "run" : "rest") : null,
    lifetime: friendLifetime(own, today),
  };
}

// Totals and best times only. Dates, routes and notes stay out of what friends receive.
function friendLifetime(entries, today) {
  const summary = lifetimeSummary(entries);
  const timed = entries.filter((entry) => isRunEntry(entry) && entry.seconds > 0);
  return {
    km: Math.round(summary.km * 10) / 10,
    runs: summary.runs,
    bestStreak: summary.bestStreak,
    records: personalBests(timed).map((record) => ({
      label: record.label,
      time: record.best ? Math.round(record.best.time) : 0,
    })),
    badges: lifetimeBadges(entries, today)
      .filter((badge) => badge.done)
      .map((badge) => badge.id),
  };
}

// A friend's summary was saved on their last sync, so old weeks must not read as this week.
export function friendView(stats, today) {
  const thisWeek = mondayOf(today);
  const current = stats.weekStart === thisWeek;
  const lastWeek = stats.weekStart === addDays(thisWeek, -7);
  return {
    weekKm: current ? (stats.weekKm ?? 0) : 0,
    pace: current ? (stats.pace ?? 0) : 0,
    streak: current || lastWeek ? (stats.streak ?? 0) : 0,
    status: stats.date === today ? stats.status : null,
  };
}

function bestWeekStreak(runs) {
  const weeks = [...new Set(runs.map((run) => mondayOf(run.date)))].sort();
  let best = 0;
  let current = 0;
  let previous = null;
  for (const week of weeks) {
    current = previous && addDays(previous, 7) === week ? current + 1 : 1;
    best = Math.max(best, current);
    previous = week;
  }
  return best;
}

export function lifetimeSummary(entries) {
  const runs = entries.filter(isRunEntry);
  const details = runs.filter(hasDetail);
  const timed = details.filter((entry) => entry.seconds > 0);
  const summary = detailSummary(runs);
  const fastest = timed
    .filter((entry) => entry.km >= 1)
    .reduce((top, entry) => {
      const pace = entry.seconds / entry.km;
      return !top || pace < top.pace ? { pace, km: entry.km, date: entry.date } : top;
    }, null);

  return {
    km: summary.km,
    pace: summary.pace,
    seconds: timed.reduce((sum, entry) => sum + entry.seconds, 0),
    runs: runs.length,
    rests: entries.length - runs.length,
    longest: details.reduce((top, entry) => (entry.km > (top?.km ?? 0) ? entry : top), null),
    fastest,
    bestStreak: bestWeekStreak(runs),
    firstDate: entries.map((entry) => entry.date).sort()[0] ?? null,
    types: RUN_TYPES.map(({ id, label }) => {
      const list = runs.filter((entry) => entry.runType === id);
      return {
        id,
        label,
        count: list.length,
        km: list.reduce((sum, entry) => sum + (entry.km || 0), 0),
      };
    }),
  };
}

// What the AI analysis receives. Notes, routes and gear names stay on the device.
export function analysisPayload(entries, plan, race, today) {
  const start = addDays(today, -55);
  return {
    today,
    plannedRunDays: plan.filter((day) => day === "run").length,
    race: race
      ? {
          date: race.date,
          km: race.km,
          targetPace: race.targetSeconds ? race.targetSeconds / race.km : 0,
        }
      : null,
    runs: entries
      .filter((entry) => !entry.sample && entry.date >= start && entry.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        date: entry.date,
        type: isRunEntry(entry) ? (entry.runType ?? "run") : "rest",
        km: entry.km,
        pace: entry.km > 0 && entry.seconds > 0 ? entry.seconds / entry.km : 0,
        hr: entry.workout?.hr,
        feel: isRunEntry(entry) ? (entry.feel ?? 0) + 1 : undefined,
        legs: entry.workout?.legs === undefined ? undefined : entry.workout.legs + 1,
      })),
  };
}

export function todayEntry(entries, today) {
  return entryForDate(entries, today);
}
