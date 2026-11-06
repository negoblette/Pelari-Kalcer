"use client";

import { useEffect, useRef, useState } from "react";
import InstallButton from "./InstallButton";
import SiteHeader from "./SiteHeader";
import { exportData, importData, removeSampleRuns, useToday, useTracker } from "./store";

function DataLinks({ onToast }) {
  const fileRef = useRef(null);

  async function handleImport(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const count = await importData(file);
      onToast({ message: `${count} catatan berhasil diimpor.` });
    } catch {
      onToast({ message: "File tidak bisa dibaca. Gunakan hasil ekspor tracker ini." });
    }
  }

  return (
    <div className="flex flex-wrap gap-5">
      <InstallButton onToast={onToast} />
      <button type="button" onClick={exportData} className="underline underline-offset-4 hover:text-marka">
        Ekspor cadangan
      </button>
      <button
        type="button"
        onClick={() => fileRef.current.click()}
        className="underline underline-offset-4 hover:text-marka"
      >
        Impor cadangan
      </button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
    </div>
  );
}

export default function AppShell({ children }) {
  const tracker = useTracker();
  const today = useToday();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!tracker || !today) {
    return <main className="min-h-dvh bg-biru" aria-busy="true" />;
  }

  const { runs: entries, gear, prefs, saveError } = tracker;
  const hasSample = entries.some((entry) => entry.sample);

  return (
    <>
      <SiteHeader />
      <main>
        {saveError && (
          <p role="alert" className="bg-oranye px-4 py-3 text-center font-medium text-aspal">
            Browser menolak menyimpan data. Ekspor cadangan sekarang sebelum menutup halaman.
          </p>
        )}
        {hasSample && (
          <p className="bg-marka px-4 py-2 text-center text-sm font-medium text-aspal">
            Masih ada data contoh dari versi sebelumnya.{" "}
            <button type="button" onClick={removeSampleRuns} className="underline underline-offset-4">
              Hapus data contoh
            </button>
          </p>
        )}
        {children({ today, entries, gear, prefs, onToast: setToast })}
      </main>

      <footer className="bg-biru text-kertas">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-x-8 gap-y-3 px-4 py-6 font-mono text-sm sm:px-8">
          <p>
            &copy; 2026 Pelari Kalcer · Dibuat oleh{" "}
            <a href="https://github.com/negoblette" className="underline underline-offset-4 hover:text-marka">
              Nello Aurelius
            </a>
          </p>
          <DataLinks onToast={setToast} />
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-4 bg-aspal px-4 py-3 text-kertas shadow-2xl"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
              className="text-sm font-bold text-marka underline underline-offset-4"
            >
              Batalkan
            </button>
          )}
        </div>
      )}
    </>
  );
}
