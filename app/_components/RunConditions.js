"use client";

import { useEffect, useState } from "react";
import { bestRunHour, runVerdict } from "./insights";

const JAKARTA = { latitude: -6.2, longitude: 106.82, label: "Jakarta" };

async function loadHours({ latitude, longitude }) {
  const place = `latitude=${latitude}&longitude=${longitude}&forecast_days=2&timezone=auto`;
  const [weather, air] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?${place}&hourly=temperature_2m,apparent_temperature,precipitation_probability`,
    ).then((response) => response.json()),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${place}&hourly=us_aqi`,
    ).then((response) => response.json()),
  ]);
  return weather.hourly.time.map((time, index) => ({
    time,
    temperature: weather.hourly.temperature_2m[index],
    feels: weather.hourly.apparent_temperature[index],
    rain: weather.hourly.precipitation_probability[index] ?? 0,
    aqi: air.hourly.us_aqi[air.hourly.time.indexOf(time)] ?? 0,
  }));
}

function placeTimeKey(hours) {
  const browser = new Date();
  const hour = String(browser.getHours()).padStart(2, "0");
  const month = String(browser.getMonth() + 1).padStart(2, "0");
  const day = String(browser.getDate()).padStart(2, "0");
  const key = `${browser.getFullYear()}-${month}-${day}T${hour}:00`;
  return hours.some((item) => item.time === key) ? key : hours[0].time;
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs">{label}</p>
      <p className="font-display text-4xl font-black leading-none tabular-nums sm:text-5xl">{value}</p>
    </div>
  );
}

export default function RunConditions() {
  const [place, setPlace] = useState(JAKARTA);
  const [hours, setHours] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadHours(place)
      .then((next) => {
        if (!active) return;
        setHours(next);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [place]);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) =>
        setPlace({
          latitude: Math.round(coords.latitude * 100) / 100,
          longitude: Math.round(coords.longitude * 100) / 100,
          label: "Lokasi kamu",
        }),
      () => setFailed(true),
    );
  }

  const nowKey = hours ? placeTimeKey(hours) : null;
  const now = hours?.find((hour) => hour.time === nowKey);
  const best = hours ? bestRunHour(hours, nowKey) : null;

  return (
    <section aria-labelledby="kondisi-h" className="bg-oranye text-aspal">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="kondisi-h" className="font-display text-3xl font-black uppercase">
            Kondisi lari · {place.label}
          </h2>
          <button type="button" onClick={useMyLocation} className="font-mono text-sm underline underline-offset-4">
            Pakai lokasi saya
          </button>
        </div>

        {failed && <p className="mt-3">Kondisi belum bisa dimuat. Coba lagi nanti.</p>}
        {!failed && !now && <p className="mt-3 font-mono text-sm">Memuat kondisi</p>}
        {!failed && now && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
              <Stat label="Suhu" value={`${Math.round(now.temperature)}°`} />
              <Stat label="Terasa" value={`${Math.round(now.feels)}°`} />
              <Stat label="Peluang hujan" value={`${now.rain}%`} />
              <Stat label="Kualitas udara (AQI)" value={now.aqi} />
              <Stat label="Jam terbaik" value={best ? `${best.time.slice(11, 13)}.00` : "–"} />
            </div>
            <p className="mt-4 font-medium">{runVerdict(now)}</p>
          </>
        )}
      </div>
    </section>
  );
}
