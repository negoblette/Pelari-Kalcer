export const MAX_BODY_BYTES = 64 * 1024;

const MAX_RUNS = 120;
const MAX_SUMMARY = 800;
const MAX_ITEM = 240;
const MAX_ITEMS = 6;
const WEEK_DAYS = 7;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RUN_TYPES = ["easy", "long", "interval", "tempo", "recovery"];
const WEEK_TYPES = [...RUN_TYPES, "rest"];
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /sk-ant-[0-9A-Za-z_-]{10,}/,
  /sb_secret_[0-9A-Za-z_-]{10,}/,
  /eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}/,
];

function bounded(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) return undefined;
  return Math.round(parsed * 100) / 100;
}

function date(value) {
  return typeof value === "string" && DATE_PATTERN.test(value) ? value : undefined;
}

// Only known numbers and fixed words reach the model, so text from a browser can never act as a prompt.
function cleanRun(run) {
  let type = "run";
  if (RUN_TYPES.includes(run?.type)) type = run.type;
  else if (run?.type === "rest") type = "rest";
  return {
    date: date(run?.date),
    type,
    km: bounded(run?.km, 500),
    pace: bounded(run?.pace, 3600),
    hr: bounded(run?.hr, 250),
    feel: bounded(run?.feel, 4),
    legs: bounded(run?.legs, 3),
  };
}

export function cleanPayload(body) {
  const runs = Array.isArray(body?.runs) ? body.runs : [];
  const race = body?.race;
  return {
    today: date(body?.today),
    runs: runs.slice(-MAX_RUNS).map(cleanRun).filter((run) => run.date),
    plannedRunDays: Math.min(Math.max(Math.floor(Number(body?.plannedRunDays)) || 0, 0), WEEK_DAYS),
    race: date(race?.date)
      ? { date: race.date, km: bounded(race.km, 500), targetPace: bounded(race.targetPace, 3600) }
      : null,
  };
}

function text(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function textList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => text(item, MAX_ITEM))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

// Model output is checked like any untrusted input before it reaches the browser.
export function cleanResult(raw, secrets = []) {
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(result?.week) || result.week.length !== WEEK_DAYS) return null;

  const week = result.week.map((day) => ({
    type: WEEK_TYPES.includes(day?.type) ? day.type : null,
    detail: text(day?.detail, MAX_ITEM),
  }));
  if (week.some((day) => !day.type)) return null;

  const clean = {
    summary: text(result.summary, MAX_SUMMARY),
    strengths: textList(result.strengths),
    risks: textList(result.risks),
    week,
  };
  if (!clean.summary) return null;

  const serialized = JSON.stringify(clean);
  if (SECRET_PATTERNS.some((pattern) => pattern.test(serialized))) return null;
  if (secrets.some((secret) => secret && serialized.includes(secret))) return null;
  return clean;
}

// A browser sends Origin on cross-site requests. Requests from other sites are refused.
export function sameOrigin(origin, host) {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
