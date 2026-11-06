import { Big_Shoulders, DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({
  variable: "--font-big",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const body = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const mono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Pelari Kalcer",
  description:
    "Tracker lari pribadi: absen lari atau rest, catat jarak dan pace, pantau mileage gear dan streak mingguan.",
  appleWebApp: { capable: true, title: "Kalcer", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#1e3bff" };

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
