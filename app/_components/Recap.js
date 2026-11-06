"use client";

import { useState } from "react";
import { periodLabel, recapFor } from "./insights";
import { shareCard } from "./share";
import { formatClock, formatDistance, formatHours } from "./stats";

function movePeriod(prefix, step) {
  if (prefix.length === 4) return String(Number(prefix) + step);
  const year = Number(prefix.slice(0, 4));
  const month = Number(prefix.slice(5, 7)) - 1;
  const next = new Date(Date.UTC(year, month + step, 1));
  return next.toISOString().slice(0, 7);
}

function Item({ label, value, detail }) {
  return (
    <div className="border-t-2 border-aspal pt-3">
      <p className="font-mono text-xs">{label}</p>
      <p className="mt-1 truncate font-display text-4xl font-black uppercase leading-none tabular-nums">
        {value}
      </p>
      {detail && <p className="mt-1 font-mono text-xs">{detail}</p>}
    </div>
  );
}

export default function Recap({ today, entries, gear, onToast }) {
  const [prefix, setPrefix] = useState(() => today.slice(0, 7));
  const recap = recapFor(entries, gear, prefix);
  const label = periodLabel(prefix);
  const isYear = prefix.length === 4;
  const atLatest = prefix >= today.slice(0, prefix.length);

  function handleCard() {
    if (!recap.runs) {
      onToast({ message: "Belum ada lari di periode ini." });
      return;
    }
    shareCard({
      band: "Recap",
      big: formatDistance(recap.km),
      label: `Km ${label}`,
      fields: [
        ["Lari", `${recap.runs} kali`],
        ["Pace", recap.pace ? formatClock(recap.pace) : "–"],
        ["Terjauh", recap.longest ? `${formatDistance(recap.longest.km)} km` : "–"],
      ],
      footer: `Recap ${label}`,
      fileName: `recap-${prefix}.png`,
    });
  }

  return (
    <section id="recap" className="scroll-mt-4 bg-kertas py-16 text-aspal lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              Recap
              <span className="block text-biru">{label}</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-label="Periode sebelumnya"
              onClick={() => setPrefix(movePeriod(prefix, -1))}
              className="size-14 border-2 border-aspal font-display text-3xl font-extrabold hover:bg-aspal hover:text-kertas"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Periode berikutnya"
              disabled={atLatest}
              onClick={() => setPrefix(movePeriod(prefix, 1))}
              className="size-14 border-2 border-aspal font-display text-3xl font-extrabold enabled:hover:bg-aspal enabled:hover:text-kertas disabled:opacity-30"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPrefix(isYear ? today.slice(0, 7) : prefix.slice(0, 4))}
              className="h-14 border-2 border-aspal px-5 font-medium hover:bg-aspal hover:text-kertas"
            >
              {isYear ? "Lihat bulanan" : "Lihat tahunan"}
            </button>
            <button
              type="button"
              onClick={handleCard}
              className="h-14 bg-biru px-6 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
            >
              Bagikan recap
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Total jarak" value={`${formatDistance(recap.km)} km`} />
          <Item label="Lari dan rest" value={`${recap.runs} / ${recap.rests}`} detail="Lari / rest" />
          <Item label="Pace rata-rata" value={recap.pace ? formatClock(recap.pace) : "–"} />
          <Item label="Waktu lari" value={recap.seconds ? formatHours(recap.seconds) : "–"} />
          <Item
            label="Lari terjauh"
            value={recap.longest ? `${formatDistance(recap.longest.km)} km` : "–"}
          />
          <Item
            label="Minggu terbaik"
            value={recap.bestWeek ? `${formatDistance(recap.bestWeek.km)} km` : "–"}
            detail={recap.bestWeek ? `Mulai ${recap.bestWeek.label}` : undefined}
          />
          <Item
            label="Gear favorit"
            value={recap.topGear?.name ?? "–"}
            detail={recap.topGear ? `${formatDistance(recap.topGear.km)} km` : undefined}
          />
        </div>
      </div>
    </section>
  );
}
