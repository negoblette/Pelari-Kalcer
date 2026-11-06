"use client";

import { useEffect, useRef, useState } from "react";
import {
  sendMagicLink,
  signOut,
  startSync,
  syncConfigured,
  syncNow,
  useSyncStatus,
} from "./sync";

const LABELS = {
  idle: "Tersinkron",
  syncing: "Menyinkronkan",
  offline: "Offline",
  error: "Gagal sinkron",
};

function formatTime(iso) {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}.${minutes}`;
}

function SyncDialog({ status, onClose }) {
  const dialogRef = useRef(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function handleSend(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (failure) {
      setError(
        failure?.status === 429
          ? "Terlalu sering meminta tautan. Tunggu beberapa menit."
          : "Tautan gagal dikirim. Cek koneksi dan alamat email kamu.",
      );
    }
    setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    setError("");
    const done = await signOut();
    setBusy(false);
    if (done) onClose();
    else setError("Keluar dibatalkan karena data belum tersinkron. Coba lagi saat online.");
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="sync-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-kertas p-5 text-aspal backdrop:bg-black/70 sm:p-7"
    >
      <h2 id="sync-title" className="font-display text-4xl font-black uppercase leading-none">
        Sinkron perangkat
      </h2>

      {status.user ? (
        <>
          <p className="mt-4 break-all font-medium">{status.user.email}</p>
          <p className="mt-1 text-sm text-aspal/70">
            {status.lastSyncedAt
              ? `Terakhir tersinkron ${formatTime(status.lastSyncedAt)}`
              : LABELS[status.phase]}
          </p>
          {status.phase === "error" && (
            <p className="mt-3 text-sm font-medium text-biru">
              Sinkron gagal. Data tetap aman di perangkat ini.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="h-11 rounded-md px-4 font-medium hover:bg-aspal/10 disabled:opacity-50"
            >
              Keluar
            </button>
            <button
              type="button"
              onClick={syncNow}
              disabled={status.phase === "syncing"}
              className="h-11 rounded-md bg-oranye px-5 font-display text-xl font-extrabold uppercase text-aspal hover:bg-biru hover:text-kertas disabled:opacity-50"
            >
              Sinkron sekarang
            </button>
          </div>
        </>
      ) : sent ? (
        <p className="mt-4 leading-relaxed">
          Tautan masuk dikirim ke <strong className="break-all">{email}</strong>. Buka
          emailnya di perangkat ini, lalu klik tautannya.
        </p>
      ) : (
        <form onSubmit={handleSend}>
          <p className="mt-3 leading-relaxed text-aspal/80">
            Masuk dengan email supaya catatan lari sama di semua perangkat. Tidak perlu
            kata sandi, dan lari yang sudah ada di sini ikut tersimpan.
          </p>
          <label className="mt-5 block font-mono text-xs text-aspal/70">
            Email
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border-2 border-aspal bg-white px-3 font-sans text-base text-aspal outline-none focus:border-biru"
            />
          </label>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-md bg-oranye px-5 font-display text-xl font-extrabold uppercase text-aspal hover:bg-biru hover:text-kertas disabled:opacity-50"
            >
              {busy ? "Mengirim" : "Kirim tautan"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-biru">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-3 h-10 w-full rounded-md text-sm font-medium text-aspal/70 hover:bg-aspal/10"
      >
        Tutup
      </button>
    </dialog>
  );
}

export default function SyncControl() {
  const status = useSyncStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startSync();
  }, []);

  if (!syncConfigured) return null;

  const label = status.user ? LABELS[status.phase] : "Masuk";
  const problem = status.user && status.phase !== "idle" && status.phase !== "syncing";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sinkron perangkat: ${label}`}
        className="flex h-11 items-center gap-2 rounded-md border border-white/20 px-3 text-sm font-medium hover:border-white/50"
      >
        {status.user && (
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${problem ? "bg-oranye" : "bg-marka"}`}
          />
        )}
        <span className={status.user ? "hidden md:inline" : ""}>{label}</span>
      </button>
      {open && <SyncDialog status={status} onClose={() => setOpen(false)} />}
    </>
  );
}
