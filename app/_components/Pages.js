"use client";

import AiCoach from "./AiCoach";
import AppShell from "./AppShell";
import Feed from "./Feed";
import Gear from "./Gear";
import Quests from "./Quests";
import RaceMode from "./RaceMode";
import Recap from "./Recap";
import TemanLari from "./TemanLari";
import WeekPlan from "./WeekPlan";

export function LatihanPage() {
  return (
    <AppShell>
      {({ today, entries, gear, prefs, onToast }) => (
        <>
          <h1 className="sr-only">Latihan</h1>
          <WeekPlan today={today} entries={entries} plan={prefs.plan} onToast={onToast} />
          <AiCoach today={today} entries={entries} plan={prefs.plan} race={prefs.race} onToast={onToast} />
          <RaceMode today={today} entries={entries} race={prefs.race} />
          <Quests today={today} entries={entries} plan={prefs.plan} />
          <Recap today={today} entries={entries} gear={gear} onToast={onToast} />
        </>
      )}
    </AppShell>
  );
}

export function GearPage() {
  return (
    <AppShell>{({ gear, entries }) => <Gear gear={gear} entries={entries} />}</AppShell>
  );
}

export function TemanPage() {
  return (
    <AppShell>
      {({ today, entries, onToast }) => (
        <TemanLari today={today} entries={entries} onToast={onToast} />
      )}
    </AppShell>
  );
}

export function FeedPage() {
  return <AppShell>{({ onToast }) => <Feed onToast={onToast} />}</AppShell>;
}
