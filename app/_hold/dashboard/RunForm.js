"use client";

import { useEffect, useRef, useState } from "react";
import { FEELS, formatClock, uniqueValues } from "@/app/_components/stats";

const FIELD =
  "mt-1.5 h-11 w-full rounded-md border border-white/15 bg-black/30 px-3 text-base text-kertas outline-none focus:border-marka";
const LABEL = "block font-mono text-xs text-white/70";

function initialValues(run, today) {
  const seconds = run?.seconds ?? 0;
  return {
    date: run?.date ?? today,
    km: run ? String(run.km) : "",
    hours: run ? String(Math.floor(seconds / 3600)) : "",
    minutes: run ? String(Math.floor((seconds % 3600) / 60)) : "",
    secs: run ? String(seconds % 60) : "",
    route: run?.route ?? "",
    shoe: run?.shoe ?? "",
    feel: run?.feel ?? 1,
    note: run?.note ?? "",
  };
}

export default function RunForm({ run, runs, today, onSave, onClose }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(run, today));
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const km = Number(values.km.replace(",", "."));
  const seconds =
    Number(values.hours || 0) * 3600 +
    Number(values.minutes || 0) * 60 +
    Number(values.secs || 0);
  const preview = km > 0 && seconds > 0 ? formatClock(seconds / km) : "--:--";

  function submit(event) {
    event.preventDefault();
    if (!(km > 0)) return setError("Isi jarak lebih dari 0 km.");
    if (!(seconds > 0)) return setError("Isi waktu larinya.");
    onSave({
      id: run?.id ?? crypto.randomUUID(),
      date: values.date,
      km: Math.round(km * 100) / 100,
      seconds,
      route: values.route.trim(),
      shoe: values.shoe.trim(),
      feel: values.feel,
      note: values.note.trim(),
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="run-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl border border-white/15 bg-panel p-0 text-kertas backdrop:bg-black/70"
    >
      <form onSubmit={submit} className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="run-form-title"
            className="font-display text-4xl font-black uppercase leading-none"
          >
            {run ? "Ubah lari" : "Catat lari"}
          </h2>
          <p className="text-right">
            <span className="block font-mono text-xs text-white/70">Pace</span>
            <span className="font-display text-4xl font-black leading-none text-marka tabular-nums">
              {preview}
            </span>
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>
            Tanggal
            <input
              type="date"
              required
              value={values.date}
              onChange={(event) => update("date", event.target.value)}
              className={`${FIELD} [color-scheme:dark]`}
            />
          </label>
          <label className={LABEL}>
            Jarak (km)
            <input
              inputMode="decimal"
              required
              autoFocus
              placeholder="5,2"
              value={values.km}
              onChange={(event) => update("km", event.target.value)}
              className={FIELD}
            />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className={LABEL}>Waktu</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["hours", "Jam"],
              ["minutes", "Menit"],
              ["secs", "Detik"],
            ].map(([field, label]) => (
              <input
                key={field}
                type="number"
                min="0"
                max={field === "hours" ? undefined : 59}
                aria-label={label}
                placeholder={label}
                value={values[field]}
                onChange={(event) => update(field, event.target.value)}
                className={FIELD}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>
            Rute
            <input
              list="route-options"
              value={values.route}
              onChange={(event) => update("route", event.target.value)}
              className={FIELD}
            />
            <datalist id="route-options">
              {uniqueValues(runs, "route").map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label className={LABEL}>
            Sepatu
            <input
              list="shoe-options"
              value={values.shoe}
              onChange={(event) => update("shoe", event.target.value)}
              className={FIELD}
            />
            <datalist id="shoe-options">
              {uniqueValues(runs, "shoe").map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className={LABEL}>Rasanya</legend>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {FEELS.map((feel, index) => (
              <button
                key={feel}
                type="button"
                aria-pressed={values.feel === index}
                onClick={() => update("feel", index)}
                className={`h-11 rounded-md border text-sm font-medium transition-colors ${
                  values.feel === index
                    ? "border-oranye bg-oranye text-aspal"
                    : "border-white/15 hover:border-white/40"
                }`}
              >
                {feel}
              </button>
            ))}
          </div>
        </fieldset>

        <label className={`${LABEL} mt-4`}>
          Catatan
          <input
            value={values.note}
            onChange={(event) => update("note", event.target.value)}
            className={FIELD}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-marka">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-md px-5 font-medium hover:bg-white/10"
          >
            Batal
          </button>
          <button
            type="submit"
            className="h-12 rounded-md bg-oranye px-7 font-display text-2xl font-extrabold uppercase text-aspal transition-colors hover:bg-marka"
          >
            Simpan
          </button>
        </div>
      </form>
    </dialog>
  );
}
