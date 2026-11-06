"use client";

import { createClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { buildStats } from "./insights";
import { mergeGoal, mergeRuns } from "./merge";
import { addDays, hasDetail, isRunEntry, localDateKey } from "./stats";
import { applySynced, getTracker, onLocalChange, resetTracker } from "./store";

const URL_VALUE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_VALUE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PAGE_SIZE = 1000;
const PUSH_SIZE = 500;
const DEBOUNCE_MS = 1500;
const FEED_DAYS = 14;

export const syncConfigured = Boolean(URL_VALUE && KEY_VALUE);

const SERVER_STATUS = { user: null, phase: "idle", lastSyncedAt: null };

let client = null;
let started = false;
let running = false;
let queued = false;
let timer = null;
let status = SERVER_STATUS;
const listeners = new Set();

function setStatus(changes) {
  status = { ...status, ...changes };
  listeners.forEach((listener) => listener());
}

function subscribeStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeStatus, () => status, () => SERVER_STATUS);
}

function getClient() {
  if (!syncConfigured) return null;
  client ??= createClient(URL_VALUE, KEY_VALUE);
  return client;
}

export function getSupabase() {
  return getClient();
}

// Friends read this summary. A failure here never counts against the sync of the runs themselves.
async function publishStats(supabase, userId) {
  await supabase
    .from("profiles")
    .update({
      stats: buildStats(getTracker().runs, localDateKey(new Date())),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

async function fetchRemoteRuns(supabase) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("runs")
      .select("id, data, updated_at, deleted")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

function feedRow(entry) {
  return {
    run_id: entry.id,
    run_date: entry.date,
    run_type: entry.runType ?? "",
    km: entry.km,
    pace_seconds: entry.seconds > 0 ? Math.round(entry.seconds / entry.km) : 0,
  };
}

// Posts carry type, distance, pace and date only. A failure here never fails the run sync.
async function publishFeed(supabase) {
  const since = addDays(localDateKey(new Date()), -FEED_DAYS);
  const { data: existing, error } = await supabase
    .from("feed_posts")
    .select("run_id, run_date, run_type, km, pace_seconds")
    .gte("run_date", since);
  if (error) return;

  const wanted = getTracker()
    .runs.filter(
      (entry) =>
        !entry.sample &&
        entry.share !== false &&
        entry.date >= since &&
        isRunEntry(entry) &&
        hasDetail(entry),
    )
    .map(feedRow);

  const posted = new Map(existing.map((row) => [row.run_id, row]));
  const changed = wanted.filter((row) => {
    const current = posted.get(row.run_id);
    return (
      !current ||
      current.run_date !== row.run_date ||
      current.run_type !== row.run_type ||
      Number(current.km) !== Number(row.km) ||
      current.pace_seconds !== row.pace_seconds
    );
  });
  if (changed.length) {
    await supabase.from("feed_posts").upsert(changed, { onConflict: "user_id,run_id" });
  }

  const keep = new Set(wanted.map((row) => row.run_id));
  const removed = existing.map((row) => row.run_id).filter((id) => !keep.has(id));
  if (removed.length) await supabase.from("feed_posts").delete().in("run_id", removed);
}

async function runSync() {
  const supabase = getClient();
  const user = status.user;
  if (!supabase || !user) return;

  const remoteRuns = await fetchRemoteRuns(supabase);
  const { data: remoteGoal, error: goalError } = await supabase
    .from("tracker_settings")
    .select("goal_km, gear, prefs, updated_at")
    .maybeSingle();
  if (goalError) throw goalError;

  // Merging and saving happen with no await between them, so a run added meanwhile is not lost.
  const local = getTracker();
  const { runs, deleted, toPush } = mergeRuns(local, remoteRuns);
  const goal = mergeGoal(
    {
      goalKm: local.goalKm,
      gear: local.gear,
      prefs: local.prefs,
      goalUpdatedAt: local.goalUpdatedAt,
    },
    remoteGoal,
  );
  applySynced({
    runs,
    deleted,
    goalKm: goal.goalKm,
    gear: goal.gear,
    prefs: { ...local.prefs, ...goal.prefs },
    goalUpdatedAt: goal.goalUpdatedAt,
  });

  for (let start = 0; start < toPush.length; start += PUSH_SIZE) {
    const rows = toPush
      .slice(start, start + PUSH_SIZE)
      .map((row) => ({ ...row, user_id: user.id }));
    const { error } = await supabase
      .from("runs")
      .upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }

  if (goal.push) {
    const { error } = await supabase.from("tracker_settings").upsert({
      user_id: user.id,
      goal_km: goal.goalKm,
      gear: goal.gear,
      prefs: goal.prefs,
      updated_at: goal.goalUpdatedAt,
    });
    if (error) throw error;
  }

  await publishStats(supabase, user.id);
  await publishFeed(supabase);
}

export async function syncNow() {
  if (!status.user) return false;
  if (running) {
    queued = true;
    return false;
  }
  running = true;
  setStatus({ phase: "syncing" });
  let succeeded = false;
  try {
    await runSync();
    succeeded = true;
    setStatus({ phase: "idle", lastSyncedAt: new Date().toISOString() });
  } catch {
    setStatus({ phase: navigator.onLine ? "error" : "offline" });
  }
  running = false;
  if (queued) {
    queued = false;
    return syncNow();
  }
  return succeeded;
}

function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(syncNow, DEBOUNCE_MS);
}

export function startSync() {
  const supabase = getClient();
  if (!supabase || started) return;
  started = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    const changed = user?.id !== status.user?.id;
    setStatus({ user });
    // Supabase asks that its own calls wait until this callback has returned.
    if (user && changed) setTimeout(syncNow, 0);
  });

  onLocalChange(scheduleSync);
  window.addEventListener("online", syncNow);
  window.addEventListener("focus", syncNow);
}

// A typed code works inside an app installed on an iPhone, where an email link would open Safari instead.
export async function sendLoginCode(email) {
  const { error } = await getClient().auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyLoginCode(email, token) {
  const { error } = await getClient().auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

// Local data is cleared only after it is safely online, so the next account on this device starts clean.
export async function signOut() {
  if (!(await syncNow())) return false;
  await getClient().auth.signOut();
  resetTracker();
  setStatus({ lastSyncedAt: null, phase: "idle" });
  return true;
}
