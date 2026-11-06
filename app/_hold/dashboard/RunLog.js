"use client";

import { useState } from "react";
import { FEELS, formatClock, formatDistance, paceOf, shortDate } from "@/app/_components/stats";

const PAGE = 10;
const SORTERS = {
  date: (a, b) => b.date.localeCompare(a.date),
  km: (a, b) => b.km - a.km,
  pace: (a, b) => paceOf(a) - paceOf(b),
};

function SortHeader({ id, label, sort, onSort }) {
  return (
    <th scope="col" aria-sort={sort === id ? "descending" : "none"} className="py-3 pr-4 font-normal">
      <button
        type="button"
        onClick={() => onSort(id)}
        className={`font-mono text-xs hover:text-kertas ${sort === id ? "text-marka" : ""}`}
      >
        {label}
      </button>
    </th>
  );
}

export default function RunLog({ runs, onEdit, onDelete }) {
  const [sort, setSort] = useState("date");
  const [showAll, setShowAll] = useState(false);
  const sorted = [...runs].sort(SORTERS[sort]);
  const visible = showAll ? sorted : sorted.slice(0, PAGE);

  if (!runs.length) {
    return <p className="mt-6 text-white/70">Tidak ada lari di pilihan ini.</p>;
  }

  return (
    <>
      <div className="mt-3">
        <table className="w-full text-left text-sm">
          <thead className="text-white/70">
            <tr className="border-b border-white/15">
              <SortHeader id="date" label="Tanggal" sort={sort} onSort={setSort} />
              <SortHeader id="km" label="Jarak" sort={sort} onSort={setSort} />
              <th scope="col" className="hidden py-3 pr-4 font-mono text-xs font-normal sm:table-cell">
                Waktu
              </th>
              <SortHeader id="pace" label="Pace" sort={sort} onSort={setSort} />
              <th scope="col" className="hidden py-3 pr-4 font-mono text-xs font-normal lg:table-cell">
                Rute
              </th>
              <th scope="col" className="hidden py-3 pr-4 font-mono text-xs font-normal lg:table-cell">
                Sepatu
              </th>
              <th scope="col" className="hidden py-3 pr-4 font-mono text-xs font-normal md:table-cell">
                Rasa
              </th>
              <th scope="col" className="py-3 text-right font-mono text-xs font-normal">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((run) => (
              <tr key={run.id} className="border-b border-white/10 hover:bg-white/[.04]">
                <td className="py-3 pr-4 whitespace-nowrap">{shortDate(run.date)}</td>
                <td className="py-3 pr-4 whitespace-nowrap font-medium tabular-nums">
                  {formatDistance(run.km)} km
                </td>
                <td className="hidden py-3 pr-4 tabular-nums sm:table-cell">
                  {formatClock(run.seconds)}
                </td>
                <td className="py-3 pr-4 tabular-nums">{formatClock(paceOf(run))}</td>
                <td className="hidden max-w-48 truncate py-3 pr-4 lg:table-cell">{run.route || "–"}</td>
                <td className="hidden max-w-40 truncate py-3 pr-4 lg:table-cell">{run.shoe || "–"}</td>
                <td className="hidden py-3 pr-4 md:table-cell">{FEELS[run.feel]}</td>
                <td className="py-1.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onEdit(run)}
                    aria-label={`Ubah lari ${shortDate(run.date)}`}
                    className="h-9 rounded-md px-2.5 font-medium hover:bg-white/10"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(run)}
                    aria-label={`Hapus lari ${shortDate(run.date)}`}
                    className="h-9 rounded-md px-2.5 font-medium text-white/70 hover:bg-white/10 hover:text-kertas"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-4 h-10 rounded-md border border-white/20 px-4 text-sm font-medium hover:border-white/50"
        >
          {showAll ? "Tampilkan lebih sedikit" : `Tampilkan semua (${sorted.length})`}
        </button>
      )}
    </>
  );
}
