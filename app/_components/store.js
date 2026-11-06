"use client";

import { useSyncExternalStore } from "react";
import { EPOCH } from "./merge";
import { localDateKey, sampleRuns } from "./stats";

const KEY = "pelari-kalcer:tracker:v1";
const EMPTY_PREFS = { plan: [null, null, null, null, null, null, null], race: null };
const EMPTY = {
  runs: [],
  goalKm: 100,
  gear: [],
  prefs: EMPTY_PREFS,
  goalUpdatedAt: EPOCH,
  deleted: {},
};

let state = null;
const listeners = new Set();
const changeListeners = new Set();

// Older entries named their shoes as free text. Those names become gear items once.
function migrateShoes(saved) {
  const gear = [...saved.gear];
  const runs = saved.runs.map((run) => {
    if (!run.shoe || run.sample || run.gearId) return run;
    const id = `gear-${run.shoe.toLowerCase().replace(/\W+/g, "-")}`;
    if (!gear.some((item) => item.id === id)) {
      gear.push({ id, name: run.shoe, kind: "Sepatu", startKm: 0, limitKm: 800 });
    }
    return { ...run, gearId: id };
  });
  return { ...saved, runs, gear };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && Array.isArray(saved.runs)
      ? migrateShoes({ ...EMPTY, ...saved })
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function snapshot() {
  if (state === null) state = load();
  return state;
}

function persist(next) {
  const { runs, goalKm, gear, prefs, goalUpdatedAt, deleted } = next;
  let saveError = false;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ runs, goalKm, gear, prefs, goalUpdatedAt, deleted }),
    );
  } catch {
    saveError = true;
  }
  state = { runs, goalKm, gear, prefs, goalUpdatedAt, deleted, saveError };
  listeners.forEach((listener) => listener());
}

function commit(next) {
  persist(next);
  changeListeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key !== KEY) return;
    state = load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeToClock(listener) {
  const timer = setInterval(listener, 60000);
  return () => clearInterval(timer);
}

export function useTracker() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function useToday() {
  return useSyncExternalStore(
    subscribeToClock,
    () => localDateKey(new Date()),
    () => null,
  );
}

export function getTracker() {
  return snapshot();
}

// Fired for changes made on this device, never for what a sync brings in.
export function onLocalChange(listener) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export function applySynced(changes) {
  persist({ ...snapshot(), ...changes });
}

export function resetTracker() {
  persist(EMPTY);
}

export function saveRun(run) {
  const current = snapshot();
  const others = current.runs.filter((item) => item.id !== run.id);
  const { [run.id]: _restored, ...deleted } = current.deleted;
  const saved = { ...run, updatedAt: new Date().toISOString() };
  commit({ ...current, deleted, runs: [...others, saved] });
}

export function deleteRun(id) {
  const current = snapshot();
  const target = current.runs.find((run) => run.id === id);
  const deleted = target?.sample
    ? current.deleted
    : { ...current.deleted, [id]: new Date().toISOString() };
  commit({ ...current, deleted, runs: current.runs.filter((run) => run.id !== id) });
}

// One day holds one check-in. The id comes from the date, so two devices meet on the same row.
export function checkIn(date, type) {
  const existing = snapshot().runs.find((run) => run.date === date);
  saveRun(
    existing
      ? { ...existing, type }
      : { id: `day-${date}`, date, type, km: null, seconds: null, feel: 1, note: "" },
  );
}

export function saveGearItem(item) {
  const current = snapshot();
  const exists = current.gear.some((gear) => gear.id === item.id);
  commit({
    ...current,
    gear: exists
      ? current.gear.map((gear) => (gear.id === item.id ? item : gear))
      : [...current.gear, item],
    goalUpdatedAt: new Date().toISOString(),
  });
}

export function deleteGearItem(id) {
  const current = snapshot();
  commit({
    ...current,
    gear: current.gear.filter((gear) => gear.id !== id),
    goalUpdatedAt: new Date().toISOString(),
  });
}

export function setPrefs(changes) {
  const current = snapshot();
  commit({
    ...current,
    prefs: { ...current.prefs, ...changes },
    goalUpdatedAt: new Date().toISOString(),
  });
}

export function setGoal(goalKm) {
  commit({ ...snapshot(), goalKm, goalUpdatedAt: new Date().toISOString() });
}

export function addSampleRuns(today) {
  const current = snapshot();
  commit({ ...current, runs: [...current.runs, ...sampleRuns(today)] });
}

export function removeSampleRuns() {
  const current = snapshot();
  commit({ ...current, runs: current.runs.filter((run) => !run.sample) });
}

export function clearRuns() {
  const current = snapshot();
  const now = new Date().toISOString();
  const deleted = { ...current.deleted };
  for (const run of current.runs) {
    if (!run.sample) deleted[run.id] = now;
  }
  commit({ ...current, deleted, runs: [] });
}

export function exportData() {
  const { runs, goalKm, gear, prefs } = snapshot();
  const blob = new Blob([JSON.stringify({ runs, goalKm, gear, prefs }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pelari-kalcer-${localDateKey(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function isRun(run) {
  return (
    run &&
    typeof run.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(run.date)
  );
}

// Returns how many runs were read. Runs with the same id are replaced by the file's version.
export async function importData(file) {
  const parsed = JSON.parse(await file.text());
  const incoming = Array.isArray(parsed?.runs) ? parsed.runs.filter(isRun) : [];
  if (!incoming.length) throw new Error("no runs");
  const current = snapshot();
  const now = new Date().toISOString();
  const ids = new Set(incoming.map((run) => run.id));
  const deleted = Object.fromEntries(
    Object.entries(current.deleted).filter(([id]) => !ids.has(id)),
  );
  commit({
    ...current,
    deleted,
    goalKm: parsed.goalKm > 0 ? parsed.goalKm : current.goalKm,
    gear: Array.isArray(parsed.gear) ? parsed.gear : current.gear,
    prefs: parsed.prefs ?? current.prefs,
    goalUpdatedAt: parsed.goalKm > 0 ? now : current.goalUpdatedAt,
    runs: [
      ...current.runs.filter((run) => !ids.has(run.id)),
      ...incoming.map((run) => ({ ...run, updatedAt: now })),
    ],
  });
  return incoming.length;
}
