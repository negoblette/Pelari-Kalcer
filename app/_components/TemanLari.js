"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addFriend,
  createProfile,
  getMyProfile,
  listFriends,
  removeFriend,
  respondFriend,
  updateProfile,
} from "./friends";
import { buildStats, friendView } from "./insights";
import { formatClock, formatDistance } from "./stats";
import { syncConfigured, useSyncStatus } from "./sync";

const STATUS_LABEL = { run: "Lari", rest: "Rest" };
const ADD_MESSAGES = {
  requested: "Permintaan terkirim. Menunggu persetujuan temanmu.",
  accepted: "Kalian sudah berteman.",
  exists: "Kalian sudah terhubung atau permintaannya sudah ada.",
  not_found: "Kode tidak ditemukan. Periksa lagi.",
  self: "Itu kode kamu sendiri.",
};
const FIELD =
  "mt-1.5 h-12 w-full border-2 border-aspal bg-white px-3 text-base text-aspal outline-none focus:border-biru";
const LABEL = "block font-mono text-xs";
const BUTTON =
  "h-12 bg-aspal px-6 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru disabled:opacity-50";

function Shell({ children }) {
  return (
    <section id="teman" className="scroll-mt-4 bg-marka py-16 text-aspal lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
          Teman lari
        </h2>
        {children}
      </div>
    </section>
  );
}

function ProfileForm({ profile, onSave, onCancel, busy }) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [area, setArea] = useState(profile?.area ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(name.trim(), area.trim());
      }}
      className="mt-6 max-w-lg bg-kertas p-5 sm:p-6"
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

function BoardRow({ rank, name, area, view, isMe, onRemove }) {
  return (
    <li
      className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5rem_7rem] ${
        isMe ? "bg-aspal text-kertas" : "bg-kertas"
      }`}
    >
      <span className="font-display text-4xl font-black leading-none tabular-nums">{rank}</span>
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-black uppercase leading-none">
          {name}
          {isMe ? " (kamu)" : ""}
        </p>
        <p className="mt-1 truncate font-mono text-xs">
          {[STATUS_LABEL[view.status] ?? "Belum absen", area].filter(Boolean).join(" · ")}
        </p>
      </div>
      <p className="text-right font-display text-3xl font-black leading-none tabular-nums sm:text-left">
        {formatDistance(view.weekKm)}
        <span className="ml-1 font-mono text-xs font-normal">km</span>
      </p>
      <p className="col-start-2 font-mono text-xs sm:col-start-auto sm:text-sm">
        {view.pace ? `${formatClock(view.pace)}/km` : "Pace –"}
      </p>
      <div className="col-start-3 row-start-2 flex items-center justify-end gap-3 font-mono text-xs sm:col-start-auto sm:row-start-auto sm:text-sm">
        <span className="whitespace-nowrap">{view.streak} mgg</span>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Hapus teman ${name}`} className="underline underline-offset-4">
            Hapus
          </button>
        )}
      </div>
    </li>
  );
}

export default function TemanLari({ today, entries, onToast }) {
  const { user } = useSyncStatus();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(
    () => new URLSearchParams(window.location.search).get("teman") ?? "",
  );

  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const mine = await getMyProfile();
      setProfile(mine);
      setFriends(mine ? await listFriends() : []);
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => active && load());
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, [load]);

  if (!syncConfigured) return null;

  if (!user) {
    return (
      <Shell>
        <p className="mt-5 max-w-lg text-lg leading-relaxed">
          Masuk lewat tombol di bagian atas halaman untuk berteman dan membandingkan
          streak mingguan.
        </p>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <p className="mt-5 max-w-lg text-lg leading-relaxed">
          Teman lari belum bisa dimuat. Cek koneksi, lalu buka lagi halamannya.
        </p>
      </Shell>
    );
  }

  if (phase === "loading") {
    return (
      <Shell>
        <p className="mt-5 font-mono text-sm">Memuat teman</p>
      </Shell>
    );
  }

  async function run(action, message) {
    setBusy(true);
    try {
      await action();
      await load();
      if (message) onToast({ message });
    } catch {
      onToast({ message: "Belum berhasil. Coba lagi." });
    }
    setBusy(false);
  }

  async function saveProfile(name, area) {
    await run(
      () =>
        profile
          ? updateProfile(userId, name, area)
          : createProfile(name, area, buildStats(entries, today)),
      "Profil tersimpan.",
    );
    setEditing(false);
  }

  if (!profile || editing) {
    return (
      <Shell>
        <ProfileForm
          key={profile?.friend_code ?? "new"}
          profile={profile}
          busy={busy}
          onSave={saveProfile}
          onCancel={profile ? () => setEditing(false) : null}
        />
      </Shell>
    );
  }

  async function handleAdd(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await addFriend(code.trim());
      onToast({ message: ADD_MESSAGES[result] ?? "Belum berhasil. Coba lagi." });
      if (result === "requested" || result === "accepted") setCode("");
      await load();
    } catch {
      onToast({ message: "Belum berhasil. Coba lagi." });
    }
    setBusy(false);
  }

  async function handleInvite() {
    const url = `${window.location.origin}/?teman=${profile.friend_code}`;
    const text = `Yuk jadi teman lari di Pelari Kalcer. Kode saya: ${profile.friend_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        /* the visitor closed the share sheet */
      }
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    onToast({ message: "Undangan disalin." });
  }

  const incoming = friends.filter((friend) => friend.state === "incoming");
  const outgoing = friends.filter((friend) => friend.state === "outgoing");
  const board = [
    {
      id: "me",
      name: profile.display_name,
      area: profile.area,
      view: friendView(buildStats(entries, today), today),
      isMe: true,
    },
    ...friends
      .filter((friend) => friend.state === "accepted")
      .map((friend) => ({
        id: friend.friend_id,
        name: friend.name,
        area: friend.area,
        view: friendView(friend.stats, today),
      })),
  ].sort((a, b) => b.view.weekKm - a.view.weekKm || b.view.streak - a.view.streak);

  return (
    <Shell>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="font-mono text-sm">Papan minggu ini · reset setiap Senin</p>

          {incoming.length > 0 && (
            <ul className="mt-4 space-y-2">
              {incoming.map((friend) => (
                <li key={friend.friend_id} className="flex flex-wrap items-center justify-between gap-3 bg-biru p-4 text-kertas">
                  <p className="font-display text-2xl font-black uppercase leading-none">
                    {friend.name} ingin berteman
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => respondFriend(friend.friend_id, true), "Kalian sudah berteman.")}
                      className="h-10 bg-kertas px-4 font-display text-xl font-extrabold uppercase text-biru"
                    >
                      Terima
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => respondFriend(friend.friend_id, false))}
                      className="h-10 px-3 font-medium underline underline-offset-4"
                    >
                      Tolak
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <ol className="mt-4 space-y-2">
            {board.map((row, index) => (
              <BoardRow
                key={row.id}
                rank={index + 1}
                name={row.name}
                area={row.area}
                view={row.view}
                isMe={row.isMe}
                onRemove={
                  row.isMe
                    ? null
                    : () => {
                        if (window.confirm(`Hapus ${row.name} dari teman?`)) {
                          run(() => removeFriend(row.id));
                        }
                      }
                }
              />
            ))}
          </ol>

          {outgoing.length > 0 && (
            <p className="mt-3 font-mono text-sm">
              {outgoing.length} permintaan menunggu persetujuan
            </p>
          )}
          {board.length === 1 && (
            <p className="mt-4 max-w-lg leading-relaxed">
              Masih sendirian. Bagikan kodemu, atau masukkan kode teman di samping.
            </p>
          )}
        </div>

        <div className="bg-kertas p-5 sm:p-6">
          <p className="font-mono text-xs">Kode kamu</p>
          <p className="mt-1 font-display text-6xl font-black tracking-wide">{profile.friend_code}</p>
          <button type="button" onClick={handleInvite} className={`${BUTTON} mt-4 w-full`}>
            Undang teman
          </button>

          <form onSubmit={handleAdd} className="mt-6 border-t-2 border-aspal pt-5">
            <label className={LABEL}>
              Kode teman
              <input
                required
                maxLength={8}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className={`${FIELD} font-mono tracking-widest`}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="mt-3 h-12 w-full bg-biru font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal disabled:opacity-50"
            >
              Tambah teman
            </button>
          </form>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Ubah nama dan area
          </button>
        </div>
      </div>
    </Shell>
  );
}
