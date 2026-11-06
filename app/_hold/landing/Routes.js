"use client";

import { useState } from "react";
import { ROUTES, formatDuration, formatKm, formatPace } from "./data";
import { useRunner } from "./RunnerContext";

function Marker({ point, fill }) {
  return (
    <g>
      <circle cx={point.x} cy={point.y} r="6" fill={fill} />
      <text
        x={point.x + (point.dx ?? 0)}
        y={point.y + point.dy}
        textAnchor={point.anchor}
        fill="var(--kertas)"
        className="font-mono text-[13px]"
      >
        {point.label}
      </text>
    </g>
  );
}

function RouteCard({ route }) {
  const { pace } = useRunner();

  return (
    <article className="bg-aspal p-5 text-kertas sm:p-7">
      <svg
        key={route.id}
        viewBox="0 0 400 300"
        role="img"
        aria-label={`Skema rute ${route.name}`}
        className="w-full"
      >
        <path
          d={route.path}
          fill="none"
          stroke="var(--kertas)"
          strokeOpacity="0.18"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={route.path}
          pathLength="1"
          fill="none"
          stroke="var(--marka)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="route-line"
        />
        <Marker point={route.start} fill="var(--marka)" />
        {route.end && <Marker point={route.end} fill="var(--oranye)" />}
        <circle r="8" fill="var(--oranye)" className="route-dot">
          <animateMotion dur="9s" repeatCount="indefinite" path={route.path} />
        </circle>
      </svg>

      <p className="mt-4 text-lg leading-relaxed">{route.vibe}</p>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-kertas/30 pt-4">
        <div>
          <dt className="font-mono text-xs">{route.unit}</dt>
          <dd className="whitespace-nowrap font-display text-2xl font-extrabold sm:text-3xl">
            ±{formatKm(route.km)} km
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs">Mulai</dt>
          <dd className="whitespace-nowrap font-display text-2xl font-extrabold sm:text-3xl">{route.time}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs">Pace {formatPace(pace)}</dt>
          <dd className="whitespace-nowrap font-display text-2xl font-extrabold sm:text-3xl tabular-nums">
            {formatDuration(route.km * pace)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function Routes() {
  const [routeId, setRouteId] = useState(ROUTES[0].id);
  const route = ROUTES.find((item) => item.id === routeId);

  return (
    <section id="rute" className="scroll-mt-4 bg-oranye py-20 text-aspal lg:py-28">
      <div className="mx-auto grid max-w-[1400px] items-start gap-12 px-4 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Lari di mana
            <br />
            minggu ini?
          </h2>
          <ul className="mt-10 border-t-2 border-aspal">
            {ROUTES.map((item) => {
              const active = item.id === routeId;
              return (
                <li key={item.id} className="border-b-2 border-aspal">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRouteId(item.id)}
                    className={`block w-full px-3 py-3 text-left transition-colors ${
                      active ? "bg-aspal text-kertas" : "hover:bg-aspal/10"
                    }`}
                  >
                    <span className="block font-display text-4xl font-extrabold uppercase">
                      {item.name}
                    </span>
                    <span className="block font-mono text-sm">{item.area}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <RouteCard route={route} />
      </div>
    </section>
  );
}
