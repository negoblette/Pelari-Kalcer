import Link from "next/link";
import Bib from "./Bib";
import Countdown from "./Countdown";
import NameField from "./NameField";

const LINKS = [
  { href: "#fit", label: "Fit Check" },
  { href: "#pace", label: "Pace" },
  { href: "#rute", label: "Rute" },
  { href: "#bib", label: "Bib" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Hero() {
  return (
    <section className="bg-biru text-kertas">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <nav
          aria-label="Utama"
          className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5"
        >
          <a
            href="#"
            className="font-display text-2xl font-black uppercase tracking-wide"
          >
            Pelari Kalcer
          </a>
          <ul className="hidden gap-7 text-sm font-medium md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-marka">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Countdown />
        </nav>

        <div className="grid items-center gap-x-12 gap-y-14 pb-20 pt-8 lg:grid-cols-[1.3fr_1fr] lg:pt-12">
          <div>
            <h1 className="font-display text-[19vw] font-black uppercase leading-[0.86] lg:text-[min(10.5vw,9.75rem)]">
              Pace boleh
              <br />
              santai.
              <span className="block text-marka">
                Fit harus
                <br />
                serius.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed">
              Rumah buat pelari yang kudos-nya lebih kencang dari larinya. Isi
              nama, racik fit, atur pace. Semuanya tercetak di bib kamu.
            </p>
            <div className="mt-8 grid max-w-xl items-end gap-6 sm:grid-cols-[1fr_auto]">
              <NameField />
              <a
                href="#fit"
                className="bg-kertas px-6 py-4 text-center font-display text-2xl font-extrabold uppercase text-biru transition-colors hover:bg-marka hover:text-aspal"
              >
                Racik fit
              </a>
            </div>
            <Link
              href="/dashboard"
              className="mt-6 inline-block border-b-2 border-marka pb-1 font-display text-2xl font-extrabold uppercase text-marka hover:border-kertas hover:text-kertas"
            >
              Buka tracker lari
            </Link>
          </div>

          <div className="bib-in mx-auto w-full max-w-[26rem] lg:max-w-none">
            <Bib />
          </div>
        </div>
      </div>
    </section>
  );
}
