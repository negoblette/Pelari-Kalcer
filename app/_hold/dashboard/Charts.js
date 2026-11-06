"use client";

import { useState } from "react";
import {
  addDays,
  formatClock,
  formatDistance,
  fullDate,
  heatLevel,
  MONTHS,
  paceOf,
  shortDate,
} from "@/app/_components/stats";

function tipPosition(index, total) {
  if (index < total * 0.2) return "left-0";
  if (index > total * 0.8) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function niceMax(value) {
  const step = value <= 20 ? 5 : value <= 50 ? 10 : 20;
  return Math.max(Math.ceil(value / step) * step, step);
}

export function WeeklyBars({ weeks, selected, onSelect }) {
  const max = niceMax(Math.max(...weeks.map((week) => week.km)));
  const ticks = [max, max / 2, 0];

  return (
    <div className="relative mt-5 h-64 pl-9">
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute inset-x-0 border-t border-white/10"
          style={{ bottom: `${24 + (tick / max) * 216}px` }}
        >
          <span className="absolute -top-2.5 left-0 bg-panel pr-1 font-mono text-xs text-white/70">
            {tick}
          </span>
        </div>
      ))}
      <div className="absolute inset-y-0 left-9 right-0 flex gap-0.5 sm:gap-1">
        {weeks.map((week, index) => {
          const active = selected === week.start;
          const dimmed = selected && !active;
          return (
            <button
              key={week.start}
              type="button"
              aria-pressed={active}
              aria-label={`Minggu ${shortDate(week.start)}: ${formatDistance(week.km)} km, ${week.count} lari`}
              onClick={() => onSelect(week)}
              className="group relative flex min-w-0 flex-1 flex-col justify-end pb-6"
            >
              <span
                className={`bar block w-full rounded-t transition-colors ${
                  active
                    ? "bg-marka"
                    : dimmed
                      ? "bg-terang/40 group-hover:bg-terang"
                      : "bg-terang group-hover:bg-marka"
                }`}
                style={{ height: `${(week.km / max) * 216}px`, minHeight: week.km ? 3 : 0 }}
              />
              <span className="absolute inset-x-[-1rem] bottom-0 text-center font-mono text-xs whitespace-nowrap text-white/70">
                {index % 3 === 2 ? shortDate(week.start) : ""}
              </span>
              <span
                className={`pointer-events-none absolute bottom-full z-10 mb-[-3rem] hidden whitespace-nowrap rounded-md bg-kertas px-3 py-2 text-left text-aspal shadow-lg group-hover:block group-focus-visible:block ${tipPosition(index, weeks.length)}`}
              >
                <span className="block font-mono text-xs">
                  {shortDate(week.start)} – {shortDate(week.end)}
                </span>
                <span className="block font-display text-2xl font-black leading-tight">
                  {formatDistance(week.km)} km
                </span>
                <span className="block text-xs">{week.count} lari</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const HEAT = [
  "bg-white/[.06]",
  "bg-oranye/30",
  "bg-oranye/55",
  "bg-oranye/80",
  "bg-oranye",
];

export function Heatmap({ days, selected, onSelect }) {
  const [hover, setHover] = useState(null);
  const weeks = days.length / 7;

  const monthLabels = [];
  for (let week = 0; week < weeks; week += 1) {
    const first = days[week * 7].date;
    const month = Number(first.slice(5, 7));
    const previous = week ? Number(days[(week - 1) * 7].date.slice(5, 7)) : null;
    if (month !== previous) monthLabels.push({ week, label: MONTHS[month - 1] });
  }

  return (
    <div className="mt-5">
      <div
        className="heat-grid relative mb-1 h-4 font-mono text-xs text-white/70"
        style={{ "--weeks": weeks }}
      >
        {monthLabels.map(({ week, label }) => (
          <span
            key={week}
            className={`absolute heat-col ${week < 10 ? "heat-old" : ""}`}
            style={{ "--week": week }}
          >
            {label}
          </span>
        ))}
      </div>
      <div
        className="heat-grid grid grid-flow-col grid-rows-7 gap-[3px]"
        style={{ "--weeks": weeks }}
        onPointerLeave={() => setHover(null)}
      >
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            disabled={day.future}
            aria-pressed={selected === day.date}
            aria-label={`${fullDate(day.date)}: ${day.km ? `${formatDistance(day.km)} km` : "tidak lari"}`}
            onPointerEnter={() => setHover(day)}
            onFocus={() => setHover(day)}
            onClick={() => onSelect(day)}
            className={`aspect-square rounded-[3px] ${day.week < 10 ? "heat-old" : ""} ${
              day.future ? "opacity-0" : HEAT[heatLevel(day.km)]
            } ${selected === day.date ? "outline-2 outline-marka" : "hover:outline-2 hover:outline-kertas"}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-white/70">
        <p aria-live="polite">
          {hover
            ? `${fullDate(hover.date)} · ${hover.km ? `${formatDistance(hover.km)} km` : "tidak lari"}`
            : "Klik tanggal untuk melihat larinya"}
        </p>
        <div className="flex items-center gap-1">
          <span className="mr-1">0 km</span>
          {HEAT.map((color) => (
            <span key={color} className={`size-3 rounded-[3px] ${color}`} />
          ))}
          <span className="ml-1">16+ km</span>
        </div>
      </div>
    </div>
  );
}

const WIDTH = 1000;
const HEIGHT = 240;

export function PaceTrend({ runs }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) {
    return (
      <p className="mt-6 text-white/70">Catat minimal dua lari untuk melihat tren pace.</p>
    );
  }

  const paces = sorted.map(paceOf);
  const low = Math.floor(Math.min(...paces) / 30) * 30;
  const high = Math.ceil(Math.max(...paces) / 30) * 30 || low + 30;
  const span = high - low || 30;
  const pointX = (index) => (index / (sorted.length - 1)) * WIDTH;
  // A lower pace is faster, so the fastest runs sit at the top of the chart.
  const pointY = (pace) => ((pace - low) / span) * HEIGHT;
  const path = paces
    .map((pace, index) => `${index ? "L" : "M"}${pointX(index)} ${pointY(pace)}`)
    .join(" ");

  const active = hoverIndex ?? sorted.length - 1;
  const left = (active / (sorted.length - 1)) * 100;
  const top = (pointY(paces[active]) / HEIGHT) * 100;

  function handleMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    setHoverIndex(Math.round(ratio * (sorted.length - 1)));
  }

  function handleKey(event) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    setHoverIndex(Math.min(Math.max(active + step, 0), sorted.length - 1));
  }

  return (
    <div className="mt-5 pl-12">
      <div
        tabIndex={0}
        role="slider"
        aria-label="Tren pace per lari"
        aria-valuemin={0}
        aria-valuemax={sorted.length - 1}
        aria-valuenow={active}
        aria-valuetext={`${shortDate(sorted[active].date)}, pace ${formatClock(paces[active])} per kilometer`}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        onKeyDown={handleKey}
        className="relative h-56 cursor-crosshair touch-none"
      >
        {[0, 0.5, 1].map((tick) => (
          <div
            key={tick}
            className="absolute inset-x-0 border-t border-white/10"
            style={{ top: `${tick * 100}%` }}
          >
            <span className="absolute -left-12 -top-2.5 font-mono text-xs text-white/70">
              {formatClock(low + tick * span)}
            </span>
          </div>
        ))}
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
        >
          <path
            d={path}
            fill="none"
            stroke="var(--marka)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className="absolute inset-y-0 w-px bg-white/30"
          style={{ left: `${left}%` }}
        />
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-marka"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
        {hoverIndex !== null && (
<div
          className={`pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-kertas px-3 py-2 text-aspal shadow-lg ${
            left > 70 ? "-translate-x-full -ml-3" : "ml-3"
          }`}
          style={{ left: `${left}%` }}
        >
          <span className="block font-mono text-xs">{shortDate(sorted[active].date)}</span>
          <span className="block font-display text-2xl font-black leading-tight tabular-nums">
            {formatClock(paces[active])}/km
          </span>
          <span className="block text-xs">{formatDistance(sorted[active].km)} km</span>
        </div>
        )}
</div>
      <div className="mt-2 flex justify-between font-mono text-xs text-white/70">
        <span>{shortDate(sorted[0].date)}</span>
        <span>Makin atas, makin cepat</span>
        <span>{shortDate(sorted.at(-1).date)}</span>
      </div>
    </div>
  );
}

export function weekLabel(week) {
  return `${shortDate(week.start)} – ${shortDate(addDays(week.start, 6))}`;
}
