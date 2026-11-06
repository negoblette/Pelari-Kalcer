"use client";

import { useEffect, useRef } from "react";
import Avatar from "./Avatar";
import { BADGE_TITLES } from "./insights";
import { formatClock, formatDistance } from "./stats";

function Fact({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-xs opacity-70">{label}</dt>
      <dd className="m-0 font-display text-3xl font-black uppercase leading-none tabular-nums">{value}</dd>
    </div>
  );
}

export default function FriendProfile({ name, area, avatar, view, lifetime, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.scrollTop = 0;
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="friend-name"
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto bg-kertas p-0 text-aspal backdrop:bg-biru/80"
    >
      <div className="flex items-baseline justify-between gap-4 bg-oranye px-5 py-2.5 font-mono text-sm font-medium uppercase">
        <span>Pelari Kalcer</span>
        <span>Profil teman</span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar seed={avatar} size={72} />
          <div className="min-w-0">
            <h2
              id="friend-name"
              className="font-display text-5xl font-black uppercase leading-none text-biru [overflow-wrap:anywhere]"
            >
              {name}
            </h2>
            {area && <p className="mt-2 font-mono text-sm">{area}</p>}
          </div>
        </div>

        {lifetime ? (
          <>
            <p className="mt-5 font-display text-7xl font-black leading-none tabular-nums">
              {formatDistance(lifetime.km)}
              <span className="ml-2 font-mono text-sm font-normal">km total</span>
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t-2 border-aspal pt-4">
              <Fact label="Total lari" value={lifetime.runs} />
              <Fact label="Streak sekarang" value={`${view.streak} mgg`} />
              <Fact label="Streak terbaik" value={`${lifetime.bestStreak} mgg`} />
              <Fact label="Minggu ini" value={`${formatDistance(view.weekKm)} km`} />
            </dl>

            <h3 className="mt-6 font-display text-3xl font-black uppercase leading-none">Rekor</h3>
            <ul className="mt-2">
              {lifetime.records.map((record) => (
                <li
                  key={record.label}
                  className="flex items-baseline justify-between gap-3 border-b border-aspal/20 py-2"
                >
                  <span className="font-display text-2xl font-black">{record.label}</span>
                  <span className="font-mono text-sm tabular-nums">
                    {record.time ? formatClock(record.time) : "Belum tercatat"}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-display text-3xl font-black uppercase leading-none">
              Lencana {lifetime.badges.length}
            </h3>
            {lifetime.badges.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {lifetime.badges.map((id) => (
                  <li key={id} className="bg-marka px-2.5 py-1.5 text-sm font-medium">
                    {BADGE_TITLES[id] ?? id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm">Belum ada lencana.</p>
            )}
          </>
        ) : (
          <p className="mt-5 leading-relaxed">
            Profil lengkap muncul setelah temanmu membuka aplikasi versi terbaru dan datanya
            tersinkron.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full bg-aspal font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru"
        >
          Tutup
        </button>
      </div>
    </dialog>
  );
}
