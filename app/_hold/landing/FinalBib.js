"use client";

import Bib from "./Bib";
import NameField from "./NameField";
import { downloadBibImage } from "./bibImage";
import { formatPace } from "./data";
import { useRunner } from "./RunnerContext";

export default function FinalBib() {
  const { name, number, tier, distance, pace } = useRunner();

  function handleDownload() {
    downloadBibImage({
      name: name.trim() || "Nama kamu",
      number,
      tier: tier.label,
      distance: distance.label,
      pace: formatPace(pace),
    });
  }

  return (
    <section id="bib" className="scroll-mt-4 bg-biru text-kertas">
      <div className="mx-auto grid max-w-[1400px] items-center gap-x-16 gap-y-14 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        <div>
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Bib kamu sudah jadi.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Unduh sebagai gambar 4:5, pas buat diunggah sebelum lari. Atau
            sesudah. Atau sebagai pengganti lari.
          </p>
          <div className="mt-8 max-w-md">
            <NameField />
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="mt-8 bg-marka px-7 py-4 font-display text-2xl font-extrabold uppercase text-aspal transition-colors hover:bg-kertas"
          >
            Unduh bib
          </button>
        </div>

        <div className="mx-auto w-full max-w-[26rem] lg:max-w-[30rem]">
          <Bib rest="2deg" />
        </div>
      </div>

      <footer className="border-t border-kertas/30">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-x-8 gap-y-2 px-4 py-6 font-mono text-sm sm:px-8">
          <p>Dibuat buat yang larinya pelan tapi niat.</p>
          <p>Harga dan rute di halaman ini perkiraan.</p>
        </div>
      </footer>
    </section>
  );
}
