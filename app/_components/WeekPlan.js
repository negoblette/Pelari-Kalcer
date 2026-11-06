"use client";

import { planDays, planScore } from "./insights";
import { downloadStreakReminder, shareCard } from "./share";
import {
  detailSummary,
  formatClock,
  formatDistance,
  isRunEntry,
  shortDate,
  weekStreak,
} from "./stats";
import { setPrefs } from "./store";

const NEXT_PLAN = { null: "run", run: "rest", rest: null };
const PLAN_LABEL = { null: "Bebas", run: "Lari", rest: "Rest" };
const RESULT_LABEL = {
  open: "Belum",
  ran: "Sudah lari",
  rested: "Sudah rest",
  missed: "Terlewat",
};

function ticketStyle(planned) {
  if (planned === "run") return "bg-oranye text-aspal";
  if (planned === "rest") return "bg-aspal text-kertas";
  return "bg-kertas text-aspal hover:bg-marka";
}

export default function WeekPlan({ today, entries, plan, onToast }) {
  const days = planDays(plan, entries, today);
  const score = planScore(days);
  const entered = days.map((day) => day.entry).filter(Boolean);
  const summary = detailSummary(entered);
  const runCount = entered.filter(isRunEntry).length;
  const streak = weekStreak(entries, today);
  const weekLabel = `${shortDate(days[0].date)} – ${shortDate(days[6].date)}`;

  function cycle(index) {
    const next = [...plan];
    next[index] = NEXT_PLAN[plan[index] ?? null];
    setPrefs({ plan: next });
  }

  function handleCard() {
    shareCard({
      band: "Kartu mingguan",
      big: formatDistance(summary.km),
      label: "Km minggu ini",
      fields: [
        ["Lari", `${runCount} kali`],
        ["Pace", summary.pace ? formatClock(summary.pace) : "–"],
        ["Streak", `${streak} minggu`],
      ],
      footer: weekLabel,
      fileName: `kartu-minggu-${days[0].date}.png`,
    });
  }

  function handleReminder() {
    downloadStreakReminder();
    onToast({ message: "Buka file yang terunduh untuk menambahkannya ke kalender HP." });
  }

  return (
    <section id="rencana" className="scroll-mt-4 bg-biru py-16 text-kertas lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              Minggu ini
            </h2>
            <p className="mt-3 font-mono text-sm">
              {weekLabel}
              {score.planned ? ` · ${score.kept} dari ${score.planned} rencana terpenuhi` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCard}
              className="h-14 bg-kertas px-6 font-display text-2xl font-extrabold uppercase text-biru transition-colors hover:bg-marka hover:text-aspal"
            >
              Bagikan kartu
            </button>
            <button
              type="button"
              onClick={handleReminder}
              className="h-14 border-3 border-kertas px-6 font-display text-2xl font-extrabold uppercase transition-colors hover:bg-kertas hover:text-biru"
            >
              Pengingat Sabtu
            </button>
          </div>
        </div>

        <p className="mt-6 max-w-xl leading-relaxed">
          Ketuk hari untuk mengganti rencana: bebas, lari, atau rest. Rencana ini berulang setiap minggu.
        </p>

        <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day, index) => (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => cycle(index)}
                aria-label={`${day.name}, rencana ${PLAN_LABEL[day.planned]}, ${RESULT_LABEL[day.result]}`}
                className={`flex h-36 w-full flex-col justify-between p-3 text-left transition-colors ${ticketStyle(day.planned)} ${
                  day.isToday ? "outline-3 outline-offset-2 outline-marka" : ""
                }`}
              >
                <span className="flex justify-between font-mono text-xs uppercase">
                  <span>{day.name}</span>
                  <span>{Number(day.date.slice(8))}</span>
                </span>
                <span className="font-display text-4xl font-black uppercase leading-none">
                  {PLAN_LABEL[day.planned]}
                </span>
                <span className="font-mono text-xs">{RESULT_LABEL[day.result]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
