import { parseClock } from "./stats";

export const RUN_TYPES = [
  { id: "easy", label: "Easy run", short: "Easy", hint: "Pace nyaman, napas tenang, masih bisa ngobrol." },
  { id: "long", label: "Long run", short: "Long", hint: "Lari terjauh minggu ini dengan pace santai dan stabil." },
  { id: "interval", label: "Interval", short: "Int", hint: "Repetisi cepat yang diselingi istirahat." },
  { id: "tempo", label: "Tempo", short: "Tempo", hint: "Kencang tapi terkontrol, biasanya 20 sampai 40 menit." },
  { id: "recovery", label: "Recovery", short: "Rec", hint: "Sangat pelan dan pendek setelah sesi berat." },
];

export const LEG_STATES = ["Segar", "Pegal", "Nyeri"];

export function runTypeLabel(id) {
  return RUN_TYPES.find((type) => type.id === id)?.label ?? "Lari";
}

export function runTypeShort(id) {
  return RUN_TYPES.find((type) => type.id === id)?.short ?? "";
}

export function usesSegments(type) {
  return type === "interval" || type === "tempo";
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return parsed > 0 ? parsed : 0;
}

export function parseKm(value) {
  return number(value);
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// Interval and tempo count every part of the session, so shoe mileage matches what was really run.
export function totalKm(type, values) {
  if (type === "interval") {
    const reps = Math.floor(number(values.reps));
    const hardKm = (reps * number(values.repMeters)) / 1000;
    const recoveryKm = (Math.max(reps - 1, 0) * number(values.recoveryMeters)) / 1000;
    if (!hardKm) return 0;
    return round(number(values.warmupKm) + hardKm + recoveryKm + number(values.cooldownKm), 2);
  }
  if (type === "tempo") {
    const tempoKm = number(values.tempoKm);
    if (!tempoKm) return 0;
    return round(number(values.warmupKm) + tempoKm + number(values.cooldownKm), 2);
  }
  return round(number(values.km), 2);
}

export function buildWorkout(type, values) {
  const hr = number(values.hr) || undefined;
  if (type === "interval") {
    return {
      warmupKm: number(values.warmupKm),
      reps: Math.floor(number(values.reps)),
      repMeters: number(values.repMeters),
      repPace: parseClock(values.repPace),
      restSeconds: parseClock(values.rest) || number(values.rest),
      recoveryMeters: number(values.recoveryMeters),
      cooldownKm: number(values.cooldownKm),
      hr,
    };
  }
  if (type === "tempo") {
    return {
      warmupKm: number(values.warmupKm),
      tempoKm: number(values.tempoKm),
      tempoPace: parseClock(values.tempoPace),
      cooldownKm: number(values.cooldownKm),
      hr,
    };
  }
  if (type === "long") {
    return { hr, gels: number(values.gels), waterMl: number(values.waterMl) };
  }
  if (type === "recovery") {
    return { hr, legs: values.legs ?? 0 };
  }
  return { hr };
}

function clockText(seconds, formatClock) {
  return seconds ? formatClock(seconds) : "";
}

export function workoutValues(workout, formatClock) {
  const data = workout ?? {};
  const text = (value) => (value ? String(value).replace(".", ",") : "");
  return {
    hr: text(data.hr),
    legs: data.legs ?? 0,
    gels: text(data.gels),
    waterMl: text(data.waterMl),
    warmupKm: text(data.warmupKm),
    reps: text(data.reps),
    repMeters: text(data.repMeters),
    repPace: clockText(data.repPace, formatClock),
    rest: clockText(data.restSeconds, formatClock),
    recoveryMeters: text(data.recoveryMeters),
    cooldownKm: text(data.cooldownKm),
    tempoKm: text(data.tempoKm),
    tempoPace: clockText(data.tempoPace, formatClock),
  };
}

// The rows shown on the receipt for each kind of run.
export function workoutRows(entry, helpers) {
  const { formatClock, formatDistance } = helpers;
  const data = entry.workout ?? {};
  const rows = [];
  const distance = (km) => `${formatDistance(km)} km`;

  if (entry.runType === "interval") {
    if (data.warmupKm) rows.push(["Pemanasan", distance(data.warmupKm)]);
    if (data.reps) rows.push(["Repetisi", `${data.reps} x ${data.repMeters} m`]);
    if (data.repPace) rows.push(["Pace repetisi", `${formatClock(data.repPace)}/km`]);
    if (data.restSeconds) rows.push(["Istirahat", formatClock(data.restSeconds)]);
    if (data.recoveryMeters) rows.push(["Jog istirahat", `${data.recoveryMeters} m`]);
    if (data.cooldownKm) rows.push(["Pendinginan", distance(data.cooldownKm)]);
  }
  if (entry.runType === "tempo") {
    if (data.warmupKm) rows.push(["Pemanasan", distance(data.warmupKm)]);
    if (data.tempoKm) rows.push(["Tempo", distance(data.tempoKm)]);
    if (data.tempoPace) rows.push(["Pace tempo", `${formatClock(data.tempoPace)}/km`]);
    if (data.cooldownKm) rows.push(["Pendinginan", distance(data.cooldownKm)]);
  }
  if (entry.runType === "long") {
    if (data.gels) rows.push(["Gel", `${data.gels} buah`]);
    if (data.waterMl) rows.push(["Minum", `${data.waterMl} ml`]);
  }
  if (entry.runType === "recovery" && entry.workout) {
    rows.push(["Kondisi kaki", LEG_STATES[data.legs ?? 0]]);
  }
  if (data.hr) rows.push(["Detak rata-rata", `${data.hr} bpm`]);
  return rows;
}
