"use client";

import { useId } from "react";
import { useRunner } from "./RunnerContext";

export default function NameField() {
  const { name, setName } = useRunner();
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="font-mono text-sm">
        Nama di bib
      </label>
      <input
        id={id}
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={14}
        autoComplete="off"
        spellCheck={false}
        placeholder="Nama kamu"
        className="mt-2 block w-full border-b-4 border-kertas bg-transparent pb-2 font-display text-5xl font-extrabold uppercase text-kertas outline-none placeholder:text-kertas/70 focus:border-marka"
      />
    </div>
  );
}
