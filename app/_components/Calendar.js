"use client";

import { useState } from "react";
import {
  DAY_NAMES,
  FEELS,
  MONTH_NAMES,
  detailSummary,
  entryForDate,
  formatClock,
  formatDistance,
  fullDate,
  hasDetail,
  isRunEntry,
  monthCells,
} from "./stats";
import { runTypeLabel, runTypeShort, workoutRows } from "./runTypes";

function cellStyle(entry) {
  if (!entry) return "bg-white hover:bg-aspal/10";
  if (!isRunEntry(entry)) return "bg-biru text-kertas";
  return hasDetail(entry)
    ? "bg-oranye"
    : "bg-oranye/30 outline-2 -outline-offset-2 outline-dashed outline-oranye";
}

function cellLabel(entry) {
  if (!entry) return "";
  if (!isRunEntry(entry)) return "Rest";
  return hasDetail(entry) ? formatDistance(entry.km) : "Isi";
}

function ariaLabel(date, entry) {
  if (!entry) return `${fullDate(date)}, belum absen`;
  if (!isRunEntry(entry)) return `${fullDate(date)}, rest`;
  return hasDetail(entry)
    ? `${fullDate(date)}, lari ${formatDistance(entry.km)} kilometer`
    : `${fullDate(date)}, lari, detail belum diisi`;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function DayReceipt({ date, entry, gear, today, onCheckIn, onEdit, onDelete }) {
  const run = entry && isRunEntry(entry);
  const item = gear.find((option) => option.id === entry?.gearId);
  const future = date > today;

  return (
    <div className="drop-shadow-[0_16px_24px_rgb(0_0_0/0.18)]">
      <div className="struk relative bg-white px-6 pb-7 pt-8 font-mono text-sm">
        <p className="text-center font-display text-3xl font-black uppercase">Pelari Kalcer</p>
        <p className="text-center text-xs">Struk {fullDate(date)}</p>

        <dl className="mt-4 space-y-3 border-y border-dashed border-aspal py-4">
          <Row label="Status" value={entry ? (run ? "Lari" : "Rest") : "Belum absen"} />
          {run && (
            <>
              <Row label="Tipe" value={runTypeLabel(entry.runType)} />
              <Row label="Jarak" value={entry.km ? `${formatDistance(entry.km)} km` : "Belum diisi"} />
              <Row label="Waktu" value={entry.seconds ? formatClock(entry.seconds) : "Belum diisi"} />
              <Row
                label="Pace"
                value={entry.km && entry.seconds ? `${formatClock(entry.seconds / entry.km)}/km` : "Belum diisi"}
              />
              {workoutRows(entry, { formatClock, formatDistance }).map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
              <Row label="Gear" value={item?.name ?? "–"} />
              <Row label="Rasanya" value={FEELS[entry.feel] ?? "–"} />
            </>
          )}
          {entry?.note && <Row label="Catatan" value={entry.note} />}
        </dl>

        {future ? (
          <p className="mt-5 font-sans">Tanggal ini belum tiba.</p>
        ) : entry ? (
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2 font-sans">
            <button
              type="button"
              onClick={onEdit}
              className="h-12 bg-biru font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
            >
              {run && !hasDetail(entry) ? "Isi detail" : "Ubah"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="h-12 border-2 border-aspal px-4 font-medium hover:bg-aspal/10"
            >
              Hapus
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onCheckIn("run")}
              className="h-12 bg-oranye font-display text-2xl font-extrabold uppercase text-aspal transition-colors hover:bg-marka"
            >
              Lari
            </button>
            <button
              type="button"
              onClick={() => onCheckIn("rest")}
              className="h-12 bg-biru font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
            >
              Rest
            </button>
          </div>
        )}

        <div className="barcode mt-5 h-10" aria-hidden />
      </div>
    </div>
  );
}

export default function Calendar({ entries, gear, today, selected, onSelect, onCheckIn, onEdit, onDelete }) {
  const [view, setView] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  }));

  function move(step) {
    setView(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + step, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const { leading, days } = monthCells(view.year, view.month);
  const monthEntries = days.map((date) => entryForDate(entries, date)).filter(Boolean);
  const runCount = monthEntries.filter(isRunEntry).length;
  const restCount = monthEntries.length - runCount;
  const monthKm = detailSummary(monthEntries).km;

  return (
    <section id="kalender" className="scroll-mt-4 bg-kertas py-20 text-aspal lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(3.25rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              {MONTH_NAMES[view.month]}
              <span className="block text-biru">{view.year}</span>
            </h2>
            <div className="flex gap-2">
              {[
                [-1, "Bulan sebelumnya", "‹"],
                [1, "Bulan berikutnya", "›"],
              ].map(([step, label, glyph]) => (
                <button
                  key={step}
                  type="button"
                  aria-label={label}
                  onClick={() => move(step)}
                  className="size-12 border-2 border-aspal font-display text-3xl font-extrabold transition-colors hover:bg-aspal hover:text-kertas"
                >
                  {glyph}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 font-mono text-sm">
            {runCount} lari · {restCount} rest · {formatDistance(monthKm)} km
          </p>

          <div className="mt-6 grid grid-cols-7 gap-1 sm:gap-1.5">
            {DAY_NAMES.map((name) => (
              <p key={name} className="pb-1 text-center font-mono text-xs uppercase">
                {name}
              </p>
            ))}
            {Array.from({ length: leading }, (_, index) => (
              <span key={index} aria-hidden="true" />
            ))}
            {days.map((date) => {
              const entry = entryForDate(entries, date);
              const future = date > today;
              const isSelected = selected === date;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={future}
                  aria-pressed={isSelected}
                  aria-label={ariaLabel(date, entry)}
                  onClick={() => onSelect(date)}
                  className={`relative flex aspect-square flex-col items-start justify-between p-1.5 text-left transition-colors sm:p-2.5 ${
                    future ? "bg-aspal/5 text-aspal/40" : cellStyle(entry)
                  } ${isSelected ? "ring-3 ring-aspal ring-offset-2 ring-offset-kertas" : ""}`}
                >
                  <span className="flex w-full justify-between gap-1 font-mono text-xs sm:text-sm">
                    <span className={date === today ? "font-medium underline underline-offset-4" : ""}>
                      {Number(date.slice(8))}
                    </span>
                    {entry?.runType && isRunEntry(entry) && (
                      <span className="hidden text-xs lg:block">{runTypeShort(entry.runType)}</span>
                    )}
                  </span>
                  <span className="font-display text-base font-black uppercase leading-none sm:text-3xl">
                    {cellLabel(entry)}
                  </span>
                </button>
              );
            })}
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
            <li className="flex items-center gap-2">
              <span className="size-3 bg-oranye" /> Lari, angka dalam km
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 bg-oranye/30 outline-1 outline-dashed outline-oranye" /> Detail belum diisi
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 bg-biru" /> Rest
            </li>
          </ul>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <DayReceipt
            date={selected}
            entry={entryForDate(entries, selected)}
            gear={gear}
            today={today}
            onCheckIn={(type) => onCheckIn(selected, type)}
            onEdit={() => onEdit(selected)}
            onDelete={() => onDelete(entryForDate(entries, selected))}
          />
        </div>
      </div>
    </section>
  );
}
