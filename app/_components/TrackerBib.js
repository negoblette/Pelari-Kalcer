"use client";

import { useRef } from "react";
import { detailSummary, formatClock, formatDistance, isRunEntry } from "./stats";

const HOLES = ["left-[4%] top-[12%]", "right-[4%] top-[12%]", "left-[4%] bottom-[24%]", "right-[4%] bottom-[24%]"];

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[2.7cqw] uppercase opacity-60">{label}</p>
      <p className="whitespace-nowrap font-display text-[6cqw] font-extrabold uppercase leading-none tabular-nums">
        {value}
      </p>
    </div>
  );
}

function dayStyle(entry) {
  if (!entry) return "border-aspal/40";
  return isRunEntry(entry) ? "border-oranye bg-oranye" : "border-biru bg-biru text-kertas";
}

export default function TrackerBib({ streak, week }) {
  const tiltRef = useRef(null);
  const entries = week.map((day) => day.entry).filter(Boolean);
  const runCount = entries.filter(isRunEntry).length;
  const summary = detailSummary(entries);

  function handleMove(event) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = tiltRef.current.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    tiltRef.current.style.setProperty("--tilt-x", `${-y * 12}deg`);
    tiltRef.current.style.setProperty("--tilt-y", `${x * 14}deg`);
  }

  function handleLeave() {
    tiltRef.current.style.setProperty("--tilt-x", "0deg");
    tiltRef.current.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={tiltRef}
      role="img"
      aria-label={`Streak ${streak} minggu. Minggu ini ${runCount} lari, ${formatDistance(summary.km)} kilometer.`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="bib-tilt"
    >
      <div className="@container relative overflow-hidden rounded-[1.2cqw] bg-kertas text-aspal shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)]">
        {HOLES.map((position) => (
          <span key={position} className={`absolute size-[3cqw] rounded-full bg-biru ${position}`} />
        ))}

        <div className="flex items-baseline justify-between bg-oranye px-[6cqw] py-[2.6cqw] font-mono text-[3cqw] font-medium uppercase">
          <span>Pelari Kalcer</span>
          <span>Streak mingguan</span>
        </div>

        <div className="px-[10cqw] pt-[4cqw] text-center">
          <p className="font-display text-[40cqw] font-black leading-[0.9] tabular-nums">
            {String(streak).padStart(2, "0")}
          </p>
          <p className="mt-[2cqw] whitespace-nowrap font-display text-[10cqw] font-extrabold uppercase leading-none text-biru">
            Minggu beruntun
          </p>
        </div>

        <div className="mx-[10cqw] mt-[5cqw] grid grid-cols-3 gap-[3cqw] border-t-[0.5cqw] border-aspal pt-[2.5cqw] pb-[4cqw]">
          <Field label="Minggu ini" value={`${runCount} lari`} />
          <Field label="Jarak" value={`${formatDistance(summary.km)} km`} />
          <Field label="Pace" value={summary.pace ? formatClock(summary.pace) : "–"} />
        </div>

        <ol className="grid grid-cols-7 gap-[1.5cqw] border-t-[0.5cqw] border-dashed border-aspal/50 px-[6cqw] py-[3cqw]">
          {week.map((day) => (
            <li key={day.date} className="text-center">
              <span className="block font-mono text-[2.6cqw] uppercase">{day.name}</span>
              <span
                className={`mt-[1cqw] flex aspect-square items-center justify-center rounded-full border-[0.5cqw] font-mono text-[2.8cqw] font-medium ${dayStyle(day.entry)} ${
                  day.isToday ? "outline-[0.6cqw] outline-offset-[0.5cqw] outline-aspal" : ""
                }`}
              >
                {day.entry ? (isRunEntry(day.entry) ? "L" : "R") : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
