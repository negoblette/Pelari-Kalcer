"use client";

import { useEffect, useRef, useState } from "react";
import Calendar from "./Calendar";
import Countdown from "./Countdown";
import DayForm from "./DayForm";
import Gear from "./Gear";
import InstallButton from "./InstallButton";
import Quests from "./Quests";
import RaceMode from "./RaceMode";
import Recap from "./Recap";
import RunConditions from "./RunConditions";
import WeekPlan from "./WeekPlan";
import SyncControl from "./SyncControl";
import TemanLari from "./TemanLari";
import TrackerBib from "./TrackerBib";
import {
  entryForDate,
  formatClock,
  formatDistance,
  fullDate,
  hasDetail,
  isRunEntry,
  weekDays,
  weekStreak,
} from "./stats";
import {
  checkIn,
  deleteRun,
  exportData,
  importData,
  removeSampleRuns,
  saveRun,
  useToday,
  useTracker,
} from "./store";

const LINKS = [
  { href: "#rencana", label: "Rencana" },
  { href: "#kalender", label: "Kalender" },
  { href: "#quest", label: "Quest" },
  { href: "#race", label: "Race" },
  { href: "#teman", label: "Teman" },
  { href: "#gear", label: "Gear" },
  { href: "#recap", label: "Recap" },
];

const PRIMARY =
  "h-16 bg-kertas px-8 font-display text-3xl font-extrabold uppercase text-biru transition-colors hover:bg-marka hover:text-aspal";
const SECONDARY =
  "h-16 border-3 border-kertas px-8 font-display text-3xl font-extrabold uppercase transition-colors hover:bg-kertas hover:text-biru";

function headline(entry) {
  if (!entry) return ["Hari ini", "lari atau", "rest?"];
  if (!isRunEntry(entry)) return ["Hari ini", "rest.", "kaki libur."];
  if (!hasDetail(entry)) return ["Hari ini", "lari.", "isi nanti."];
  return [`${formatDistance(entry.km)} km`, "hari ini.", "mantap."];
}

function streakNote(streak, ranThisWeek) {
  if (ranThisWeek) return `Minggu ini aman. Streak kamu ${streak} minggu.`;
  if (streak) return `Minggu ini belum lari. Streak ${streak} minggu menunggu.`;
  return "Satu lari minggu ini sudah memulai streak.";
}

function TodayCheckIn({ today, entry, onEdit }) {
  if (!entry) {
    return (
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => checkIn(today, "run")} className={PRIMARY}>
          Lari
        </button>
        <button type="button" onClick={() => checkIn(today, "rest")} className={SECONDARY}>
          Rest
        </button>
      </div>
    );
  }

  const run = isRunEntry(entry);
  return (
    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => onEdit(today)} className={PRIMARY}>
        {run && !hasDetail(entry) ? "Isi detail" : "Ubah"}
      </button>
      <button
        type="button"
        onClick={() => checkIn(today, run ? "rest" : "run")}
        className={SECONDARY}
      >
        {run ? "Ganti rest" : "Ganti lari"}
      </button>
    </div>
  );
}

function Hero({ today, entries, onEdit, syncSlot }) {
  const entry = entryForDate(entries, today);
  const week = weekDays(entries, today);
  const streak = weekStreak(entries, today);
  const ranThisWeek = week.some((day) => day.entry && isRunEntry(day.entry));
  const [first, second, third] = headline(entry);

  return (
    <section className="overflow-x-clip bg-biru text-kertas">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <nav aria-label="Utama" className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
          <p className="font-display text-2xl font-black uppercase tracking-wide">Pelari Kalcer</p>
          <ul className="hidden gap-7 text-sm font-medium md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-marka">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <Countdown />
            {syncSlot}
          </div>
        </nav>

        <div className="grid items-center gap-x-12 gap-y-14 pb-20 pt-8 lg:grid-cols-[1.3fr_1fr] lg:pt-12">
          <div>
            <p className="mb-4 font-mono text-sm">{fullDate(today)}</p>
            <h1 className="font-display text-[19vw] font-black uppercase leading-[0.86] lg:text-[min(10.5vw,9.75rem)]">
              {first}
              <br />
              {second}
              <span className="block text-marka">{third}</span>
            </h1>
            {entry && hasDetail(entry) && entry.seconds > 0 && (
              <p className="mt-5 font-mono text-sm">
                Waktu {formatClock(entry.seconds)} · Pace {formatClock(entry.seconds / entry.km)}/km
              </p>
            )}
            <p className="mt-6 max-w-xl text-lg leading-relaxed">
              {streakNote(streak, ranThisWeek)}
            </p>
            <div className="mt-8">
              <TodayCheckIn today={today} entry={entry} onEdit={onEdit} />
            </div>
          </div>

          <div className="bib-in mx-auto w-full max-w-[26rem] lg:max-w-none">
            <TrackerBib streak={streak} week={week} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DataLinks({ onToast }) {
  const fileRef = useRef(null);

  async function handleImport(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const count = await importData(file);
      onToast({ message: `${count} catatan berhasil diimpor.` });
    } catch {
      onToast({ message: "File tidak bisa dibaca. Gunakan hasil ekspor tracker ini." });
    }
  }

  return (
    <div className="flex flex-wrap gap-5">
      <InstallButton onToast={onToast} />
      <button type="button" onClick={exportData} className="underline underline-offset-4 hover:text-marka">
        Ekspor cadangan
      </button>
      <button
        type="button"
        onClick={() => fileRef.current.click()}
        className="underline underline-offset-4 hover:text-marka"
      >
        Impor cadangan
      </button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
    </div>
  );
}

export default function Tracker() {
  const tracker = useTracker();
  const today = useToday();
  const [pickedDate, setPickedDate] = useState(null);
  const [formDate, setFormDate] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!tracker || !today) {
    return <main className="min-h-dvh bg-biru" aria-busy="true" />;
  }

  const { runs: entries, gear, prefs, saveError } = tracker;
  const selected = pickedDate ?? today;
  const hasSample = entries.some((entry) => entry.sample);

  function handleDelete(entry) {
    deleteRun(entry.id);
    setToast({
      message: `Absen ${fullDate(entry.date)} dihapus.`,
      undo: () => saveRun(entry),
    });
  }

  function handleSave(entry) {
    saveRun(entry);
    setFormDate(null);
    setToast({ message: `Absen ${fullDate(entry.date)} tersimpan.` });
  }

  return (
    <main>
      {saveError && (
        <p role="alert" className="bg-oranye px-4 py-3 text-center font-medium text-aspal">
          Browser menolak menyimpan data. Ekspor cadangan sekarang sebelum menutup halaman.
        </p>
      )}
      {hasSample && (
        <p className="bg-marka px-4 py-2 text-center text-sm font-medium text-aspal">
          Masih ada data contoh dari versi sebelumnya.{" "}
          <button type="button" onClick={removeSampleRuns} className="underline underline-offset-4">
            Hapus data contoh
          </button>
        </p>
      )}

      <Hero today={today} entries={entries} onEdit={setFormDate} syncSlot={<SyncControl />} />
      <RunConditions />
      <WeekPlan today={today} entries={entries} plan={prefs.plan} onToast={setToast} />
      <Calendar
        entries={entries}
        gear={gear}
        today={today}
        selected={selected}
        onSelect={setPickedDate}
        onCheckIn={checkIn}
        onEdit={setFormDate}
        onDelete={handleDelete}
      />
      <Quests today={today} entries={entries} plan={prefs.plan} />
      <RaceMode today={today} entries={entries} race={prefs.race} />
      <TemanLari today={today} entries={entries} onToast={setToast} />
      <Gear gear={gear} entries={entries} />
      <Recap today={today} entries={entries} gear={gear} onToast={setToast} />

      <footer className="bg-biru text-kertas">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-x-8 gap-y-3 px-4 py-6 font-mono text-sm sm:px-8">
          <p>Dibuat buat yang larinya pelan tapi niat.</p>
          <DataLinks onToast={setToast} />
        </div>
      </footer>

      {formDate && (
        <DayForm
          key={formDate}
          date={formDate}
          entry={entryForDate(entries, formDate)}
          gear={gear}
          onSave={handleSave}
          onClose={() => setFormDate(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-4 bg-aspal px-4 py-3 text-kertas shadow-2xl"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
              className="text-sm font-bold text-marka underline underline-offset-4"
            >
              Batalkan
            </button>
          )}
        </div>
      )}
    </main>
  );
}
