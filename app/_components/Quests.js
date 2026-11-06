"use client";

import { lifetimeBadges, weeklyQuests } from "./insights";

function QuestRow({ quest }) {
  const done = quest.current >= quest.target;
  const percent = Math.min((quest.current / quest.target) * 100, 100);

  return (
    <li className="bg-kertas p-4 text-aspal">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-black uppercase leading-none">{quest.title}</h3>
        <p className="shrink-0 font-mono text-sm">
          {done ? "Selesai" : `${quest.current} dari ${quest.target} ${quest.unit}`}
        </p>
      </div>
      <div className="mt-3 h-3 bg-aspal/15">
        <div
          className={`h-full transition-[width] duration-500 ${done ? "bg-oranye" : "bg-biru"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}

export function BadgeList({ badges, className }) {
  return (
    <ul className={className}>
      {badges.map((badge) => (
        <li
          key={badge.id}
          className={`flex h-24 flex-col justify-between p-3 ${
            badge.done ? "bg-marka text-aspal" : "border-2 border-kertas/40 text-kertas/80"
          }`}
        >
          <span className="font-mono text-xs">{badge.done ? "Terkumpul" : "Terkunci"}</span>
          <span className="font-display text-2xl font-black uppercase leading-none">
            {badge.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Quests({ today, entries, plan }) {
  const quests = weeklyQuests(entries, plan, today);
  const badges = lifetimeBadges(entries, today);
  const finished = quests.filter((quest) => quest.current >= quest.target).length;
  const earned = badges.filter((badge) => badge.done).length;

  return (
    <section id="quest" className="scroll-mt-4 bg-biru py-16 text-kertas lg:py-24">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 sm:px-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Quest <span className="text-marka">mingguan</span>
          </h2>
          <p className="mt-3 font-mono text-sm">
            {finished} dari {quests.length} selesai · reset setiap Senin
          </p>
          <ul className="mt-6 space-y-2">
            {quests.map((quest) => (
              <QuestRow key={quest.id} quest={quest} />
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Lencana
          </h2>
          <p className="mt-3 font-mono text-sm">
            {earned} dari {badges.length} terkumpul
          </p>
          <BadgeList badges={badges} className="mt-6 grid grid-cols-2 gap-2" />
        </div>
      </div>
    </section>
  );
}
