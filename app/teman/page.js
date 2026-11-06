import { TemanPage } from "../_components/Pages";
import RegisterServiceWorker from "../_components/RegisterServiceWorker";

export const metadata = {
  title: "Teman | Pelari Kalcer",
  description: "Daftar teman, chat, dan papan minggu ini.",
};

export default function Teman() {
  return (
    <>
      <TemanPage />
      <RegisterServiceWorker />
    </>
  );
}
