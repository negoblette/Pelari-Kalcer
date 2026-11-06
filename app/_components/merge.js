export const EPOCH = "1970-01-01T00:00:00.000Z";

function time(value) {
  return Date.parse(value ?? EPOCH);
}

function localRows(runs, deleted) {
  const rows = new Map();
  for (const [id, updatedAt] of Object.entries(deleted)) {
    rows.set(id, { id, data: {}, updated_at: updatedAt, deleted: true });
  }
  for (const run of runs) {
    if (run.sample) continue;
    const updatedAt = run.updatedAt ?? EPOCH;
    const tombstone = rows.get(run.id);
    if (tombstone && time(tombstone.updated_at) > time(updatedAt)) continue;
    rows.set(run.id, { id: run.id, data: run, updated_at: updatedAt, deleted: false });
  }
  return rows;
}

// Last write wins per run, and a deletion counts as a write so it reaches other devices.
export function mergeRuns({ runs, deleted }, remoteRows) {
  const merged = localRows(runs, deleted);
  const remoteById = new Map(remoteRows.map((row) => [row.id, row]));
  const toPush = [];

  for (const row of merged.values()) {
    const remote = remoteById.get(row.id);
    if (!remote || time(row.updated_at) > time(remote.updated_at)) toPush.push(row);
  }

  for (const remote of remoteRows) {
    const local = merged.get(remote.id);
    if (!local || time(remote.updated_at) > time(local.updated_at)) {
      merged.set(remote.id, remote);
    }
  }

  const nextRuns = runs.filter((run) => run.sample);
  const nextDeleted = {};
  for (const row of merged.values()) {
    if (row.deleted) nextDeleted[row.id] = row.updated_at;
    else nextRuns.push({ ...row.data, id: row.id, updatedAt: row.updated_at });
  }

  return { runs: nextRuns, deleted: nextDeleted, toPush };
}

export function mergeGoal(local, remote) {
  if (!remote) return { ...local, push: true };
  if (time(remote.updated_at) > time(local.goalUpdatedAt)) {
    return {
      goalKm: Number(remote.goal_km),
      gear: remote.gear ?? [],
      prefs: remote.prefs ?? {},
      goalUpdatedAt: remote.updated_at,
      push: false,
    };
  }
  return { ...local, push: time(local.goalUpdatedAt) > time(remote.updated_at) };
}
