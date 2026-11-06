"use client";

import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import Avatar from "./Avatar";
import { createProfile, getMyProfile, updateProfile } from "./friends";
import { buildStats, lifetimeBadges, lifetimeSummary } from "./insights";
import ProfileForm from "./ProfileForm";
import { BadgeList } from "./Quests";
import {
  formatClock,
  formatDistance,
  formatHours,
  fullDate,
  isRunEntry,
  personalBests,
  shortDate,
} from "./stats";
import { useSyncStatus } from "./sync";

function ProfileBib({ name, summary, badges }) {
  return (
    <div className="bib-tilt">
      <div className="@container relative overflow-hidden rounded-[1.2cqw] bg-kertas text-aspal shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)]">
        <div className="flex items-baseline justify-between bg-oranye px-[6cqw] py-[2.6cqw] font-mono text-[3cqw] font-medium uppercase">
          <span>Pelari Kalcer</span>
          <span>Total kilometer</span>
        </div>
        <div className="px-[8cqw] pt-[4cqw] text-center">
          <p className="font-display text-[34cqw] font-black leading-[0.95] tabular-nums">
            {formatDistance(summary.km)}
          </p>
          <p className="mt-[2cqw] truncate font-display text-[10cqw] font-extrabold uppercase leading-none text-biru">
            {name}
          </p>
        </div>
        <dl className="mx-[8cqw] mt-[5cqw] grid grid-cols-3 gap-[3cqw] border-t-[0.5cqw] border-aspal pt-[2.5cqw] pb-[5cqw]">
          {[
            ["Lari", summary.runs],
            ["Streak terbaik", `${summary.bestStreak} mgg`],
            ["Lencana", badges],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[2.7cqw] uppercase opacity-60">{label}</dt>
              <dd className="m-0 whitespace-nowrap font-display text-[6cqw] font-extrabold uppercase leading-none tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Item({ label, value, detail }) {
  return (
    <div className="border-t-2 border-aspal pt-3">
      <p className="font-mono text-xs">{label}</p>
      <p className="mt-1 truncate font-display text-4xl font-black uppercase leading-none tabular-nums">
        {value}
      </p>
      {detail && <p className="mt-1 font-mono text-xs">{detail}</p>}
    </div>
  );
}

function Profile({ today, allEntries }) {
  const { user } = useSyncStatus();
  const [profile, setProfile] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getMyProfile()
      .then((mine) => {
        if (active) setProfile(mine);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const entries = allEntries.filter((entry) => !entry.sample);
  const summary = lifetimeSummary(entries);
  const badges = lifetimeBadges(entries, today);
  const earned = badges.filter((badge) => badge.done).length;
  const records = personalBests(entries.filter((entry) => isRunEntry(entry) && entry.seconds > 0));
  const name = profile?.display_name ?? (user ? "Pelari baru" : "Pelari tamu");
  const mostKm = Math.max(...summary.types.map((type) => type.km), 1);

  async function saveProfile(nextName, nextArea) {
    setBusy(true);
    try {
      if (profile) await updateProfile(userId, nextName, nextArea);
      else await createProfile(nextName, nextArea, buildStats(entries, today));
      setProfile(await getMyProfile());
      setEditing(false);
    } catch {
      setLoadFailed(true);
    }
    setBusy(false);
  }

  return (
    <>
      <section className="overflow-x-clip bg-biru text-kertas">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <div className="grid items-center gap-x-12 gap-y-14 pb-20 pt-8 lg:grid-cols-[1.3fr_1fr] lg:pt-12">
            <div className="min-w-0">
              <p className="mb-4 font-mono text-sm">
                {summary.firstDate ? `Lari sejak ${fullDate(summary.firstDate)}` : "Belum ada catatan lari"}
              </p>
              {profile && <Avatar seed={profile.avatar} size={112} className="mb-5 ring-4 ring-kertas" />}
              <h1 className="font-display text-[19vw] font-black uppercase leading-[0.86] [overflow-wrap:anywhere] lg:text-[min(10.5vw,9.75rem)]">
                {name}
              </h1>
              <p className="mt-3 font-display text-4xl font-black uppercase text-marka">
                {profile?.area || "Area belum diisi"}
              </p>

              {editing ? (
                <ProfileForm
                  profile={profile}
                  busy={busy}
                  onSave={saveProfile}
                  onCancel={() => setEditing(false)}
                />
              ) : user ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-8 h-14 bg-kertas px-7 font-display text-2xl font-extrabold uppercase text-biru transition-colors hover:bg-marka hover:text-aspal"
                >
                  {profile ? "Ubah profil" : "Lengkapi profil"}
                </button>
              ) : (
                <p className="mt-6 max-w-lg text-lg leading-relaxed">
                  Masuk lewat tombol di atas supaya profil dan catatanmu tersimpan di akun.
                </p>
              )}

              {user && <p className="mt-4 font-mono text-sm [overflow-wrap:anywhere]">{user.email}</p>}
              {loadFailed && <p className="mt-3 font-medium">Profil belum bisa dimuat atau disimpan. Coba lagi nanti.</p>}
            </div>

            <div className="bib-in mx-auto w-full max-w-[26rem] lg:max-w-none">
              <ProfileBib name={name} summary={summary} badges={earned} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-kertas py-16 text-aspal lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Statistik
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Item label="Total jarak" value={`${formatDistance(summary.km)} km`} />
            <Item label="Total lari dan rest" value={`${summary.runs} / ${summary.rests}`} detail="Lari / rest" />
            <Item label="Waktu berlari" value={summary.seconds ? formatHours(summary.seconds) : "–"} />
            <Item label="Pace rata-rata" value={summary.pace ? formatClock(summary.pace) : "–"} />
            <Item
              label="Lari terjauh"
              value={summary.longest ? `${formatDistance(summary.longest.km)} km` : "–"}
              detail={summary.longest ? shortDate(summary.longest.date) : undefined}
            />
            <Item
              label="Pace tercepat"
              value={summary.fastest ? formatClock(summary.fastest.pace) : "–"}
              detail={summary.fastest ? `${formatDistance(summary.fastest.km)} km · ${shortDate(summary.fastest.date)}` : undefined}
            />
            <Item label="Streak terbaik" value={`${summary.bestStreak} minggu`} />
            <Item label="Lencana" value={`${earned} dari ${badges.length}`} />
          </div>
        </div>
      </section>

      <section className="bg-aspal py-16 text-kertas lg:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              Tipe lari
            </h2>
            <ul className="mt-8 space-y-4">
              {summary.types.map((type) => (
                <li key={type.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-display text-2xl font-black uppercase leading-none">{type.label}</p>
                    <p className="font-mono text-sm tabular-nums">
                      {type.count} kali · {formatDistance(type.km)} km
                    </p>
                  </div>
                  <div className="mt-2 h-3 bg-white/10">
                    <div className="h-full bg-oranye" style={{ width: `${(type.km / mostKm) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
              Rekor
            </h2>
            <ul className="mt-8">
              {records.map((record) => (
                <li key={record.label} className="flex items-center justify-between gap-3 border-b border-white/15 py-3">
                  <span className="font-display text-3xl font-black">{record.label}</span>
                  {record.best ? (
                    <span className="text-right">
                      <span className="block font-display text-3xl font-black leading-none text-marka tabular-nums">
                        {formatClock(record.best.time)}
                      </span>
                      <span className="font-mono text-xs text-kertas/70">
                        {formatClock(record.best.pace)}/km · {shortDate(record.best.date)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-kertas/70">Belum tercatat</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-biru py-16 text-kertas lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Lencana
          </h2>
          <BadgeList badges={badges} className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4" />
        </div>
      </section>
    </>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>{({ today, entries }) => <Profile today={today} allEntries={entries} />}</AppShell>
  );
}
