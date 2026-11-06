"use client";

import { useEffect, useId, useRef } from "react";
import {
  DISTANCES,
  PACE_MAX,
  PACE_MIN,
  formatDuration,
  formatKm,
  formatPace,
  paceNote,
} from "./data";
import { useRunner } from "./RunnerContext";

const BASE_RATE = 360 * 1.6;

function Road({ pace }) {
  const stripRef = useRef(null);
  const motionRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const motion = stripRef.current.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-120px)" }],
      { duration: 1000, iterations: Infinity },
    );
    motionRef.current = motion;
    return () => motion.cancel();
  }, []);

  useEffect(() => {
    motionRef.current?.updatePlaybackRate(BASE_RATE / pace);
  }, [pace]);

  return (
    <div aria-hidden className="overflow-hidden border-b border-kertas/15 py-5">
      <div ref={stripRef} className="road-strip h-2" />
    </div>
  );
}

export default function PaceLab() {
  const { pace, setPace, distance, setDistanceId } = useRunner();
  const sliderId = useId();
  const finish = pace * distance.km;
  const splits = [0.25, 0.5, 0.75, 1];

  return (
    <section id="pace" className="scroll-mt-4 bg-aspal text-kertas">
      <Road pace={pace} />

      <div className="mx-auto grid max-w-[1400px] gap-x-16 gap-y-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div>
          <h2 className="font-display text-4xl font-black uppercase">
            Estimasi finish {distance.label}
          </h2>
          <p className="mt-2 font-display text-[clamp(5.5rem,17vw,13rem)] font-black leading-[0.9] tabular-nums text-marka">
            {formatDuration(finish)}
          </p>
          <p aria-live="polite" className="mt-4 max-w-md text-lg leading-relaxed">
            {paceNote(pace)}
          </p>
        </div>

        <div className="lg:pt-3">
          <p className="font-mono text-sm">Jarak</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DISTANCES.map((item) => {
              const active = item.id === distance.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDistanceId(item.id)}
                  className={`border-2 py-2 font-display text-2xl font-extrabold transition-colors ${
                    active
                      ? "border-oranye bg-oranye text-aspal"
                      : "border-kertas/40 hover:border-kertas"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-9 flex items-baseline justify-between">
            <label htmlFor={sliderId} className="font-mono text-sm">
              Pace
            </label>
            <p className="font-display text-5xl font-black tabular-nums">
              {formatPace(pace)}
              <span className="ml-1 font-mono text-sm font-normal">/km</span>
            </p>
          </div>
          <input
            id={sliderId}
            type="range"
            min={PACE_MIN}
            max={PACE_MAX}
            step={5}
            value={pace}
            aria-valuetext={`${Math.floor(pace / 60)} menit ${pace % 60} detik per kilometer`}
            onChange={(event) => setPace(Number(event.target.value))}
            className="pace-range mt-2"
          />
          <div className="mt-1 flex justify-between font-mono text-xs">
            <span>Ngebut</span>
            <span>{(3600 / pace).toFixed(1).replace(".", ",")} km/jam</span>
            <span>Santai</span>
          </div>

          <dl className="mt-9 grid grid-cols-2 border-t border-kertas/30 sm:grid-cols-4">
            {splits.map((part) => (
              <div key={part} className="border-b border-kertas/30 py-3 sm:border-b-0">
                <dt className="font-mono text-xs">
                  Km {formatKm(distance.km * part)}
                </dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums">
                  {formatDuration(finish * part)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
