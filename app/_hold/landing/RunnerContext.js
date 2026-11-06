"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_FIT,
  DISTANCES,
  SLOTS,
  bibNumber,
  summarizeFit,
} from "./data";

const RunnerContext = createContext(null);

export function RunnerProvider({ children }) {
  const [name, setName] = useState("");
  const [fit, setFit] = useState(DEFAULT_FIT);
  const [distanceId, setDistanceId] = useState("10k");
  const [pace, setPace] = useState(450);

  const value = useMemo(() => {
    const pick = (slotId, optionId) =>
      setFit((current) => ({ ...current, [slotId]: optionId }));

    const shuffle = () =>
      setFit(
        Object.fromEntries(
          SLOTS.map(({ id, options }) => [
            id,
            options[Math.floor(Math.random() * options.length)].id,
          ]),
        ),
      );

    return {
      name,
      setName,
      fit,
      pick,
      shuffle,
      pace,
      setPace,
      distance: DISTANCES.find((item) => item.id === distanceId),
      setDistanceId,
      number: bibNumber(name),
      ...summarizeFit(fit),
    };
  }, [name, fit, distanceId, pace]);

  return (
    <RunnerContext.Provider value={value}>{children}</RunnerContext.Provider>
  );
}

export function useRunner() {
  return useContext(RunnerContext);
}
