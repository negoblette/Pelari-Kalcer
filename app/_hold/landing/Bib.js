"use client";

import { useRef } from "react";
import { formatPace } from "./data";
import { useRunner } from "./RunnerContext";

const HOLES = ["left-[4%] top-[12%]", "right-[4%] top-[12%]", "left-[4%] bottom-[20%]", "right-[4%] bottom-[20%]"];

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[2.7cqw] uppercase opacity-60">{label}</p>
      <p className="whitespace-nowrap font-display text-[6cqw] font-extrabold uppercase leading-none">
        {value}
      </p>
    </div>
  );
}

export default function Bib({ holeClass = "bg-biru", rest = "-3deg", className = "" }) {
  const { name, number, tier, distance, pace } = useRunner();
  const tiltRef = useRef(null);
  const displayName = name.trim() || "Nama kamu";

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
      aria-label={`Bib nomor ${number} atas nama ${displayName}, kategori ${tier.label}, jarak ${distance.label}, pace ${formatPace(pace)} per kilometer`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ "--rest": rest }}
      className={`bib-tilt ${className}`}
    >
      <div className="@container relative overflow-hidden rounded-[1.2cqw] bg-kertas text-aspal shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)]">
        {HOLES.map((position) => (
          <span
            key={position}
            className={`absolute size-[3cqw] rounded-full ${holeClass} ${position}`}
          />
        ))}

        <div className="flex items-baseline justify-between bg-oranye px-[6cqw] py-[2.6cqw] font-mono text-[3cqw] font-medium uppercase">
          <span>Pelari Kalcer</span>
          <span>Minggu Pagi Ed.</span>
        </div>

        <div className="px-[10cqw] pt-[4cqw] text-center">
          <p className="font-display text-[40cqw] font-black leading-[0.9] tabular-nums">
            {number}
          </p>
          <p className="mt-[2cqw] truncate font-display text-[11cqw] font-extrabold uppercase leading-none text-biru">
            {displayName}
          </p>
        </div>

        <div className="mx-[10cqw] mt-[5cqw] grid grid-cols-[1.9fr_0.6fr_0.8fr] gap-[3cqw] border-t-[0.5cqw] border-aspal pt-[2.5cqw] pb-[5cqw]">
          <Field label="Kategori" value={tier.label} />
          <Field label="Jarak" value={distance.label} />
          <Field label="Pace" value={formatPace(pace)} />
        </div>

        <div className="flex items-center justify-between border-t-[0.5cqw] border-dashed border-aspal/50 px-[6cqw] py-[3cqw] font-mono text-[2.8cqw] uppercase">
          <span>Kupon sobek</span>
          <span>1 es kopi setelah 2K</span>
        </div>
      </div>
    </div>
  );
}
