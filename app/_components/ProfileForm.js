"use client";

import { useState } from "react";

const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";
const LABEL = "block font-mono text-xs";
const BUTTON =
  "h-12 bg-aspal px-6 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru disabled:opacity-50";

export default function ProfileForm({ profile, onSave, onCancel, busy }) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [area, setArea] = useState(profile?.area ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(name.trim(), area.trim());
      }}
      className="mt-6 max-w-lg bg-kertas p-5 text-aspal sm:p-6"
    >
      <p className="leading-relaxed">
        Temanmu hanya melihat nama, area, streak, jarak minggu ini, dan pace rata-rata.
        Rute, catatan, dan detail lari tetap privat.
      </p>
      <label className={`${LABEL} mt-4`}>
        Nama tampilan
        <input
          required
          maxLength={30}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={FIELD}
        />
      </label>
      <label className={`${LABEL} mt-4`}>
        Area lari (boleh kosong, cukup nama kawasan)
        <input
          maxLength={40}
          placeholder="Senayan"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          className={FIELD}
        />
      </label>
      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={busy || !name.trim()} className={BUTTON}>
          Simpan
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-12 px-4 font-medium hover:bg-aspal/10">
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
