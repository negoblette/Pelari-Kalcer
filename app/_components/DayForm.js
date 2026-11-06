"use client";

import { useEffect, useRef, useState } from "react";
import { FEELS, formatClock, fullDate, parseClock } from "./stats";

const LABEL = "block font-mono text-xs";
const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";
const CHOICE = "h-12 border-2 border-aspal font-medium transition-colors";

function parseKm(value) {
  const km = Number(value.replace(",", "."));
  return km > 0 ? km : 0;
}

function initialValues(entry) {
  const hasTime = entry?.km > 0 && entry?.seconds > 0;
  return {
    type: entry?.type === "rest" ? "rest" : "run",
    km: entry?.km ? String(entry.km).replace(".", ",") : "",
    pace: hasTime ? formatClock(entry.seconds / entry.km) : "",
    time: hasTime ? formatClock(entry.seconds) : "",
    gearId: entry?.gearId ?? "",
    feel: entry?.feel ?? 1,
    note: entry?.note ?? "",
  };
}

export default function DayForm({ date, entry, gear, onSave, onClose }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(entry));
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

  function submit(event) {
    event.preventDefault();
    if (values.type === "rest") {
      onSave({ ...entry, id: entry?.id ?? `day-${date}`, date, type: "rest", note: values.note.trim() });
      return;
    }

    const km = parseKm(values.km);
    const seconds = parseClock(values.time);
    if (values.km.trim() && !km) return setError("Jarak harus lebih dari 0 km.");
    if (values.pace.trim() && !parseClock(values.pace)) return setError("Tulis pace seperti 7:30.");
    if (values.time.trim() && !seconds) return setError("Tulis waktu seperti 45:30 atau 1:05:00.");

    onSave({
      ...entry,
      id: entry?.id ?? `day-${date}`,
      date,
      type: "run",
      km: km ? Math.round(km * 100) / 100 : null,
      seconds: seconds ? Math.round(seconds) : null,
      gearId: values.gearId || undefined,
      feel: values.feel,
      note: values.note.trim(),
    });
  }

  const usableGear = gear.filter((item) => !item.retired || item.id === values.gearId);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="day-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl bg-kertas p-0 text-aspal backdrop:bg-biru/80"
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
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className={LABEL}>
                  Jarak (km)
                  <input
                    inputMode="decimal"
                    placeholder="5,2"
                    value={values.km}
                    onChange={(event) => changeKm(event.target.value)}
                    className={FIELD}
                  />
                </label>
                <label className={LABEL}>
                  Pace (/km)
                  <input
                    inputMode="text"
                    placeholder="7:30"
                    value={values.pace}
                    onChange={(event) => changePace(event.target.value)}
                    className={FIELD}
                  />
                </label>
                <label className={LABEL}>
                  Waktu
                  <input
                    inputMode="text"
                    placeholder="45:30"
                    value={values.time}
                    onChange={(event) => changeTime(event.target.value)}
                    className={FIELD}
                  />
                </label>
              </div>

              <label className={`${LABEL} mt-4`}>
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

              <fieldset className="mt-4">
                <legend className={LABEL}>Rasanya</legend>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {FEELS.map((feel, index) => (
                    <button
                      key={feel}
                      type="button"
                      aria-pressed={values.feel === index}
                      onClick={() => update({ feel: index })}
                      className={`${CHOICE} text-sm ${
                        values.feel === index ? "bg-aspal text-kertas" : "hover:bg-aspal/10"
                      }`}
                    >
                      {feel}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <label className={`${LABEL} mt-4`}>
            Catatan
            <input
              value={values.note}
              onChange={(event) => update({ note: event.target.value })}
              className={FIELD}
            />
          </label>

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
