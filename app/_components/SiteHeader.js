"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Clock from "./Clock";
import { FRIENDS_CHANGED, getMyProfile, listFriends, unreadCounts } from "./friends";
import { useSyncStatus } from "./sync";
import SyncControl from "./SyncControl";

const REFRESH_MS = 30000;
const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/latihan", label: "Latihan" },
  { href: "/gear", label: "Gear" },
  { href: "/teman", label: "Teman" },
  { href: "/feed", label: "Feed" },
];

async function loadSummary() {
  const profile = await getMyProfile();
  if (!profile) return { profile: null, alerts: 0 };
  const [friends, unread] = await Promise.all([listFriends(), unreadCounts()]);
  const requests = friends.filter((friend) => friend.state === "incoming").length;
  const messages = Object.values(unread).reduce((total, count) => total + count, 0);
  return { profile, alerts: requests + messages };
}

function useFriendSummary(userId) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function refresh() {
      if (document.hidden) return;
      try {
        const next = await loadSummary();
        if (active) setSummary(next);
      } catch {
        /* the header keeps its last value while offline */
      }
    }

    Promise.resolve().then(refresh);
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener(FRIENDS_CHANGED, refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(FRIENDS_CHANGED, refresh);
    };
  }, [userId]);

  return userId ? summary : null;
}

function NavLink({ href, label, current, alerts }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        aria-label={alerts ? `${label}, ${alerts} baru` : undefined}
        className={`flex items-center gap-1.5 py-1 hover:text-marka ${current ? "text-marka" : ""}`}
      >
        <span className={current ? "underline decoration-2 underline-offset-6" : ""}>{label}</span>
        {alerts > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-oranye px-1 font-mono text-xs text-aspal">
            {alerts}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { user } = useSyncStatus();
  const summary = useFriendSummary(user?.id);
  const onProfile = pathname === "/profil";

  return (
    <header className="sticky top-0 z-30 border-b border-white/15 bg-biru text-kertas">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-3 px-4 py-1.5 sm:gap-x-6 sm:px-8">
        <Link href="/" className="font-display text-xl font-black uppercase tracking-wide hover:text-marka sm:text-2xl">
          Pelari Kalcer
        </Link>

        <nav aria-label="Utama" className="order-last w-full lg:order-none lg:w-auto">
          <ul className="flex justify-between gap-4 pb-1 text-sm font-medium lg:gap-6 lg:pb-0">
            {LINKS.map((link) => (
              <NavLink
                key={link.href}
                {...link}
                current={pathname === link.href}
                alerts={link.href === "/teman" ? summary?.alerts : 0}
              />
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Clock />
          <Link
            href="/profil"
            aria-label="Profil"
            aria-current={onProfile ? "page" : undefined}
            className={
              summary?.profile
                ? "rounded-full"
                : `text-sm font-medium underline underline-offset-4 hover:text-marka ${onProfile ? "text-marka" : ""}`
            }
          >
            {summary?.profile ? (
              <Avatar
                seed={summary.profile.avatar}
                size={36}
                className={`ring-2 ${onProfile ? "ring-marka" : "ring-kertas"}`}
              />
            ) : (
              "Profil"
            )}
          </Link>
          <SyncControl />
        </div>
      </div>
    </header>
  );
}
