import { LatihanPage } from "../_components/Pages";
import RegisterServiceWorker from "../_components/RegisterServiceWorker";

export const metadata = {
  title: "Latihan | Pelari Kalcer",
  description: "Rencana mingguan, analisis AI, mode race, quest, dan recap.",
};

export default function Latihan() {
  return (
    <>
      <LatihanPage />
      <RegisterServiceWorker />
    </>
  );
}
