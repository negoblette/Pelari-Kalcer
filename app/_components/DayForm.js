"use client";

import { useEffect, useRef, useState } from "react";
import {
  LEG_STATES,
  RUN_TYPES,
  buildWorkout,
  parseKm,
  totalKm,
  usesSegments,
  workoutValues,
} from "./runTypes";
import { FEELS, formatClock, formatDistance, fullDate, parseClock } from "./stats";

const LABEL = "block font-mono text-xs";
const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";
const CHOICE = "h-12 border-2 border-aspal font-medium transition-colors";

function TextField({ label, value, onChange, placeholder, numeric }) {
  return (
    <label className={LABEL}>
      {label}
      <input
        inputMode={numeric ? "decimal" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD}
      />
    </label>
  );
}

function Choices({ label, options, value, onChange }) {
  return (
    <fieldset className="mt-4">
      <legend className={LABEL}>{label}</legend>
      <div
        className="mt-1.5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === index}
            onClick={() => onChange(index)}
            className={`${CHOICE} text-sm ${value === index ? "bg-aspal text-kertas" : "hover:bg-aspal/10"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function initialValues(entry, defaultGearId, forceRun) {
  const hasTime = entry?.km > 0 && entry?.seconds > 0;
  return {
    type: entry?.type === "rest" && !forceRun ? "rest" : "run",
    runType: entry?.runType ?? "easy",
    km: entry?.km ? String(entry.km).replace(".", ",") : "",
    pace: hasTime ? formatClock(entry.seconds / entry.km) : "",
    time: entry?.seconds ? formatClock(entry.seconds) : "",
    gearId: entry?.gearId ?? defaultGearId ?? "",
    share: entry?.share !== false,
    feel: entry?.feel ?? 1,
    note: entry?.note ?? "",
    ...workoutValues(entry?.workout, formatClock),
  };
}

export default function DayForm({ date, entry, gear, defaultGearId, forceRun, onSave, onClose }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(entry, defaultGearId, forceRun));
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function update(changes) {
    setValues((current) => ({ ...current, ...changes }));
  }

  function changeKm(km) {
    const distance = parseKm(km);
    const pace = parseClock(values.pace);
    update({ km, ...(distance && pace ? { time: formatClock(pace * distance) } : {}) });
  }

  function changePace(pace) {
    const distance = parseKm(values.km);
    const seconds = parseClock(pace);
    update({ pace, ...(distance && seconds ? { time: formatClock(seconds * distance) } : {}) });
  }

  function changeTime(time) {
    const distance = parseKm(values.km);
    const seconds = parseClock(time);
    update({ time, ...(distance && seconds ? { pace: formatClock(seconds / distance) } : {}) });
  }

  const segmented = usesSegments(values.runType);
  const km = totalKm(values.runType, values);
  const seconds = parseClock(values.time);

  function submit(event) {
    event.preventDefault();
    const id = entry?.id ?? `day-${date}`;

    if (values.type === "rest") {
      onSave({ ...entry, id, date, type: "rest", note: values.note.trim() });
      return;
    }

    const clocks = [
      [values.time, "Tulis waktu seperti 45:30 atau 1:05:00."],
      [values.pace, "Tulis pace seperti 7:30."],
      [values.repPace, "Tulis pace repetisi seperti 4:30."],
      [values.tempoPace, "Tulis pace tempo seperti 5:15."],
    ];
    for (const [value, message] of clocks) {
      if (value.trim() && !parseClock(value)) return setError(message);
    }

    onSave({
      ...entry,
      id,
      date,
      type: "run",
      runType: values.runType,
      km: km || null,
      seconds: seconds ? Math.round(seconds) : null,
      gearId: values.gearId || undefined,
      feel: values.feel,
      note: values.note.trim(),
      workout: buildWorkout(values.runType, values),
      share: values.share,
    });
  }

  const usableGear = gear.filter((item) => !item.retired || item.id === values.gearId);
  const activeType = RUN_TYPES.find((type) => type.id === values.runType);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="day-form-title"
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto bg-kertas p-0 text-aspal backdrop:bg-biru/80"
    >
      <form onSubmit={submit}>
        <div className="flex items-baseline justify-between gap-4 bg-oranye px-5 py-2.5 font-mono text-sm font-medium uppercase sm:px-7">
          <span>Absen lari</span>
          <span>{fullDate(date)}</span>
        </div>

        <div className="p-5 sm:p-7">
          <h2 id="day-form-title" className="font-display text-5xl font-black uppercase leading-none">
            {values.type === "rest" ? "Hari rest" : "Detail lari"}
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              ["run", "Lari"],
              ["rest", "Rest"],
            ].map(([type, label]) => (
              <button
                key={type}
                type="button"
                aria-pressed={values.type === type}
                onClick={() => update({ type })}
                className={`${CHOICE} font-display text-2xl font-extrabold uppercase ${
                  values.type === type ? "bg-aspal text-kertas" : "hover:bg-aspal/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {values.type === "run" && (
            <>
              <fieldset className="mt-5">
                <legend className={LABEL}>Tipe lari</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {RUN_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      aria-pressed={values.runType === type.id}
                      onClick={() => update({ runType: type.id })}
                      className={`${CHOICE} text-sm ${
                        values.runType === type.id ? "bg-biru text-kertas" : "hover:bg-aspal/10"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm">{activeType.hint}</p>
              </fieldset>

              {!segmented && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <TextField label="Jarak (km)" numeric placeholder="5,2" value={values.km} onChange={changeKm} />
                  <TextField label="Pace (/km)" placeholder="7:30" value={values.pace} onChange={changePace} />
                  <TextField label="Waktu" placeholder="45:30" value={values.time} onChange={changeTime} />
                </div>
              )}

              {values.runType === "interval" && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <TextField label="Pemanasan (km)" numeric placeholder="1,5" value={values.warmupKm} onChange={(warmupKm) => update({ warmupKm })} />
                  <TextField label="Jumlah repetisi" numeric placeholder="6" value={values.reps} onChange={(reps) => update({ reps })} />
                  <TextField label="Jarak repetisi (m)" numeric placeholder="400" value={values.repMeters} onChange={(repMeters) => update({ repMeters })} />
                  <TextField label="Pace repetisi (/km)" placeholder="4:30" value={values.repPace} onChange={(repPace) => update({ repPace })} />
                  <TextField label="Istirahat (mm:dd)" placeholder="1:30" value={values.rest} onChange={(rest) => update({ rest })} />
                  <TextField label="Jog istirahat (m)" numeric placeholder="200" value={values.recoveryMeters} onChange={(recoveryMeters) => update({ recoveryMeters })} />
                  <TextField label="Pendinginan (km)" numeric placeholder="1" value={values.cooldownKm} onChange={(cooldownKm) => update({ cooldownKm })} />
                </div>
              )}

              {values.runType === "tempo" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <TextField label="Pemanasan (km)" numeric placeholder="2" value={values.warmupKm} onChange={(warmupKm) => update({ warmupKm })} />
                  <TextField label="Jarak tempo (km)" numeric placeholder="5" value={values.tempoKm} onChange={(tempoKm) => update({ tempoKm })} />
                  <TextField label="Pace tempo (/km)" placeholder="5:15" value={values.tempoPace} onChange={(tempoPace) => update({ tempoPace })} />
                  <TextField label="Pendinginan (km)" numeric placeholder="1" value={values.cooldownKm} onChange={(cooldownKm) => update({ cooldownKm })} />
                </div>
              )}

              {segmented && (
                <div className="mt-3 grid grid-cols-2 items-end gap-3">
                  <TextField label="Waktu total" placeholder="52:30" value={values.time} onChange={(time) => update({ time })} />
                  <p className="pb-2">
                    <span className="block font-mono text-xs">Total jarak</span>
                    <span className="font-display text-4xl font-black leading-none text-biru tabular-nums">
                      {formatDistance(km)} km
                    </span>
                  </p>
                </div>
              )}

              {values.runType === "long" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <TextField label="Gel yang dipakai" numeric placeholder="2" value={values.gels} onChange={(gels) => update({ gels })} />
                  <TextField label="Minum (ml)" numeric placeholder="500" value={values.waterMl} onChange={(waterMl) => update({ waterMl })} />
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className={LABEL}>
                  Gear
                  <select
                    value={values.gearId}
                    onChange={(event) => update({ gearId: event.target.value })}
                    className={FIELD}
                  >
                    <option value="">Tanpa gear</option>
                    {usableGear.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField label="Detak rata-rata (bpm)" numeric placeholder="145" value={values.hr} onChange={(hr) => update({ hr })} />
              </div>
              {values.gearId && km > 0 && (
                <p className="mt-2 text-sm">{formatDistance(km)} km ditambahkan ke mileage gear ini.</p>
              )}
              {!gear.length && (
                <p className="mt-2 text-sm">Tambahkan sepatu di bagian Gear supaya mileage-nya terhitung.</p>
              )}

              {values.runType === "recovery" && (
                <Choices
                  label="Kondisi kaki"
                  options={LEG_STATES}
                  value={values.legs}
                  onChange={(legs) => update({ legs })}
                />
              )}

              <label className="mt-4 flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={values.share}
                  onChange={(event) => update({ share: event.target.checked })}
                  className="size-5 accent-biru"
                />
                Tampilkan di feed teman
              </label>

              <Choices
                label="Rasanya"
                options={FEELS}
                value={values.feel}
                onChange={(feel) => update({ feel })}
              />
            </>
          )}

          <div className="mt-4">
            <TextField label="Catatan" value={values.note} onChange={(note) => update({ note })} />
          </div>

          {error && (
            <p role="alert" className="mt-4 font-medium text-biru">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="h-13 px-5 font-medium hover:bg-aspal/10">
              Batal
            </button>
            <button
              type="submit"
              className="h-13 bg-biru px-8 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
            >
              Simpan
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
