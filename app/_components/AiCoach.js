"use client";

import { useState } from "react";
import { analysisPayload } from "./insights";
import { requestAnalysis } from "./friends";
import { runTypeLabel } from "./runTypes";
import { DAY_NAMES } from "./stats";
import { setPrefs } from "./store";
import { syncConfigured, useSyncStatus } from "./sync";

const STORAGE_KEY = "pelari-kalcer:analisis:v1";
const ERRORS = {
  not_configured: "Analisis AI belum diaktifkan di server.",
  quota: "Jatah analisis hari ini sudah habis. Coba lagi besok.",
  unauthorized: "Masuk dulu untuk memakai analisis AI.",
  no_data: "Catat beberapa lari dulu supaya ada yang bisa dianalisis.",
  rate_limited: "Kuota AI gratis sedang habis. Coba lagi nanti atau besok.",
};

function savedResult() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function Group({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-display text-3xl font-black uppercase leading-none">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="border-l-4 border-oranye pl-3 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AiCoach({ today, entries, plan, race, onToast }) {
  const { user } = useSyncStatus();
  const [result, setResult] = useState(savedResult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!syncConfigured) return null;

  async function analyze() {
    setBusy(true);
    setError("");
    try {
      const next = await requestAnalysis(analysisPayload(entries, plan, race, today));
      setResult(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* the result still shows for this visit */
      }
    } catch (failure) {
      setError(ERRORS[failure.message] ?? "Analisis gagal. Coba lagi nanti.");
    }
    setBusy(false);
  }

  function applyPlan() {
    setPrefs({
      plan: result.week.map((day) => (day.type === "rest" ? "rest" : "run")),
    });
    onToast({ message: "Rencana minggu ini diperbarui." });
  }

  return (
    <section id="ai" className="scroll-mt-4 bg-kertas py-16 text-aspal lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              Analisis <span className="text-biru">AI</span>
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed">
              AI membaca 8 minggu terakhir, rencana, dan race kamu, lalu menyusun saran latihan
              minggu depan. Catatan, rute, dan gear tidak dikirim.
            </p>
          </div>
          {user && (
            <button
              type="button"
              disabled={busy}
              onClick={analyze}
              className="h-14 bg-biru px-7 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal disabled:opacity-50"
            >
              {busy ? "Menganalisis" : "Analisis latihan"}
            </button>
          )}
        </div>

        {!user && (
          <p className="mt-5 text-lg">Masuk lewat tombol di bagian atas untuk memakai analisis AI.</p>
        )}
        {error && (
          <p role="alert" className="mt-5 font-medium text-biru">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8">
            <p className="max-w-3xl text-xl leading-relaxed">{result.summary}</p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <Group title="Yang sudah bagus" items={result.strengths} />
              <Group title="Perlu diperhatikan" items={result.risks} />
            </div>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
              <h3 className="font-display text-4xl font-black uppercase leading-none">Minggu depan</h3>
              <button
                type="button"
                onClick={applyPlan}
                className="h-12 bg-aspal px-5 font-display text-xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru"
              >
                Terapkan ke rencana
              </button>
            </div>
            <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
              {result.week.map((day, index) => (
                <li key={DAY_NAMES[index]} className={`p-3 ${day.type === "rest" ? "bg-aspal text-kertas" : "bg-white"}`}>
                  <p className="font-mono text-xs uppercase">{DAY_NAMES[index]}</p>
                  <p className="mt-1 font-display text-2xl font-black uppercase leading-none">
                    {day.type === "rest" ? "Rest" : runTypeLabel(day.type)}
                  </p>
                  <p className="mt-2 text-sm leading-snug">{day.detail}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm">
              Saran umum dari AI, bukan nasihat medis atau pelatih. Hentikan latihan kalau terasa nyeri.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
