"use client";

import { SLOTS, formatRupiah, selectedItems } from "./data";
import { useRunner } from "./RunnerContext";

const KM_PER_YEAR = 5 * 52;

function Receipt() {
  const { name, fit, total, score, tier } = useRunner();

  return (
    <div className="drop-shadow-[0_16px_24px_rgb(0_0_0/0.18)]">
      <div className="struk relative bg-white px-6 pb-7 pt-8 font-mono text-sm">
        <p className="text-center font-display text-3xl font-black uppercase">
          Pelari Kalcer
        </p>
        <p className="text-center text-xs">Cabang Minggu Pagi</p>
        <p className="mt-4 truncate text-xs">
          Pelanggan: {name.trim() || "Tanpa nama"}
        </p>

        <ul className="mt-3 space-y-3 border-y border-dashed border-aspal py-4">
          {selectedItems(fit).map(({ slot, item }) => (
            <li
              key={`${slot.id}-${item.id}`}
              className="struk-line flex justify-between gap-4"
            >
              <span>{item.name}</span>
              <span className="shrink-0">
                {item.price ? formatRupiah(item.price) : "Gratis"}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2">
          <div className="flex justify-between gap-4 font-medium">
            <dt>Total fit</dt>
            <dd>{formatRupiah(total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Skor kalcer</dt>
            <dd>{score}/125</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Modal per km*</dt>
            <dd>{formatRupiah(Math.round(total / KM_PER_YEAR))}</dd>
          </div>
        </dl>

        <div className="mt-5 bg-aspal px-4 py-3 text-kertas">
          <p className="font-display text-3xl font-black uppercase leading-none">
            {tier.label}
          </p>
          <p className="mt-1 font-sans text-sm">{tier.note}</p>
        </div>

        <div className="barcode mt-5 h-12" aria-hidden />
        <p className="mt-3 text-xs">*Kalau dipakai 5K tiap minggu, setahun.</p>
      </div>
    </div>
  );
}

export default function FitCheck() {
  const { fit, pick, shuffle } = useRunner();

  return (
    <section id="fit" className="scroll-mt-4 bg-kertas py-20 text-aspal lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 sm:px-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
            Racik fit,
            <br />
            terima struknya.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed">
            Pilih satu dari tiap bagian. Struk menghitung berapa harga sebuah
            lari pagi, dan kategori kamu ikut berubah di bib.
          </p>

          <div className="mt-10 divide-y divide-aspal/20 border-y border-aspal/20">
            {SLOTS.map((slot) => (
              <fieldset
                key={slot.id}
                className="grid gap-3 py-5 sm:grid-cols-[6.5rem_1fr]"
              >
                <legend className="contents">
                  <span className="pt-2 font-display text-2xl font-extrabold uppercase">
                    {slot.label}
                  </span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {slot.options.map((option) => {
                    const active = fit[slot.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => pick(slot.id, option.id)}
                        className={`border-2 border-aspal px-3.5 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-aspal text-kertas"
                            : "hover:bg-aspal/10"
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <button
            type="button"
            onClick={shuffle}
            className="mt-8 bg-biru px-6 py-3 font-display text-2xl font-extrabold uppercase text-kertas transition-colors hover:bg-aspal"
          >
            Acak fit
          </button>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <Receipt />
        </div>
      </div>
    </section>
  );
}
