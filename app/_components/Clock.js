"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

function currentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}.${minutes}`;
}

export default function Clock() {
  const time = useSyncExternalStore(subscribe, currentTime, () => null);

  return <p className="font-mono text-sm tabular-nums">{time ?? "--.--"}</p>;
}
