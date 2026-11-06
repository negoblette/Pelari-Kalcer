"use client";

import { useEffect, useRef, useState } from "react";
import { raceStatus } from "./insights";
import { formatClock, formatDistance, fullDate, parseClock } from "./stats";
import { setPrefs } from "./store";

const DISTANCES = [
  { km: 5, label: "5K" },
  { km: 10, label: "10K" },
  { km: 21.1, label: "21K" },
  { km: 42.2, label: "42K" },
];
const LABEL = "block font-mono text-xs";
const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";

function RaceForm({ race, today, onClose }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState(race?.name ?? "");
  const [date, setDate] = useState(race?.date ?? today);
  const [km, setKm] = useState(race?.km ?? 10);
  const [target, setTarget] = useState(race?.targetSeconds ? formatClock(race.targetSeconds) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function submit(event) {
    event.preventDefault();
    const targetSeconds = target.trim() ? parseClock(target) : 0;
    if (target.trim() && !targetSeconds) return setError("Tulis target seperti 58:00 atau 2:10:00.");
    setPrefs({ race: { name: name.trim(), date, km, targetSeconds } });
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="race-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-kertas p-5 text-aspal backdrop:bg-biru/80 sm:p-7"
    >
      <form onSubmit={submit}>
        <h2 id="race-form-title" className="font-display text-5xl font-black uppercase leading-none">
          Target race
        </h2>
        <label className={`${LABEL} mt-5`}>
          Nama race
          <input
            required
            autoFocus
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className={`${LABEL} mt-4`}>
          Tanggal
          <input
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={FIELD}
          />
        </label>
        <fieldset className="mt-4">
          <legend className={LABEL}>Jarak</legend>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {DISTANCES.map((item) => (
              <button
                key={item.km}
                type="button"
                aria-pressed={km === item.km}
                onClick={() => setKm(item.km)}
                className={`h-12 border-2 border-aspal font-display text-2xl font-extrabold ${
                  km === item.km ? "bg-aspal text-kertas" : "hover:bg-aspal/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={`${LABEL} mt-4`}>
          Target waktu (boleh kosong)
          <input
            placeholder="58:00"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
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
      </form>
    </dialog>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs">{label}</p>
      <p className="font-display text-4xl font-black leading-none tabular-nums">{value}</p>
    </div>
  );
}

export default function RaceMode({ today, entries, race }) {
  const [editing, setEditing] = useState(false);
  const status = race ? raceStatus(race, entries, today) : null;
  const past = status && status.daysLeft < 0;

  let countdown = "";
  if (status) {
    if (status.daysLeft > 0) countdown = String(status.daysLeft);
    else if (status.daysLeft === 0) countdown = "Hari ini";
    else countdown = "Selesai";
  }

  return (
    <section id="race" className="scroll-mt-4 bg-oranye py-16 text-aspal lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Mode race
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-14 bg-aspal px-6 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru"
            >
              {race ? "Ubah race" : "Tambah race"}
            </button>
            {race && (
              <button
                type="button"
                onClick={() => setPrefs({ race: null })}
                className="h-14 border-3 border-aspal px-6 font-display text-2xl font-extrabold uppercase transition-colors hover:bg-aspal hover:text-kertas"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {race ? (
          <div className="mt-8 grid items-end gap-x-12 gap-y-8 lg:grid-cols-2">
            <div>
              <p className="font-mono text-sm">
                {race.name} · {fullDate(race.date)}
              </p>
              <p className="mt-2 font-display text-[clamp(6rem,17vw,13rem)] font-black uppercase leading-[0.85] tabular-nums">
                {countdown}
              </p>
              {!past && status.daysLeft > 0 && (
                <p className="mt-2 font-display text-4xl font-black uppercase">
                  Hari lagi · {status.weeksLeft} minggu
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Fact label="Jarak" value={`${formatDistance(race.km)} km`} />
              <Fact label="Lari terjauh" value={`${formatDistance(status.longest)} km`} />
              <Fact
                label="Pace target"
                value={status.targetPace ? formatClock(status.targetPace) : "–"}
              />
              <Fact
                label="Pace 30 hari"
                value={status.recentPace ? formatClock(status.recentPace) : "–"}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 max-w-lg text-lg leading-relaxed">
            Isi race berikutnya untuk melihat hitung mundur, pace yang perlu dikejar, dan
            kesiapan jarak kamu.
          </p>
        )}
      </div>

      {editing && <RaceForm race={race} today={today} onClose={() => setEditing(false)} />}
    </section>
  );
}
