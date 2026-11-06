"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import Calendar from "./Calendar";
import DayForm from "./DayForm";
import RunConditions from "./RunConditions";
import TrackerBib from "./TrackerBib";
import {
  entryForDate,
  formatClock,
  formatDistance,
  fullDate,
  hasDetail,
  isRunEntry,
  lastGearId,
  weekDays,
  weekStreak,
} from "./stats";
import { checkIn, deleteRun, saveRun } from "./store";

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

function TodayCheckIn({ today, entry, onEdit, onRun }) {
  if (!entry) {
    return (
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onRun(today)} className={PRIMARY}>
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
        onClick={() => (run ? checkIn(today, "rest") : onRun(today))}
        className={SECONDARY}
      >
        {run ? "Ganti rest" : "Ganti lari"}
      </button>
    </div>
  );
}

function Hero({ today, entries, onEdit, onRun }) {
  const entry = entryForDate(entries, today);
  const week = weekDays(entries, today);
  const streak = weekStreak(entries, today);
  const ranThisWeek = week.some((day) => day.entry && isRunEntry(day.entry));
  const [first, second, third] = headline(entry);

  return (
    <section className="overflow-x-clip bg-biru text-kertas">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
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
              <TodayCheckIn today={today} entry={entry} onEdit={onEdit} onRun={onRun} />
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

function Dashboard({ today, entries, gear, onToast }) {
  const router = useRouter();
  const [pickedDate, setPickedDate] = useState(null);
  const [form, setForm] = useState(null);
  const selected = pickedDate ?? today;

  // Invite links shared before the Teman page existed still point here.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("teman");
    if (code) router.replace(`/teman?teman=${encodeURIComponent(code)}`);
  }, [router]);

  function handleDelete(entry) {
    deleteRun(entry.id);
    onToast({
      message: `Absen ${fullDate(entry.date)} dihapus.`,
      undo: () => saveRun(entry),
    });
  }

  const openEdit = (date) => setForm({ date, forceRun: false });
  const openRun = (date) => setForm({ date, forceRun: true });

  function handleSave(entry) {
    saveRun(entry);
    setForm(null);
    onToast({ message: `Absen ${fullDate(entry.date)} tersimpan.` });
  }

  return (
    <>
      <Hero today={today} entries={entries} onEdit={openEdit} onRun={openRun} />
      <RunConditions />
      <Calendar
        entries={entries}
        gear={gear}
        today={today}
        selected={selected}
        onSelect={setPickedDate}
        onCheckIn={(date, type) => (type === "run" ? openRun(date) : checkIn(date, type))}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {form && (
        <DayForm
          key={form.date}
          date={form.date}
          entry={entryForDate(entries, form.date)}
          gear={gear}
          defaultGearId={lastGearId(entries, gear)}
          forceRun={form.forceRun}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}

export default function Tracker() {
  return <AppShell>{(app) => <Dashboard {...app} />}</AppShell>;
}
