"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heatmap, PaceTrend, WeeklyBars, weekLabel } from "./Charts";
import RunForm from "./RunForm";
import RunLog from "./RunLog";
import SyncControl from "@/app/_components/SyncControl";
import {
  RANGES,
  SHOE_LIMIT_KM,
  SHOE_WARN_KM,
  addDays,
  formatClock,
  formatDistance,
  formatHours,
  fullDate,
  heatmapDays,
  inRange,
  monthProgress,
  personalBests,
  previousRange,
  shoeTotals,
  shortDate,
  summarize,
  weekStreak,
  weeklyTotals,
} from "@/app/_components/stats";
import {
  addSampleRuns,
  clearRuns,
  deleteRun,
  exportData,
  importData,
  removeSampleRuns,
  saveRun,
  setGoal,
  useToday,
  useTracker,
} from "@/app/_components/store";
import { syncConfigured, useSyncStatus } from "@/app/_components/sync";

function Panel({ title, action, className = "", children }) {
  return (
    <section className={`rounded-xl bg-panel p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-3xl font-black uppercase leading-none">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function progressNote(percent) {
  if (percent >= 100) return "Target tembus. Saatnya beli kaus finisher sendiri.";
  if (percent >= 70) return "Tinggal sedikit lagi. Jangan berhenti di kopi.";
  if (percent >= 30) return "Ritme sudah dapat. Sepatu mulai kerja.";
  if (percent > 0) return "Baru pemanasan. Bulan masih panjang.";
  return "Belum ada kilometer bulan ini. Sepatu menunggu.";
}

function GoalPanel({ progress, goalKm }) {
  const percent = Math.round(progress.percent);

  return (
    <section className="flex flex-col justify-between overflow-hidden rounded-xl bg-biru p-5 text-kertas sm:p-7 lg:col-span-5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-mono text-sm">Kilometer {progress.monthLabel}</h2>
          <label className="flex items-center gap-2 font-mono text-sm">
            Target
            <input
              type="number"
              min="1"
              value={goalKm}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value > 0) setGoal(value);
              }}
              className="h-9 w-20 rounded-md border border-white/30 bg-white/10 px-2 text-right text-kertas outline-none focus:border-marka"
            />
            km
          </label>
        </div>
        <p className="mt-3 font-display text-[clamp(5.5rem,11vw,10rem)] font-black leading-[0.85] tabular-nums">
          {formatDistance(progress.km)}
        </p>
        <p className="mt-3 text-lg leading-snug">{progressNote(percent)}</p>
      </div>

      <div className="mt-8">
        <div className="relative h-11 overflow-hidden rounded-md bg-aspal">
          <div
            className="absolute inset-y-0 left-0 bg-oranye transition-[width] duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
          <div className="road-marks absolute inset-x-0 right-20 top-1/2 h-1 -translate-y-1/2" />
          <p className="absolute inset-y-0 right-3 flex items-center font-display text-2xl font-black text-kertas">
            {percent}%
          </p>
        </div>
        <p className="mt-3 font-mono text-sm">
          {progress.remaining > 0
            ? `Sisa ${formatDistance(progress.remaining)} km, ${formatDistance(progress.perDay)} km per hari`
            : "Target bulan ini selesai"}
        </p>
      </div>
    </section>
  );
}

function Delta({ now, before, invert, format }) {
  if (!before) return <span className="text-white/70">Belum ada pembanding</span>;
  const diff = now - before;
  const better = invert ? diff < 0 : diff > 0;
  if (Math.abs(diff) < 0.05) return <span className="text-white/70">Sama seperti sebelumnya</span>;
  return (
    <span className={better ? "text-marka" : "text-white/70"}>
      {better ? "▲" : "▼"} {format(Math.abs(diff))} dari periode lalu
    </span>
  );
}

function Tile({ label, value, foot }) {
  return (
    <div className="rounded-xl bg-panel p-5 transition-colors hover:bg-panel-2">
      <p className="font-mono text-xs text-white/70">{label}</p>
      <p className="mt-2 font-display text-6xl font-black leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-sm">{foot}</p>
    </div>
  );
}

function Records({ records }) {
  return (
    <ul className="mt-4">
      {records.map((record) => (
        <li
          key={record.label}
          className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0"
        >
          <span className="font-display text-3xl font-black">{record.label}</span>
          {record.best ? (
            <span className="text-right">
              <span className="block font-display text-3xl font-black leading-none text-marka tabular-nums">
                {formatClock(record.best.time)}
              </span>
              <span className="font-mono text-xs text-white/70">
                {formatClock(record.best.pace)}/km · {shortDate(record.best.date)}
              </span>
            </span>
          ) : (
            <span className="text-sm text-white/70">Belum tercatat</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Shoes({ shoes, selected, onSelect }) {
  if (!shoes.length) {
    return <p className="mt-5 text-white/70">Isi kolom sepatu saat mencatat lari.</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {shoes.slice(0, 5).map((shoe) => {
        const worn = shoe.km >= SHOE_WARN_KM;
        return (
          <li key={shoe.name}>
            <button
              type="button"
              aria-pressed={selected === shoe.name}
              onClick={() => onSelect(shoe.name)}
              className={`w-full rounded-md p-2.5 text-left transition-colors ${
                selected === shoe.name ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              <span className="flex justify-between gap-3 text-sm font-medium">
                <span className="truncate">{shoe.name}</span>
                <span className="shrink-0 tabular-nums">{formatDistance(shoe.km)} km</span>
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded bg-white/10">
                <span
                  className={`block h-full rounded ${worn ? "bg-oranye" : "bg-terang"}`}
                  style={{ width: `${Math.min((shoe.km / SHOE_LIMIT_KM) * 100, 100)}%` }}
                />
              </span>
              {worn && (
                <span className="mt-1 block text-xs text-marka">
                  Sudah {SHOE_WARN_KM}+ km, cek bantalannya
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState({ today, onAdd }) {
  return (
    <section className="rounded-xl bg-biru p-7 text-kertas sm:p-12">
      <h1 className="font-display text-[clamp(4rem,12vw,10rem)] font-black uppercase leading-[0.86]">
        Belum ada lari.
        <span className="block text-marka">Sepatu masih bersih.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed">
        Catat lari pertama, dan dashboard ini mulai menghitung target, rekor, tren
        pace, dan jarak tempuh sepatu kamu.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="h-14 rounded-md bg-oranye px-8 font-display text-2xl font-extrabold uppercase text-aspal transition-colors hover:bg-marka"
        >
          Catat lari pertama
        </button>
        <button
          type="button"
          onClick={() => addSampleRuns(today)}
          className="h-14 rounded-md border-2 border-kertas px-6 font-medium transition-colors hover:bg-kertas hover:text-biru"
        >
          Coba dengan data contoh
        </button>
      </div>
    </section>
  );
}

function DataMenu({ hasRuns, onToast }) {
  const fileRef = useRef(null);

  async function handleImport(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const count = await importData(file);
      onToast({ message: `${count} lari berhasil diimpor.` });
    } catch {
      onToast({ message: "File tidak bisa dibaca. Gunakan hasil ekspor tracker ini." });
    }
  }

  return (
    <details className="relative">
      <summary className="flex h-11 cursor-pointer list-none items-center rounded-md border border-white/20 px-4 text-sm font-medium hover:border-white/50">
        Data
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-white/15 bg-panel-2 p-1.5 shadow-xl">
        <button
          type="button"
          onClick={exportData}
          className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
        >
          Ekspor cadangan JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
        >
          Impor dari JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleImport}
        />
        {hasRuns && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Hapus semua catatan lari? Ini tidak bisa dibatalkan.")) clearRuns();
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-marka hover:bg-white/10"
          >
            Hapus semua catatan
          </button>
        )}
      </div>
    </details>
  );
}

export default function Dashboard() {
  const tracker = useTracker();
  const sync = useSyncStatus();
  const today = useToday();
  const [range, setRange] = useState("90");
  const [filter, setFilter] = useState(null);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!tracker || !today) {
    return <main className="min-h-dvh bg-aspal" aria-busy="true" />;
  }

  const { runs, goalKm, saveError } = tracker;
  const ranged = inRange(runs, range, today);
  const summary = summarize(ranged);
  const previous = previousRange(runs, range, today);
  const before = previous ? summarize(previous) : null;
  const logRuns = filter ? runs.filter(filter.match) : ranged;
  const shoes = shoeTotals(runs);
  const hasSample = runs.some((run) => run.sample);

  function toggleFilter(key, label, match) {
    setFilter(filter?.key === key ? null : { key, label, match });
  }

  function handleDelete(run) {
    deleteRun(run.id);
    setToast({
      message: `Lari ${shortDate(run.date)} dihapus.`,
      undo: () => saveRun(run),
    });
  }

  function handleSave(run) {
    saveRun(run);
    setForm(null);
    setToast({ message: `${formatDistance(run.km)} km tersimpan.` });
  }

  return (
    <div className="min-h-dvh bg-aspal text-kertas">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-aspal/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href="/" className="whitespace-nowrap font-display text-xl font-black uppercase tracking-wide sm:text-2xl">
            Pelari Kalcer
          </Link>
          <div className="flex items-center gap-2">
            <SyncControl />
            <DataMenu hasRuns={runs.length > 0} onToast={setToast} />
            <button
              type="button"
              onClick={() => setForm({ run: null })}
              className="h-11 whitespace-nowrap rounded-md bg-oranye px-4 font-display text-xl sm:px-5 font-extrabold uppercase text-aspal transition-colors hover:bg-marka"
            >
              Catat lari
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 sm:px-8 sm:py-8">
        {saveError && (
          <p role="alert" className="rounded-lg bg-oranye px-4 py-3 font-medium text-aspal">
            Browser menolak menyimpan data. Ekspor cadangan sekarang sebelum menutup halaman.
          </p>
        )}

        {hasSample && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-marka/50 px-4 py-3 text-sm">
            <p>Ini data contoh, bukan lari kamu.</p>
            <button
              type="button"
              onClick={removeSampleRuns}
              className="font-medium text-marka underline underline-offset-4"
            >
              Hapus data contoh
            </button>
          </div>
        )}

        {runs.length === 0 ? (
          <EmptyState today={today} onAdd={() => setForm({ run: null })} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="font-display text-5xl font-black uppercase leading-none sm:text-6xl">
                Tracker lari
              </h1>
              <div role="group" aria-label="Rentang waktu" className="flex rounded-md bg-panel p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={range === item.id}
                    onClick={() => setRange(item.id)}
                    className={`h-9 rounded px-3 text-sm font-medium transition-colors ${
                      range === item.id ? "bg-kertas text-aspal" : "hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <GoalPanel progress={monthProgress(runs, today, goalKm)} goalKm={goalKm} />
              <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:col-span-7">
                <Tile
                  label="Total jarak"
                  value={formatDistance(summary.km)}
                  foot={
                    <Delta
                      now={summary.km}
                      before={before?.km}
                      format={(value) => `${formatDistance(value)} km`}
                    />
                  }
                />
                <Tile
                  label="Pace rata-rata"
                  value={summary.pace ? formatClock(summary.pace) : "–"}
                  foot={
                    <Delta
                      now={summary.pace}
                      before={before?.pace}
                      invert
                      format={(value) => `${formatClock(value)}/km`}
                    />
                  }
                />
                <Tile
                  label="Jumlah lari"
                  value={summary.count}
                  foot={`${formatHours(summary.seconds)} di jalan`}
                />
                <Tile
                  label="Streak"
                  value={weekStreak(runs, today)}
                  foot="minggu berturut-turut"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Panel title="Kilometer per minggu" className="lg:col-span-8">
                <WeeklyBars
                  weeks={weeklyTotals(runs, today)}
                  selected={filter?.key.startsWith("week:") ? filter.key.slice(5) : null}
                  onSelect={(week) =>
                    toggleFilter(
                      `week:${week.start}`,
                      `Minggu ${weekLabel(week)}`,
                      (run) => run.date >= week.start && run.date <= addDays(week.start, 6),
                    )
                  }
                />
              </Panel>
              <Panel title="Rekor pribadi" className="lg:col-span-4">
                <Records records={personalBests(runs)} />
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Panel title="Kalender lari" className="lg:col-span-8">
                <Heatmap
                  days={heatmapDays(runs, today)}
                  selected={filter?.key.startsWith("day:") ? filter.key.slice(4) : null}
                  onSelect={(day) =>
                    toggleFilter(`day:${day.date}`, fullDate(day.date), (run) => run.date === day.date)
                  }
                />
              </Panel>
              <Panel title="Sepatu" className="lg:col-span-4">
                <Shoes
                  shoes={shoes}
                  selected={filter?.key.startsWith("shoe:") ? filter.key.slice(5) : null}
                  onSelect={(name) =>
                    toggleFilter(`shoe:${name}`, name, (run) => run.shoe === name)
                  }
                />
              </Panel>
            </div>

            <Panel title="Tren pace">
              <PaceTrend runs={ranged} />
            </Panel>

            <Panel
              title="Riwayat lari"
              action={
                filter && (
                  <button
                    type="button"
                    onClick={() => setFilter(null)}
                    className="h-9 rounded-md bg-marka px-3 text-sm font-medium text-aspal"
                  >
                    {filter.label} ✕
                  </button>
                )
              }
            >
              <RunLog
                runs={logRuns}
                onEdit={(run) => setForm({ run })}
                onDelete={handleDelete}
              />
            </Panel>
          </>
        )}

        <p className="pb-4 font-mono text-xs text-white/70">
          {sync.user
            ? "Catatan lari tersinkron ke akun kamu."
            : syncConfigured
              ? "Data tersimpan di browser ini. Masuk supaya tersinkron ke perangkat lain."
              : "Data tersimpan di browser ini saja. Ekspor cadangan secara berkala."}
        </p>
      </main>

      {form && (
        <RunForm
          key={form.run?.id ?? "new"}
          run={form.run}
          runs={runs}
          today={today}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-4 rounded-lg bg-kertas px-4 py-3 text-aspal shadow-2xl"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
              className="text-sm font-bold text-biru underline underline-offset-4"
            >
              Batalkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
