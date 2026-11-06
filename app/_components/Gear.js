"use client";

import { useEffect, useRef, useState } from "react";
import { GEAR_KINDS, formatDistance, gearMileage } from "./stats";
import { deleteGearItem, saveGearItem } from "./store";

const WARN_RATIO = 0.75;
const LABEL = "block font-mono text-xs";
const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";

function GearForm({ item, onClose }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState(item?.kind ?? GEAR_KINDS[0]);
  const [startKm, setStartKm] = useState(item?.startKm ? String(item.startKm) : "");
  const [limitKm, setLimitKm] = useState(item ? String(item.limitKm ?? "") : "800");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function submit(event) {
    event.preventDefault();
    saveGearItem({
      ...item,
      id: item?.id ?? crypto.randomUUID(),
      name: name.trim(),
      kind,
      startKm: Number(startKm.replace(",", ".")) || 0,
      limitKm: Number(limitKm.replace(",", ".")) || 0,
    });
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="gear-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-kertas p-5 text-aspal backdrop:bg-biru/80 sm:p-7"
    >
      <form onSubmit={submit}>
        <h2 id="gear-form-title" className="font-display text-5xl font-black uppercase leading-none">
          {item ? "Ubah gear" : "Tambah gear"}
        </h2>
        <label className={`${LABEL} mt-5`}>
          Nama
          <input
            required
            autoFocus
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className={`${LABEL} mt-4`}>
          Jenis
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={FIELD}>
            {GEAR_KINDS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className={LABEL}>
            Sudah terpakai (km)
            <input
              inputMode="decimal"
              placeholder="0"
              value={startKm}
              onChange={(event) => setStartKm(event.target.value)}
              className={FIELD}
            />
          </label>
          <label className={LABEL}>
            Batas pakai (km)
            <input
              inputMode="decimal"
              placeholder="Tanpa batas"
              value={limitKm}
              onChange={(event) => setLimitKm(event.target.value)}
              className={FIELD}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-13 px-5 font-medium hover:bg-aspal/10">
            Batal
          </button>
          <button
            type="submit"
            className="h-13 bg-biru px-8 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
          >
            Simpan
          </button>
        </div>
      </form>
    </dialog>
  );
}

function GearCard({ item, entries, onEdit }) {
  const km = gearMileage(item, entries);
  const used = entries.some((entry) => entry.gearId === item.id);
  const ratio = item.limitKm ? Math.min(km / item.limitKm, 1) : 0;
  const worn = item.limitKm > 0 && km / item.limitKm >= WARN_RATIO;

  return (
    <li className={`bg-panel p-5 sm:p-6 ${item.retired ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-kertas/70">
            {item.kind}
            {item.retired ? " · Pensiun" : ""}
          </p>
          <h3 className="mt-1 truncate font-display text-3xl font-black uppercase leading-none">
            {item.name}
          </h3>
        </div>
        <p className="shrink-0 text-right font-display text-5xl font-black leading-none text-marka tabular-nums">
          {formatDistance(km)}
          <span className="ml-1 font-mono text-sm font-normal text-kertas">km</span>
        </p>
      </div>

      {item.limitKm > 0 && (
        <>
          <div className="relative mt-5 h-5 overflow-hidden bg-black">
            <div
              className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${worn ? "bg-oranye" : "bg-terang"}`}
              style={{ width: `${ratio * 100}%` }}
            />
            <div className="road-marks absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
          </div>
          <p className={`mt-2 font-mono text-xs ${worn ? "text-marka" : "text-kertas/70"}`}>
            {worn
              ? `Mendekati batas ${item.limitKm} km, cek kondisinya`
              : `Batas pakai ${item.limitKm} km`}
          </p>
        </>
      )}

      <div className="mt-4 flex gap-4 text-sm font-medium">
        <button type="button" onClick={onEdit} className="underline underline-offset-4 hover:text-marka">
          Ubah
        </button>
        <button
          type="button"
          onClick={() => saveGearItem({ ...item, retired: !item.retired })}
          className="underline underline-offset-4 hover:text-marka"
        >
          {item.retired ? "Aktifkan lagi" : "Pensiunkan"}
        </button>
        {!used && (
          <button
            type="button"
            onClick={() => deleteGearItem(item.id)}
            className="underline underline-offset-4 hover:text-marka"
          >
            Hapus
          </button>
        )}
      </div>
    </li>
  );
}

export default function Gear({ gear, entries }) {
  const [form, setForm] = useState(null);
  const sorted = [...gear].sort((a, b) => Boolean(a.retired) - Boolean(b.retired));

  return (
    <section id="gear" className="scroll-mt-4 bg-aspal text-kertas">
      <div aria-hidden="true" className="overflow-hidden border-b border-kertas/15 py-5">
        <div className="road-strip h-2" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Gear saya
          </h1>
          <button
            type="button"
            onClick={() => setForm({ item: null })}
            className="h-14 bg-oranye px-7 font-display text-2xl font-extrabold uppercase text-aspal transition-colors hover:bg-marka"
          >
            Tambah gear
          </button>
        </div>

        {sorted.length ? (
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((item) => (
              <GearCard
                key={item.id}
                item={item}
                entries={entries}
                onEdit={() => setForm({ item })}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-8 max-w-lg text-lg leading-relaxed">
            Belum ada gear. Tambahkan sepatu kamu, lalu pilih saat mengisi detail lari
            supaya jaraknya terhitung otomatis.
          </p>
        )}
      </div>

      {form && (
        <GearForm
          key={form.item?.id ?? "new"}
          item={form.item}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  );
}
