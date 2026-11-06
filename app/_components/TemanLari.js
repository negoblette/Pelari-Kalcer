"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "./Avatar";
import ChatPanel from "./ChatPanel";
import FriendProfile from "./FriendProfile";
import {
  addFriend,
  createProfile,
  getMyProfile,
  listFriends,
  removeFriend,
  respondFriend,
  unreadCounts,
} from "./friends";
import { buildStats, friendView } from "./insights";
import ProfileForm from "./ProfileForm";
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
const REFRESH_MS = 20000;
const BUTTON =
  "h-12 bg-aspal px-6 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-biru disabled:opacity-50";

function Shell({ children }) {
  return (
    <section className="min-h-[70dvh] bg-marka py-12 text-aspal lg:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
          Teman
        </h1>
        {children}
      </div>
    </section>
  );
}

function statusLine(view, area) {
  return [STATUS_LABEL[view.status] ?? "Belum absen", area].filter(Boolean).join(" · ");
}

function FriendRow({ friend, active, unread, onChat, onOpen, onRemove }) {
  return (
    <li className={`flex items-center gap-3 p-3 ${active ? "bg-aspal text-kertas" : "bg-kertas"}`}>
      <button
        type="button"
        onClick={onChat}
        aria-label={`Chat dengan ${friend.name}${unread ? `, ${unread} pesan baru` : ""}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar seed={friend.avatar} size={48} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-2xl font-black uppercase leading-none">
            {friend.name}
          </span>
          <span className="mt-1 block truncate font-mono text-xs">{statusLine(friend.view, friend.area)}</span>
        </span>
        {unread > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-oranye px-1.5 font-mono text-xs text-aspal">
            {unread}
          </span>
        )}
      </button>
      <div className="flex flex-col items-end gap-1 font-mono text-xs">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Lihat profil ${friend.name}`}
          className="underline underline-offset-4"
        >
          Profil
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus teman ${friend.name}`}
          className="underline underline-offset-4"
        >
          Hapus
        </button>
      </div>
    </li>
  );
}

function BoardRow({ rank, name, area, avatar, view, isMe, onOpen }) {
  return (
    <li
      className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5rem_4rem] ${
        isMe ? "bg-aspal text-kertas" : "bg-marka"
      }`}
    >
      <span className="font-display text-4xl font-black leading-none tabular-nums">{rank}</span>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar seed={avatar} size={44} />
        <div className="min-w-0">
          {isMe ? (
            <Link href="/profil" className="block truncate font-display text-2xl font-black uppercase leading-none underline-offset-4 hover:underline">
              {name} (kamu)
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Lihat profil ${name}`}
              className="block max-w-full truncate text-left font-display text-2xl font-black uppercase leading-none underline underline-offset-4 hover:text-biru"
            >
              {name}
            </button>
          )}
          <p className="mt-1 truncate font-mono text-xs">{statusLine(view, area)}</p>
        </div>
      </div>
      <p className="text-right font-display text-3xl font-black leading-none tabular-nums sm:text-left">
        {formatDistance(view.weekKm)}
        <span className="ml-1 font-mono text-xs font-normal">km</span>
      </p>
      <p className="col-start-2 font-mono text-xs sm:col-start-auto sm:text-sm">
        {view.pace ? `${formatClock(view.pace)}/km` : "Pace –"}
      </p>
      <p className="col-start-3 row-start-2 whitespace-nowrap text-right font-mono text-xs sm:col-start-auto sm:row-start-auto sm:text-sm">
        {view.streak} mgg
      </p>
    </li>
  );
}

export default function TemanLari({ today, entries, onToast }) {
  const { user } = useSyncStatus();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [openFriend, setOpenFriend] = useState(null);
  const [chatFriend, setChatFriend] = useState(null);
  const [unread, setUnread] = useState({});
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
      if (mine) setUnread(await unreadCounts());
      setPhase("ready");
    } catch {
      setPhase((current) => (current === "ready" ? current : "error"));
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => active && load());
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  if (!syncConfigured || !user) {
    return (
      <Shell>
        <p className="mt-5 max-w-lg text-lg leading-relaxed">
          {syncConfigured
            ? "Masuk lewat tombol di bagian atas halaman untuk berteman dan chat."
            : "Fitur teman belum aktif di perangkat ini."}
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
    await run(() => createProfile(name, area, buildStats(entries, today)), "Profil tersimpan.");
  }

  if (!profile) {
    return (
      <Shell>
        <ProfileForm profile={null} busy={busy} onSave={saveProfile} />
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
    const url = `${window.location.origin}/teman?teman=${profile.friend_code}`;
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
  const accepted = friends
    .filter((friend) => friend.state === "accepted")
    .map((friend) => ({
      id: friend.friend_id,
      name: friend.name,
      area: friend.area,
      avatar: friend.avatar,
      view: friendView(friend.stats, today),
      lifetime: friend.stats?.lifetime ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
  const board = [
    {
      id: "me",
      name: profile.display_name,
      area: profile.area,
      avatar: profile.avatar,
      view: friendView(buildStats(entries, today), today),
      isMe: true,
    },
    ...accepted,
  ].sort((a, b) => b.view.weekKm - a.view.weekKm || b.view.streak - a.view.streak);

  function confirmRemove(friend) {
    if (!window.confirm(`Hapus ${friend.name} dari teman?`)) return;
    if (chatFriend?.id === friend.id) setChatFriend(null);
    run(() => removeFriend(friend.id));
  }

  return (
    <>
      <Shell>
        {incoming.length > 0 && (
          <ul className="mt-6 space-y-2">
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

        <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <div className={chatFriend ? "hidden lg:block" : ""}>
            <p className="font-mono text-sm">Daftar teman · {accepted.length}</p>

            {accepted.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {accepted.map((friend) => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    active={chatFriend?.id === friend.id}
                    unread={chatFriend?.id === friend.id ? 0 : unread[friend.id]}
                    onChat={() => setChatFriend(friend)}
                    onOpen={() => setOpenFriend(friend)}
                    onRemove={() => confirmRemove(friend)}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 leading-relaxed">
                Masih sendirian. Bagikan kodemu, atau masukkan kode teman di bawah.
              </p>
            )}

            {outgoing.length > 0 && (
              <p className="mt-3 font-mono text-sm">
                {outgoing.length} permintaan menunggu persetujuan
              </p>
            )}

            <div className="mt-4 bg-kertas p-5">
              <p className="font-mono text-xs">Kode kamu</p>
              <p className="mt-1 font-display text-5xl font-black tracking-wide">{profile.friend_code}</p>
              <button type="button" onClick={handleInvite} className={`${BUTTON} mt-3 w-full`}>
                Undang teman
              </button>

              <form onSubmit={handleAdd} className="mt-5 border-t-2 border-aspal pt-4">
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
            </div>
          </div>

          <div className={`lg:sticky lg:top-20 ${chatFriend ? "" : "hidden lg:block"}`}>
            {chatFriend ? (
              <ChatPanel
                key={chatFriend.id}
                friend={chatFriend}
                userId={userId}
                onClose={() => {
                  setChatFriend(null);
                  load();
                }}
              />
            ) : (
              <div className="flex h-[min(38rem,calc(100dvh-7.5rem))] items-center justify-center bg-kertas p-6 text-center">
                <p className="font-display text-4xl font-black uppercase leading-none">
                  {accepted.length ? "Pilih teman untuk chat" : "Chat muncul di sini"}
                </p>
              </div>
            )}
          </div>
        </div>
      </Shell>

      {board.length > 1 && (
        <section className={`bg-kertas py-12 text-aspal lg:block lg:py-16 ${chatFriend ? "hidden" : ""}`}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
            <h2 className="font-display text-[clamp(3rem,6vw,5rem)] font-black uppercase leading-[0.88]">
              Papan minggu ini
            </h2>
            <p className="mt-2 font-mono text-sm">Reset setiap Senin</p>
            <ol className="mt-5 space-y-2">
              {board.map((row, index) => (
                <BoardRow
                  key={row.id}
                  rank={index + 1}
                  name={row.name}
                  area={row.area}
                  avatar={row.avatar}
                  view={row.view}
                  isMe={row.isMe}
                  onOpen={() => setOpenFriend(row)}
                />
              ))}
            </ol>
          </div>
        </section>
      )}

      {openFriend && (
        <FriendProfile
          name={openFriend.name}
          area={openFriend.area}
          avatar={openFriend.avatar}
          view={openFriend.view}
          lifetime={openFriend.lifetime}
          onClose={() => setOpenFriend(null)}
        />
      )}
    </>
  );
}
