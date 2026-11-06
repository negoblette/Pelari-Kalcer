"use client";

import { useSyncExternalStore } from "react";

const WIB_OFFSET = 7 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;
const START_HOUR = 6;
const END_HOUR = 11;

function subscribe(onTick) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

function currentSecond() {
  return Math.floor(Date.now() / 1000);
}

function serverSecond() {
  return null;
}

function label(second) {
  const now = second * 1000 + WIB_OFFSET;
  const wib = new Date(now);
  const midnight = Date.UTC(
    wib.getUTCFullYear(),
    wib.getUTCMonth(),
    wib.getUTCDate(),
  );
  const daysLeft = (7 - wib.getUTCDay()) % 7;
  let target = midnight + daysLeft * DAY + START_HOUR * 3600 * 1000;

  if (daysLeft === 0 && now >= target) {
    if (now < midnight + END_HOUR * 3600 * 1000) return "Minggu pagi lagi jalan";
    target += 7 * DAY;
  }

  const left = Math.floor((target - now) / 1000);
  const days = Math.floor(left / 86400);
  const hours = Math.floor((left % 86400) / 3600);
  const minutes = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");
  return `Minggu pagi: ${days}h ${hours}j ${minutes}m ${seconds}d`;
}

export default function Countdown() {
  const second = useSyncExternalStore(subscribe, currentSecond, serverSecond);

  return (
    <p className="font-mono text-sm tabular-nums">
      {second === null ? "Minggu pagi: menghitung" : label(second)}
    </p>
  );
}
